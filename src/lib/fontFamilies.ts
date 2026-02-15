export type TextFontOption = {
  value: string;
  labelKey:
    | 'fontFamilyDefault'
    | 'fontFamilySarabun'
    | 'fontFamilyNotoThai'
    | 'fontFamilyDMSans';
};

export const TEXT_FONT_OPTIONS: TextFontOption[] = [
  { value: 'var(--font-body)', labelKey: 'fontFamilyDefault' },
  { value: 'var(--font-sarabun)', labelKey: 'fontFamilySarabun' },
  { value: 'var(--font-noto-thai)', labelKey: 'fontFamilyNotoThai' },
  { value: 'var(--font-dm-sans)', labelKey: 'fontFamilyDMSans' },
];

const CSS_VAR_PATTERN = /^var\((--[^)]+)\)$/;

function resolveCssVars(value: string): string {
  if (typeof window === 'undefined') {
    return value;
  }

  const rootStyle = window.getComputedStyle(window.document.documentElement);
  let resolved = value;

  for (let step = 0; step < 4; step += 1) {
    if (!resolved.includes('var(')) {
      break;
    }

    const next = resolved.replace(/var\((--[^)]+)\)/g, (_, cssVarName: string) => {
      const cssValue = rootStyle.getPropertyValue(cssVarName).trim();
      return cssValue || `var(${cssVarName})`;
    });

    if (next === resolved) {
      break;
    }

    resolved = next;
  }

  return resolved;
}

export function resolveCanvasFontFamily(fontFamily: string): string {
  const normalized = fontFamily.trim();
  const match = CSS_VAR_PATTERN.exec(normalized);

  if (!match && !normalized.includes('var(')) {
    return normalized;
  }

  if (!match) {
    const resolvedComposite = resolveCssVars(normalized).trim();
    return resolvedComposite || normalized;
  }

  if (typeof window === 'undefined') {
    return normalized;
  }

  const cssVarName = match[1];
  const resolvedSingle = window
    .getComputedStyle(window.document.documentElement)
    .getPropertyValue(cssVarName)
    .trim();

  return resolvedSingle || normalized;
}

const OPTION_MATCHERS: Array<{ optionValue: string; matcher: RegExp }> = [
  { optionValue: 'var(--font-sarabun)', matcher: /sarabun/i },
  { optionValue: 'var(--font-noto-thai)', matcher: /noto\s+sans\s+thai/i },
  { optionValue: 'var(--font-dm-sans)', matcher: /dm\s*sans/i },
];

export function getFontOptionValue(fontFamily: string): string {
  const normalized = fontFamily.trim();

  if (!normalized) {
    return TEXT_FONT_OPTIONS[0].value;
  }

  const direct = TEXT_FONT_OPTIONS.find((option) => option.value === normalized);
  if (direct) {
    return direct.value;
  }

  const resolvedCurrent = resolveCanvasFontFamily(normalized);
  const resolvedMatch = TEXT_FONT_OPTIONS.find((option) => {
    const resolvedOption = resolveCanvasFontFamily(option.value);
    return resolvedOption === resolvedCurrent;
  });

  if (resolvedMatch) {
    return resolvedMatch.value;
  }

  const nameMatch = OPTION_MATCHERS.find(({ matcher }) => matcher.test(normalized));
  return nameMatch?.optionValue ?? TEXT_FONT_OPTIONS[0].value;
}
