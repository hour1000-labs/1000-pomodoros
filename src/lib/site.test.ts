import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { Route as RootRoute } from '@/routes/__root';
import { Route as IndexRoute } from '@/routes/index';

import {
  getPublicAssetPath,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SOCIAL_IMAGE_URL,
  SITE_TITLE,
  SITE_URL,
} from './site';

describe('site identity', () => {
  it('keeps the public identity and canonical share URL together', () => {
    expect(SITE_NAME).toBe('1000 Pomodoros');
    expect(SITE_TITLE).toBe('1000 Pomodoros — Visual Progress Tracker');
    expect(SITE_DESCRIPTION).toBe('Track focused work, one pomodoro at a time.');
    expect(SITE_URL).toBe('https://hour1000-labs.github.io/1000-pomodoros/');
    expect(SITE_SOCIAL_IMAGE_URL).toBe(`${SITE_URL}og-image.png`);
  });

  it('normalizes public asset paths without duplicating slashes', () => {
    expect(getPublicAssetPath('/favicon.png')).toBe('/favicon.png');
    expect(getPublicAssetPath('manifest.json')).toBe('/manifest.json');
  });

  it('keeps landing metadata indexable and app routes private by default', async () => {
    const landingHead = await IndexRoute.options.head?.({} as never);
    const rootHead = await RootRoute.options.head?.({} as never);

    expect(landingHead?.meta).toEqual(
      expect.arrayContaining([
        { title: SITE_TITLE },
        { name: 'description', content: SITE_DESCRIPTION },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:image', content: SITE_SOCIAL_IMAGE_URL },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ])
    );
    expect(landingHead?.links).toContainEqual({ rel: 'canonical', href: SITE_URL });
    expect(rootHead?.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
    expect(rootHead?.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: 'icon', href: '/favicon.png' }),
        expect.objectContaining({ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }),
        expect.objectContaining({ rel: 'manifest', href: '/manifest.json' }),
      ])
    );
  });

  it('keeps install and crawl assets aligned with the public identity', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../../public/manifest.json', import.meta.url), 'utf8')
    ) as {
      name: string;
      description: string;
      start_url: string;
      scope: string;
      icons: Array<{ src: string; sizes: string }>;
    };
    const robots = readFileSync(new URL('../../public/robots.txt', import.meta.url), 'utf8');
    const sitemap = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8');

    expect(manifest).toMatchObject({
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      start_url: '.',
      scope: '.',
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: 'favicon.png', sizes: '64x64' }),
        expect.objectContaining({ src: 'icon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: 'icon-512.png', sizes: '512x512' }),
      ])
    );
    expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
    expect(sitemap.match(/<loc>/g)).toHaveLength(1);
    expect(existsSync(new URL('../../public/favicon.ico', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../../public/logo192.png', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../../public/logo512.png', import.meta.url))).toBe(false);
  });
});
