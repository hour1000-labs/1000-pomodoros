# 1000 Pomodoros

A calm visual progress tracker that turns focused work into visible progress
toward a long-term Journey.

The project currently contains the blank TanStack Start scaffold. Product
features should be implemented through the documented feature workflow rather
than directly from this README.

## Project Context

- [Product specification](context/product-spec.md)
- [Product decisions](context/decisions.md)
- [Design system](context/DESIGN.md)
- [AI interaction guidelines](context/ai-interaction.md)
- [Current feature](context/current-feature.md)
- [Repository instructions](AGENTS.md)

## Requirements

- Node.js 20 or newer
- pnpm

## Development

```bash
pnpm install
pnpm dev
```

The development server runs on [http://localhost:3000](http://localhost:3000).

## GitHub Pages preview

The `Deploy to GitHub Pages` workflow will publish the latest `main` branch to
[the project preview](https://hour1000-labs.github.io/1000-pomodoros/) after a
push. It can also be started manually from the repository's Actions tab.

The one-time repository setup is:

1. Open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.

The workflow derives the project-path base URL from GitHub Pages at build time,
so local development and the deployed preview use the correct asset and route
paths independently.

## Verification

```bash
pnpm test
pnpm build
```

Preview a production build locally with:

```bash
pnpm preview
```

## Routes

Routes use TanStack Router's file-based routing and live in `src/routes`.
Generate the route tree explicitly with:

```bash
pnpm generate-routes
```

Do not edit `src/routeTree.gen.ts` manually.

## Server Code

TanStack Start code is isomorphic by default. Use `createServerFn` for secrets,
database access, and other server-only behavior.

Server routes use the `server.handlers` property and return standard responses:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => Response.json({ message: 'Hello, World!' }),
    },
  },
})
```

See the [TanStack Start documentation](https://tanstack.com/start) for current
framework guidance.
