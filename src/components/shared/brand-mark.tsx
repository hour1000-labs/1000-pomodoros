import { getPublicAssetPath } from '@/lib/site';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-11 select-none items-center gap-2.5 font-extrabold text-base text-ink tracking-tight',
        className
      )}
    >
      <img
        src={getPublicAssetPath('logo.png')}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain"
      />
      <span>1000 Pomodoros</span>
    </span>
  );
}
