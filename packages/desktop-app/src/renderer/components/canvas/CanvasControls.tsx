import React from 'react';
import {
  Eye, Pencil,
  Undo2, Redo2,
  ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut,
  Maximize, LayoutGrid,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import type { CanvasMode } from '../../stores/ui-store';
import { useI18n } from '../../hooks/useI18n';

export interface CanvasControlsProps {
  zoom: number;
  focusSchemaId: string | null;
  mode: CanvasMode;
  canUndo: boolean;
  canRedo: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onBackToOverview: () => void;
  onToggleMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
}

const btnClass =
  'flex items-center justify-center min-w-[28px] h-7 px-2 bg-transparent border-none rounded-md text-secondary text-xs cursor-pointer transition-all duration-fast hover:bg-surface-hover hover:text-default';

const disabledClass = 'opacity-30 pointer-events-none';

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  focusSchemaId,
  mode,
  canUndo,
  canRedo,
  canGoBack,
  canGoForward,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onBackToOverview,
  onToggleMode,
  onUndo,
  onRedo,
  onNavigateBack,
  onNavigateForward,
}) => {
  const { t } = useI18n();

  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 p-1 bg-surface-panel border border-subtle rounded-lg shadow-sm z-10">
      {/* 모드 토글 */}
      <Tooltip content={mode === 'browse' ? t('canvas.editMode') : t('canvas.browseMode')} position="bottom">
        <button
          className={`${btnClass} ${mode === 'edit' ? 'bg-accent-muted text-accent' : ''}`}
          onClick={onToggleMode}
        >
          {mode === 'browse' ? <Eye size={16} /> : <Pencil size={16} />}
        </button>
      </Tooltip>

      <div className="w-px h-4 bg-[var(--border-subtle)]" />

      {/* Browse: 뒤로/앞으로, Edit: Undo/Redo */}
      {mode === 'browse' ? (
        <>
          <Tooltip content={t('canvas.navBack')} position="bottom">
            <button
              className={`${btnClass} ${!canGoBack ? disabledClass : ''}`}
              onClick={onNavigateBack}
              disabled={!canGoBack}
            >
              <ChevronLeft size={16} />
            </button>
          </Tooltip>
          <Tooltip content={t('canvas.navForward')} position="bottom">
            <button
              className={`${btnClass} ${!canGoForward ? disabledClass : ''}`}
              onClick={onNavigateForward}
              disabled={!canGoForward}
            >
              <ChevronRight size={16} />
            </button>
          </Tooltip>
        </>
      ) : (
        <>
          <Tooltip content={t('canvas.undo')} position="bottom">
            <button
              className={`${btnClass} ${!canUndo ? disabledClass : ''}`}
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 size={16} />
            </button>
          </Tooltip>
          <Tooltip content={t('canvas.redo')} position="bottom">
            <button
              className={`${btnClass} ${!canRedo ? disabledClass : ''}`}
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 size={16} />
            </button>
          </Tooltip>
        </>
      )}

      <div className="w-px h-4 bg-[var(--border-subtle)]" />

      <Tooltip content={t('canvas.zoomIn')} position="bottom">
        <button className={btnClass} onClick={onZoomIn}>
          <ZoomIn size={16} />
        </button>
      </Tooltip>
      <span className="text-xs text-muted min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
      <Tooltip content={t('canvas.zoomOut')} position="bottom">
        <button className={btnClass} onClick={onZoomOut}>
          <ZoomOut size={16} />
        </button>
      </Tooltip>
      <Tooltip content={t('canvas.fitToScreen')} position="bottom">
        <button className={btnClass} onClick={onFitToScreen}>
          <Maximize size={16} />
        </button>
      </Tooltip>
      {focusSchemaId && (
        <Tooltip content={t('canvas.backToOverview')} position="bottom">
          <button
            className={`${btnClass} text-accent`}
            onClick={onBackToOverview}
          >
            <LayoutGrid size={16} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
