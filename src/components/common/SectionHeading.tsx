import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SectionHeadingProps = ComponentPropsWithoutRef<'div'> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', className)} {...props}>
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}
