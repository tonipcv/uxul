/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    // Desabilitar completamente o Edge Runtime
    runtime: 'nodejs',
    // Forçar todas as rotas a usar Node.js
    preferredRegion: 'home',
  },
  async headers() {
    return [
      {
        source: '/api/portal/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.PORTAL_URL || 'https://care.med1.app'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  webpack: (config, { isServer }) => {
    // Excluir a pasta scripts do build
    config.module.rules.push({
      test: /scripts[\\/].*\.(js|ts)$/,
      loader: 'ignore-loader',
    });

    // Configuração para módulos nativos do Node.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:child_process': 'child_process',
      'node:crypto': 'crypto',
      'node:fs': 'fs',
      'node:path': 'path'
    };

    if (!isServer) {
      // Não incluir módulos do Node.js no bundle do cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        'child_process': false,
      };
    }
    return config;
  },
}

export default nextConfig; 