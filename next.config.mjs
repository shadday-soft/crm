/** @type {import('next').NextConfig} */
const nextConfig = {
  // No ejecutamos ESLint en build para evitar fricción en el entorno local.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
