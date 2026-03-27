import React from 'react';
import { FolderOpen } from 'lucide-react';
import { fsService } from '../../services';

export interface FilePickerProps {
  value?: string;
  onChange?: (path: string) => void;
  disabled?: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({ value, onChange, disabled }) => {
  const handleBrowse = async () => {
    if (disabled) return;
    const path = await fsService.openFileDialog();
    if (path) onChange?.(path);
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="File path..."
        disabled={disabled}
        className="flex-1 px-3 py-1.5 text-sm text-default bg-input border border-subtle rounded-lg outline-none transition-all duration-fast placeholder:text-muted hover:border-default focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleBrowse}
        disabled={disabled}
        className="p-1.5 text-muted hover:text-default transition-colors disabled:opacity-50"
        title="Browse"
      >
        <FolderOpen size={14} />
      </button>
    </div>
  );
};
