import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { readFileSync } from 'node:fs'

type VercelHeaderEntry = { key: string; value: string }
type VercelConfig = { headers?: { headers?: VercelHeaderEntry[] }[] }

// vercel.json is the only place security headers are declared. A middleware
// applies the same set in dev and preview so a CSP change can be checked in a
// browser before deploy instead of discovered in production.
const vercel = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')
) as VercelConfig

const securityHeaders = vercel.headers?.[0]?.headers ?? []

function applySecurityHeaders(): Plugin {
  const send = (
    req: { url?: string },
    res: { setHeader: (k: string, v: string) => void },
    next: () => void,
    omitCsp: boolean
  ) => {
    // The dev API lives on another port and is proxied; only the document and
    // its own assets need the browser policy.
    if (!req.url?.startsWith('/api/')) {
      for (const entry of securityHeaders) {
        // Vite's dev-mode React refresh preamble is an inline module script, which
        // 'script-src self' blocks. Everything else stays identical; the production
        // policy is still enforced in preview, which serves the real build.
        if (omitCsp && entry.key === 'Content-Security-Policy') continue
        res.setHeader(entry.key, entry.value)
      }
    }
    next()
  }

  return {
    name: 'hm-signature-security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => send(req, res, next, true))
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => send(req, res, next, false))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), applySecurityHeaders()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
