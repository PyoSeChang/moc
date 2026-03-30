import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useI18n } from '../../hooks/useI18n';

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function ProjectCreateDialog({ open, onClose, onCreate }: ProjectCreateDialogProps): JSX.Element {
  const { t } = useI18n();
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
      <Button variant="primary" onClick={handleCreate} disabled={!name.trim()}>
        {t('common.create')}
      </Button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={t('project.create')} footer={footer} width={480}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs text-secondary">{t('project.name')}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder={t('project.namePlaceholder')}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}
