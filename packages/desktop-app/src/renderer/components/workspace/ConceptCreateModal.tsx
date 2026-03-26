import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const CONCEPT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#78716c',
];

interface ConceptCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; color?: string; icon?: string }) => void;
}

export function ConceptCreateModal({ open, onClose, onCreate }: ConceptCreateModalProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      color: color || undefined,
      icon: icon.trim() || undefined,
    });
    setTitle('');
    setColor(undefined);
    setIcon('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setColor(undefined);
    setIcon('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Concept 만들기"
      width="400px"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
            만들기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-secondary">제목</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Concept 제목"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-secondary">아이콘 (이모지)</label>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📌"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">색상</label>
          <div className="flex flex-wrap gap-2">
            {CONCEPT_COLORS.map((c) => (
              <button
                key={c}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c ? 'border-accent scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(color === c ? undefined : c)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
