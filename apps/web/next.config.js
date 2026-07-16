/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "https://deskbound-jailbird-jam.ngrok-free.dev",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
