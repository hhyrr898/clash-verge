import siteData from "./src/_data/site.json" with { type: "json" };

export default function(eleventyConfig) {
  eleventyConfig.addGlobalData("site", () => {
    const site = { ...siteData };
    const raw = (process.env.SITE_URL || process.env.SITE_DOMAIN || "").trim().replace(/\/+$/, "");
    if (raw) {
      site.url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    }
    return site;
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addWatchTarget("src/assets");

  eleventyConfig.addCollection("posts", collectionApi => {
    return collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("tagList", collectionApi => {
    const ignored = new Set(["all", "posts"]);
    const tags = new Set();

    for (const item of collectionApi.getAll()) {
      for (const tag of item.data.tags || []) {
        if (!ignored.has(tag)) tags.add(tag);
      }
    }

    return [...tags].sort((a, b) => a.localeCompare(b, "zh-CN"));
  });

  eleventyConfig.addFilter("dateText", date => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  });

  eleventyConfig.addFilter("htmlDateString", date => {
    if (date === "now") return new Date().toISOString().slice(0, 10);
    return new Date(date).toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("limit", (items, count) => {
    return Array.isArray(items) ? items.slice(0, count) : [];
  });

  eleventyConfig.addFilter("tagUrl", tag => `/tags/${encodeURIComponent(tag)}/`);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
}
