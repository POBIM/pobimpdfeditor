'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
  children: ReactNode;
}

export default function ToolButton({
  active = false,
  label,
  className = '',
  children,
  ...props
}: ToolButtonProps) {
  return (
    <button
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`relative flex items-center justify-center
        w-[var(--tool-btn-size)] h-[var(--tool-btn-size)]
        rounded-[var(--tool-btn-radius)] text-[length:var(--tool-label-size)]
        font-medium leading-none
        transition-all duration-150 cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500
        disabled:opacity-40 disabled:pointer-events-none
        ${
          active
            ? 'bg-accent-500/15 text-accent-400 shadow-[inset_0_0_0_1px_rgba(255,107,74,0.3)]'
            : 'text-text-secondary hover:bg-surface-500 hover:text-text-primary active:bg-surface-400'
        } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
