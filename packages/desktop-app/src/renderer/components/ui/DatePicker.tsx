import React from 'react';

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  includeTime?: boolean;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, includeTime, disabled }) => {
  return (
    <input
      type={includeTime ? 'datetime-local' : 'date'}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className="block w-full px-3 py-1.5 text-sm text-default bg-input border border-subtle rounded-lg outline-none transition-all duration-fast hover:border-default focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
};
