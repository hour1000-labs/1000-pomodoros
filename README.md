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
