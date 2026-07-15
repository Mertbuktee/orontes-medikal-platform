import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type SectionProps = ComponentPropsWithoutRef<'section'>;

export function Section({ className, ...props }: SectionProps) {
  return (
    <section className={cn('py-12 sm:py-16 lg:py-20', className)} {...props} />
  );
}
