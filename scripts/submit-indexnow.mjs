import { readFile } from "node:fs/promises";

const siteUrl = (process.env.SITE_URL || process.env.SITE_DOMAIN || "").replace(/\/$/, "");
const indexNowKey = process.env.BING_INDEXNOW_KEY || process.env.INDEXNOW_KEY || "";
const mode = process.env.INDEXNOW_SCOPE || "updated";

if (!siteUrl || !indexNowKey) {
  console.log("SITE_URL/SITE_DOMAIN or BING_INDEXNOW_KEY/INDEXNOW_KEY is missing, skip IndexNow.");
  process.exit(0);
}

const host = new URL(siteUrl).hostname;
const urlList = mode === "all" ? await readUrlsFromSitemap() : await readGeneratedUrls();

if (!urlList.length) {
  console.log("No URLs to submit.");
  process.exit(0);
}

const body = {
  host,
  key: indexNowKey,
  keyLocation: `${siteUrl}/${indexNowKey}.txt`,
  urlList: [...new Set(urlList)].slice(0, 10000)
};

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body)
});

console.log(`IndexNow status: ${res.status}`);

async function readGeneratedUrls() {
  try {
    return JSON.parse(await readFile("generated-urls.json", "utf8"));
  } catch {
    return [];
  }
}

async function readUrlsFromSitemap() {
  try {
    const xml = await readFile("_site/sitemap.xml", "utf8");
    return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  } catch {
    return [];
  }
}
