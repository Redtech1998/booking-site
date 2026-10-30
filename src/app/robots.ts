import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/book"],
        disallow: ["/os", "/os/*", "/api", "/api/*"],
      },
    ],
    sitemap: "https://book.rsegnr.in/sitemap.xml",
  };
}
