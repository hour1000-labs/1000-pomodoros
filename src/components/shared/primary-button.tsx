import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PrimaryButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn('bg-pomodoro-red text-paper hover:bg-ink hover:text-paper', className)}
      {...props}
    />
  );
}
