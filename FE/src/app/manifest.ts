import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bujirun",
    short_name: "Bujirun",
    description: "Bujirun frontend application",
    start_url: "/",
    display: "standalone",
    background_color: "#97c1ff",
    theme_color: "#97c1ff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
