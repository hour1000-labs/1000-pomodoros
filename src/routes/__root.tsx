import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';

import { TooltipProvider } from '@/components/ui/tooltip';
import { getPublicAssetPath, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: '#C63F32',
      },
      {
        name: 'description',
        content: SITE_DESCRIPTION,
      },
      {
        name: 'application-name',
        content: SITE_NAME,
      },
      {
        name: 'robots',
        content: 'noindex, follow',
      },
      { title: SITE_NAME },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '64x64',
        href: getPublicAssetPath('favicon.png'),
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: getPublicAssetPath('apple-touch-icon.png'),
      },
      {
        rel: 'manifest',
        href: getPublicAssetPath('manifest.json'),
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
