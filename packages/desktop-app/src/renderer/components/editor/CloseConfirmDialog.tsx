import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useEditorStore } from '../../stores/editor-store';
import { useI18n } from '../../hooks/useI18n';

export function CloseConfirmDialog(): JSX.Element | null {
  const { t } = useI18n();
  const pendingCloseTabId = useEditorStore((s) => s.pendingCloseTabId);
  const tab = useEditorStore((s) => s.tabs.find((tt) => tt.id === s.pendingCloseTabId));
  const { confirmCloseTab, cancelCloseTab, saveAndCloseTab } = useEditorStore();

  if (!pendingCloseTabId) return null;

  return (
    <Modal
      open
      onClose={cancelCloseTab}
      title={t('editor.unsavedChanges') ?? 'Unsaved Changes'}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={cancelCloseTab}>
            {t('common.cancel') ?? 'Cancel'}
          </Button>
          <Button variant="danger" onClick={confirmCloseTab}>
            {t('editor.closeWithoutSaving') ?? 'Close Without Saving'}
          </Button>
          <Button variant="primary" onClick={saveAndCloseTab}>
            {t('editor.saveAndClose') ?? 'Save & Close'}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-secondary py-4">
        {t('editor.unsavedChangesMessage', { title: tab?.title ?? '' })
          ?? `"${tab?.title}" has unsaved changes. What would you like to do?`}
      </p>
    </Modal>
  );
}
