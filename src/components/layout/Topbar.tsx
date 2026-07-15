import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type TopbarProps = ComponentPropsWithoutRef<'div'>;

export function Topbar({ className, ...props }: TopbarProps) {
  return (
    <div
      className={cn(
        'border-border/60 bg-foreground text-background border-b',
        className,
      )}
      {...props}
    />
  );
}
