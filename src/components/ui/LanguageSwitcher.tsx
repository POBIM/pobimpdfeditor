'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Locale } from '@/types';

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
  const t = useTranslations('header');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const handleSelect = useCallback(
    (code: Locale) => {
      router.replace(pathname, { locale: code });
      setOpen(false);
    },
    [router, pathname]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t('language')}
        aria-expanded={open}
        className="flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium
          text-text-secondary hover:text-text-primary hover:bg-surface-600
          transition-colors duration-150 cursor-pointer"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
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
          {LOCALES.map((l) => (
            <button
              type="button"
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer
                ${
                  l.code === locale
                    ? 'text-accent-400 bg-accent-500/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-600'
                }`}
            >
              <span className="text-sm">{l.flag}</span>
              <span>{l.label}</span>
              {l.code === locale && (
                <svg className="w-3.5 h-3.5 ml-auto text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" role="img">
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
