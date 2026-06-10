/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: server.js (or the desktop app) serves /out directly.
  // The whole game is client-side; there is nothing to render on a server.
  output: "export",
};

export default nextConfig;
