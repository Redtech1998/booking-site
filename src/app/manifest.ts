import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RSE Post Production House",
    short_name: "RSE Edit",
    description: "Bespoke Wedding Film Editing & DaVinci Resolve Color Grading",
    start_url: "/book",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#6b2e4c",
    icons: [
      {
        src: "/rse-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/rse-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
