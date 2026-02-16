import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-static';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function withBasePath(pathname: string): string {
  return `${basePath}${pathname}`;
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: withBasePath('/'),
    name: 'POBIM PDF Editor',
    short_name: 'POBIM PDF',
    description: 'Professional PDF editing in your browser',
    start_url: withBasePath(`/${routing.defaultLocale}`),
    scope: basePath ? `${basePath}/` : '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#131619',
    theme_color: '#1a1e23',
    icons: [
      {
        src: withBasePath('/icons/icon-192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: withBasePath('/icons/icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: withBasePath('/icons/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
