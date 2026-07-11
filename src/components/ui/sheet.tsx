'use client';

import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Sheet(props: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Close>) {
  return (
    <Dialog.Close
      data-slot="sheet-close"
      className={cn(
        'focus-visible:ring-ring rounded-md p-2 opacity-80 transition-opacity hover:opacity-100 focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle(props: React.ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title data-slot="sheet-title" {...props} />;
}

function SheetDescription(
  props: React.ComponentProps<typeof Dialog.Description>,
) {
  return <Dialog.Description data-slot="sheet-description" {...props} />;
}

function SheetContent({
  className,
  side = 'right',
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Popup> & {
  side?: 'left' | 'right';
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="bg-foreground/30 fixed inset-0 z-50 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Popup
        data-slot="sheet-content"
        className={cn(
          'bg-background text-foreground fixed inset-y-0 z-50 w-[min(92vw,22rem)] overflow-y-auto p-4 shadow-xl transition-transform duration-300 outline-none data-ending-style:translate-x-full data-starting-style:translate-x-full sm:p-6',
          side === 'right' ? 'right-0' : 'left-0',
          side === 'left' &&
            'data-ending-style:-translate-x-full data-starting-style:-translate-x-full',
          className,
        )}
        {...props}
      >
        {children}
        <SheetClose
          aria-label="Men\u00fcy\u00fc kapat"
          className="absolute top-4 right-4"
        >
          <X className="size-5" aria-hidden="true" />
        </SheetClose>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
};
