'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-600',
  secondary:
    'bg-surface-600 text-text-primary hover:bg-surface-500 active:bg-surface-400 border border-border-default',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-600 hover:text-text-primary active:bg-surface-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-[var(--tool-control-h)] px-2.5 text-[length:var(--tool-value-size)] gap-1.5 rounded-[var(--tool-control-radius)]',
  md: 'h-[var(--tool-btn-size)] px-3 text-[length:var(--tool-label-size)] gap-2 rounded-[var(--tool-btn-radius)]',
  lg: 'h-[var(--tool-config-h)] px-4 text-[length:var(--tool-label-size)] gap-2.5 rounded-lg',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 
        disabled:opacity-40 disabled:pointer-events-none cursor-pointer
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
