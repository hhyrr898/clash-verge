import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const count = Math.max(1, Math.min(9, Number(process.env.ARTICLE_COUNT || "1")));
const siteUrl = normalizeSiteUrl(process.env.SITE_URL || process.env.SITE_DOMAIN || "https://clashverge-pc.com");
const apiKey = process.env.GEMINI_API_KEY || "";
const outDir = path.join(process.cwd(), "src", "blog");
const generated = [];
const runStamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

const categories = ["安装教程", "配置指南", "使用技巧", "连接设置", "桌面端", "移动端"];
const tagPool = [
  ["Windows", "安装教程", "桌面端"],
  ["macOS", "安装教程", "桌面端"],
  ["Android", "移动端", "连接设置"],
  ["iOS", "移动端", "连接设置"],
  ["订阅管理", "配置指南", "基础设置"],
  ["规则模式", "配置指南", "使用技巧"],
  ["节点选择", "连接设置", "使用技巧"],
  ["配置备份", "桌面端", "使用技巧"],
  ["DNS", "连接设置", "基础设置"]
];

const titleSeeds = [
  "Clash Verge Windows 新手安装流程",
  "Clash Verge macOS 菜单栏设置说明",
  "Clash Verge Android 连接准备指南",
  "Clash Verge iOS 设备使用要点",
  "Clash Verge 订阅导入与刷新方法",
  "Clash Verge 规则模式切换说明",
  "Clash Verge 节点延迟查看方法",
  "Clash Verge 配置备份与恢复流程",
  "Clash Verge DNS 设置理解"
];

await mkdir(outDir, { recursive: true });

for (let i = 0; i < count; i++) {
  const index = (Date.now() + i) % titleSeeds.length;
  const fallbackTitle = `${titleSeeds[index]} ${new Date().toISOString().slice(0, 10)}`;
  const article = await createArticle(fallbackTitle, index);
  const slug = slugify(article.title);
  const fileName = `${new Date().toISOString().slice(0, 10)}-${runStamp}-${slug}.md`;
  const filePath = path.join(outDir, fileName);
  const tags = ["posts", ...tagPool[index % tagPool.length]];
  const category = categories[index % categories.length];

  const markdown = `---
layout: layouts/post.njk
title: ${yamlString(article.title)}
description: ${yamlString(article.description)}
date: ${new Date(Date.now() - i * 1000).toISOString()}
category: ${yamlString(category)}
tags: ${JSON.stringify(tags)}
imageKeyword: ${yamlString(article.imageKeyword || article.title)}
---

${article.content}

![${article.title} 配图](https://tse-mm.bing.com/th?q=${encodeURIComponent(article.imageKeyword || article.title)})
`;

  if (!existsSync(filePath)) {
    await writeFile(filePath, markdown, "utf8");
    generated.push(`${siteUrl}/blog/${fileName.replace(/\.md$/, "")}/`);
  }
}

await writeFile("generated-urls.json", JSON.stringify(generated, null, 2), "utf8");
console.log(`Generated ${generated.length} article(s).`);

async function createArticle(fallbackTitle, index) {
  if (!apiKey) return fallbackArticle(fallbackTitle, index);

  const prompt = `请围绕 Clash Verge 写一篇中文资源介绍文章。要求：
1. 标题必须是 Clash Verge 长尾标题。
2. 内容表现为正常产品使用文章，不出现和搜索工程、站点操作命令相关的词。
3. 输出严格 JSON：{"title":"","description":"","imageKeyword":"","content":""}
4. content 使用 Markdown，包含 3 个二级标题，每段自然、清晰、可读。`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(text);

    if (parsed.title && parsed.description && parsed.content) return parsed;
  } catch (error) {
    console.warn("Gemini generation failed, using fallback article.");
  }

  return fallbackArticle(fallbackTitle, index);
}

function fallbackArticle(title, index) {
  const topic = titleSeeds[index % titleSeeds.length];
  return {
    title,
    description: `${topic} 的步骤说明、使用建议与常见检查方法。`,
    imageKeyword: topic,
    content: `## 使用前准备

${topic} 需要先确认设备系统、客户端版本和现有配置状态。开始之前，建议把订阅地址、常用配置名称和设备系统版本记录下来，方便后续对照。

## 主要步骤

打开 Clash Verge 后，先检查配置是否存在，再查看节点列表和连接状态。对于新设备，可以先使用默认分组，确认连接顺畅后再整理常用分组。

## 日常建议

保持配置命名清晰，保留一个主用配置和一个备用配置。遇到异常时，先切换节点，再刷新配置，最后查看日志提示。`
  };
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/clash\s*verge/gi, "clash-verge")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function yamlString(value) {
  return JSON.stringify(String(value || ""));
}

function normalizeSiteUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
