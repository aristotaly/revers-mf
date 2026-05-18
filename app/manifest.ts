import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Weight Trend Tracker",
    short_name: "Weight Trend",
    description:
      "Log daily scale weight and view your EWMA-smoothed weight trend.",
    id: "/weight-trend",
    start_url: "/weight-trend",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#5b21b6",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Log weight",
        short_name: "Log",
        description: "Add a new scale weight entry",
        url: "/scale-weight",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Weight trend",
        short_name: "Trend",
        description: "View your EWMA weight trend dashboard",
        url: "/weight-trend",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
