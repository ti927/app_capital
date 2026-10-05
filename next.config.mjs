/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { dirs: ['src'] },
  // O envio de e-mail de status manda os prints das tabelas (PNG) para a ação
  // no servidor; o limite padrão de 1 MB não cabe (specs/13-email.md).
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
};

export default nextConfig;
