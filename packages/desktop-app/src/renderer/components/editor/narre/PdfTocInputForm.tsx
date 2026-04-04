import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import type { NarreMention } from '@netior/shared/types';
import { useI18n } from '../../../hooks/useI18n';
import { Button } from '../../ui/Button';
import { NumberInput } from '../../ui/NumberInput';
import { Input } from '../../ui/Input';

export interface PdfTocFormData {
  fileId: string;
  filePath: string;
  startPage: number;
  endPage: number;
  overviewPages?: number[];
}

interface PdfTocInputFormProps {
  fileMention: NarreMention;
  onSubmit: (data: PdfTocFormData) => void;
  onCancel: () => void;
}

export function PdfTocInputForm({ fileMention, onSubmit, onCancel }: PdfTocInputFormProps): JSX.Element {
  const { t } = useI18n();
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [overviewPagesText, setOverviewPagesText] = useState('');

  const handleSubmit = () => {
    const overviewPages = overviewPagesText
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    onSubmit({
      fileId: fileMention.id ?? '',
      filePath: fileMention.path ?? fileMention.display,
      startPage,
      endPage,
      overviewPages: overviewPages.length > 0 ? overviewPages : undefined,
    });
  };

  const isValid = startPage > 0 && endPage > 0 && endPage >= startPage && fileMention.id;

  return (
    <div className="mx-4 my-2 rounded-lg border border-subtle bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium text-default">{t('pdfToc.inputTitle')}</h3>
        <button
          className="rounded p-0.5 text-muted hover:bg-surface-hover hover:text-default"
          onClick={onCancel}
        >
          <X size={14} />
        </button>
      </div>

      {/* Target file */}
      <div className="mb-3 flex items-center gap-2 rounded border border-subtle bg-surface-base px-2 py-1.5">
        <FileText size={14} className="shrink-0 text-muted" />
        <span className="truncate text-xs text-secondary">{fileMention.display}</span>
      </div>

      {/* Page range inputs */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-secondary">{t('pdfToc.startPage')}</label>
          <NumberInput
            value={startPage}
            onChange={setStartPage}
            min={1}
            inputSize="sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-secondary">{t('pdfToc.endPage')}</label>
          <NumberInput
            value={endPage}
            onChange={setEndPage}
            min={1}
            inputSize="sm"
          />
        </div>
      </div>

      {/* Overview pages */}
      <div className="mb-4">
        <label className="mb-1 block text-[11px] text-secondary">{t('pdfToc.overviewPages')}</label>
        <Input
          value={overviewPagesText}
          onChange={(e) => setOverviewPagesText(e.target.value)}
          placeholder={t('pdfToc.overviewPagesHint')}
          inputSize="sm"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!isValid}>
          {t('pdfToc.startAnalysis')}
        </Button>
      </div>
    </div>
  );
}
