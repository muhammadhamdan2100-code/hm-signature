const LANGUAGES = ["en", "ar", "fr", "es", "ur", "de"];

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${LANGUAGES.map(lang => `  <url><loc>https://hmsignature.com/${lang || ""}</loc></url>`).join("\n")}
</urlset>`);
}
