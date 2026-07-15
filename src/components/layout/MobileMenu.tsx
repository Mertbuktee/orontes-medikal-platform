import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type MobileMenuProps = ComponentPropsWithoutRef<'div'>;

export function MobileMenu({ className, ...props }: MobileMenuProps) {
  return (
    <div
      className={cn(
        'border-border/60 flex flex-col gap-2 border-t pt-4',
        className,
      )}
      {...props}
    />
  );
}
