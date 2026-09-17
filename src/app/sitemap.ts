import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dabiagendai.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/barbearias`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/termos-de-uso`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
