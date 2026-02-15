'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/store/ThemeContext';
import type { ThemeMode } from '@/types';

type ThemeOption = {
  code: ThemeMode;
  labelKey: 'themeBase' | 'themeLight' | 'themeDark';
  dotClassName: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { code: 'base', labelKey: 'themeBase', dotClassName: 'bg-accent-500' },
  { code: 'light', labelKey: 'themeLight', dotClassName: 'bg-surface-500' },
  { code: 'dark', labelKey: 'themeDark', dotClassName: 'bg-text-primary' },
];

export default function ThemeSwitcher() {
  const t = useTranslations('header');
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (nextTheme: ThemeMode) => {
      setTheme(nextTheme);
      setOpen(false);
    },
    [setTheme]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('theme')}
        aria-expanded={open}
        className="flex items-center gap-1.5 h-[var(--tool-control-h)] px-2 rounded-[var(--tool-control-radius)] text-[length:var(--tool-value-size)] font-medium
          text-text-secondary hover:text-text-primary hover:bg-surface-600
          transition-colors duration-150 cursor-pointer"
      >
        <span className="inline-flex items-center gap-0.5">
          <span className="h-2 w-2 rounded-full bg-accent-500" />
          <span className="h-2 w-2 rounded-full bg-surface-400" />
          <span className="h-2 w-2 rounded-full bg-text-primary" />
        </span>
        <span className="hidden sm:inline">{t('theme')}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
          role="img"
        >
          <title>Toggle</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-36 py-1 rounded-lg
            bg-surface-700 border border-border-default shadow-xl shadow-black/30 z-50
            animate-[slide-up-fade_150ms_ease-out]"
        >
          {THEME_OPTIONS.map((item) => (
            <button
              type="button"
              key={item.code}
              onClick={() => handleSelect(item.code)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-[length:var(--tool-value-size)] font-medium transition-colors cursor-pointer
                ${
                  item.code === theme
                    ? 'text-accent-400 bg-accent-500/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-600'
                }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
              <span>{t(item.labelKey)}</span>
              {item.code === theme && (
                <svg
                  className="w-3.5 h-3.5 ml-auto text-accent-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  role="img"
                >
                  <title>Selected</title>
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
