export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(`User-agent: *
Allow: /

Sitemap: https://hmsignature.com/sitemap.xml`);
}
