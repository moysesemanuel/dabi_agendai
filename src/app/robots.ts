import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dabiagendai.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/platform", "/agendamentos", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
