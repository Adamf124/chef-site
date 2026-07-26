import type { MetadataRoute } from "next";
import { site } from "@/site.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.chefName} — Chef Extraordinaire`,
    short_name: site.chefName,
    description: site.tagline,
    start_url: "/studio",
    display: "standalone",
    background_color: "#0e0d0c",
    theme_color: "#0e0d0c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
