import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Homework images / submission photos are uploaded as base64 strings through
  // Server Actions; raise the default 1MB body cap to fit multi-MB photo uploads
  // (up to 10 photos × ~5MB each, base64-encoded).
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
};

export default nextConfig;
