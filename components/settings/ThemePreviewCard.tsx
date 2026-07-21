'use client';

import { cn } from '@/lib/utils';

export type ThemePreference = 'system' | 'light' | 'dark';

const LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

/* A miniature of the UI rather than a swatch — three stacked "rows" on a page
   surface. Colours are hardcoded on purpose: each card has to render its own
   theme regardless of which theme is currently active. */
const PreviewRow = ({ dark }: { dark: boolean }) => (
  <div
    className="flex items-center gap-1.5 rounded-md px-1.5 py-1"
    style={{ background: dark ? '#1d2939' : '#f9fafb' }}
  >
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: dark ? '#475467' : '#d0d5dd' }}
    />
    <span className="h-1 flex-1 rounded-full" style={{ background: dark ? '#344054' : '#e4e7ec' }} />
  </div>
);

const FlatPreview = ({ dark }: { dark: boolean }) => (
  <div
    className="flex h-full w-full flex-col gap-1.5 p-2"
    style={{ background: dark ? '#101828' : '#ffffff' }}
  >
    <PreviewRow dark={dark} />
    <PreviewRow dark={dark} />
    <PreviewRow dark={dark} />
  </div>
);

const ThemePreviewCard = ({
  variant,
  active,
  onClick,
}: {
  variant: ThemePreference;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className="group flex flex-col items-center gap-2 focus-visible:outline-none"
  >
    <div
      className={cn(
        'h-[90px] w-full overflow-hidden rounded-lg border transition-colors duration-150',
        active
          ? 'border-brand-500 ring-2 ring-brand-500/25'
          : 'border-gray-200 group-hover:border-gray-300 group-focus-visible:ring-2 group-focus-visible:ring-brand-500/40 dark:border-gray-800 dark:group-hover:border-gray-600'
      )}
    >
      {variant === 'system' ? (
        // Split down the middle so "System" reads as "whichever one you're on".
        <div className="flex h-full w-full">
          <div className="w-1/2 overflow-hidden">
            <FlatPreview dark={false} />
          </div>
          <div className="w-1/2 overflow-hidden">
            <FlatPreview dark />
          </div>
        </div>
      ) : (
        <FlatPreview dark={variant === 'dark'} />
      )}
    </div>
    <span
      className={cn(
        'text-theme-sm font-medium',
        active ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'
      )}
    >
      {LABELS[variant]}
    </span>
  </button>
);

export default ThemePreviewCard;
