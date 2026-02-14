import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const basePath =
  isGithubPagesBuild && repositoryName ? `/${repositoryName}` : '';

const nextConfig: NextConfig = {
  ...(isGithubPagesBuild
    ? {
        output: 'export',
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {}),
  ...(basePath
    ? {
        basePath,
        assetPrefix: `${basePath}/`,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.ts',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
