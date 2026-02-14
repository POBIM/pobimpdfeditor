'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface PageManagementBarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onRotateClockwise: () => void;
  onRotateCounterclockwise: () => void;
  onExtractSelected: () => void;
}

export default function PageManagementBar({
  selectedCount,
  onDeleteSelected,
  onRotateClockwise,
  onRotateCounterclockwise,
  onExtractSelected,
}: PageManagementBarProps) {
  const t = useTranslations('pageManagement');

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-border-subtle bg-surface-800/95 backdrop-blur-sm p-2">
      <div className="mb-2 text-[11px] text-text-tertiary font-mono tabular-nums">{selectedCount}</div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button size="sm" variant="secondary" onClick={onDeleteSelected}>
          {t('deleteSelected', { count: selectedCount })}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRotateClockwise}>
          {t('rotateCW')}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRotateCounterclockwise}>
          {t('rotateCCW')}
        </Button>
        <Button size="sm" variant="primary" onClick={onExtractSelected}>
          {t('extractSelected')}
        </Button>
      </div>
    </div>
  );
}
