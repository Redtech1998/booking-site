import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/book"],
        disallow: ["/api", "/api/*"],
      },
    ],
    sitemap: "https://book.rsegnr.in/sitemap.xml",
  };
}
