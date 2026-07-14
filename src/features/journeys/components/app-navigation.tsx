import { Link } from '@tanstack/react-router';
import { Home, Map as MapIcon } from 'lucide-react';

import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';

const navItemClass =
  'relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:text-ink md:flex-none md:justify-start';

export function AppNavigation({ journeyId, className }: { journeyId: string; className?: string }) {
  return (
    <nav
      aria-label="Application"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-ink/12 bg-paper/95 px-3 py-2 backdrop-blur md:static md:border-x-0 md:border-t-0 md:border-b md:px-8 md:py-3',
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-2">
        <Link to="/" className="hidden rounded-md md:inline-flex">
          <BrandMark />
        </Link>
        <ul className="m-0 flex w-full list-none items-center gap-2 p-0 md:w-auto">
          <li className="flex flex-1 md:flex-none">
            <Link
              to="/home"
              className={navItemClass}
              activeProps={{
                'aria-current': 'page',
                className:
                  'text-ink after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:bg-pomodoro-red md:after:-bottom-3',
              }}
            >
              <Home aria-hidden="true" className="size-4" />
              Home
            </Link>
          </li>
          <li className="flex flex-1 md:flex-none">
            <Link
              to="/journeys/$journeyId"
              params={{ journeyId }}
              className={navItemClass}
              activeOptions={{ exact: false }}
              activeProps={{
                'aria-current': 'page',
                className:
                  'text-ink after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:bg-pomodoro-red md:after:-bottom-3',
              }}
            >
              <MapIcon aria-hidden="true" className="size-4" />
              Journeys
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
