import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PrimaryButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        'bg-pomodoro-red text-paper shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(193,1,52,0.2)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-ink hover:text-paper hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_20px_rgba(18,17,16,0.22)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
        className
      )}
      {...props}
    />
  );
}
