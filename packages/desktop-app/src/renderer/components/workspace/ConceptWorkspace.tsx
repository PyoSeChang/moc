import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Background } from './Background';
import { NodeLayer } from './NodeLayer';
import { EdgeLayer } from './EdgeLayer';
import { NodeContextMenu } from './NodeContextMenu';
import { CanvasContextMenu } from './CanvasContextMenu';
import { CanvasControls } from './CanvasControls';
import { ConceptCreateModal } from './ConceptCreateModal';
import { useInteraction } from './InteractionLayer';
import { NodeCanvasOverlay } from './NodeCanvasOverlay';
import { EdgeContextMenu } from './EdgeContextMenu';
import { FileNodeAddModal } from './FileNodeAddModal';
import { useCanvasStore, type CanvasNodeWithConcept, type EdgeWithRelationType } from '../../stores/canvas-store';
import { useConceptStore } from '../../stores/concept-store';
import { useEditorStore } from '../../stores/editor-store';
import { useUIStore } from '../../stores/ui-store';
import { useArchetypeStore } from '../../stores/archetype-store';
import type { Archetype } from '@moc/shared/types';
import { useI18n } from '../../hooks/useI18n';
import type { RenderNode, RenderEdge } from './types';

interface ConceptWorkspaceProps {
  projectId: string;
}

function toRenderNodes(nodes: CanvasNodeWithConcept[], archetypes: Archetype[]): RenderNode[] {
  const archMap = new Map(archetypes.map((a) => [a.id, a]));
  return nodes.map((n) => {
    if (n.concept) {
      const arch = n.concept.archetype_id ? archMap.get(n.concept.archetype_id) : undefined;
      return {
        id: n.id,
        x: n.position_x,
        y: n.position_y,
        label: n.concept.title,
        icon: n.concept.icon || arch?.icon || '📌',
        shape: arch?.node_shape ?? undefined,
        semanticType: arch?.name || 'concept',
        semanticTypeLabel: arch?.name || 'Concept',
        width: n.width ?? 160,
        height: n.height ?? 60,
        conceptId: n.concept_id ?? undefined,
        canvasCount: n.canvas_count,
        nodeType: 'concept' as const,
      };
    }
    // file or dir node
    const isFile = !!n.file_path;
    return {
      id: n.id,
      x: n.position_x,
      y: n.position_y,
      label: (isFile ? n.file_path : n.dir_path)?.split('/').pop() || '?',
      icon: isFile ? '📄' : '📁',
      semanticType: isFile ? 'file' : 'directory',
      semanticTypeLabel: isFile ? 'File' : 'Directory',
      width: n.width ?? 140,
      height: n.height ?? 50,
      canvasCount: 0,
      nodeType: isFile ? 'file' as const : 'dir' as const,
      filePath: n.file_path ?? undefined,
      dirPath: n.dir_path ?? undefined,
    };
  });
}

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  conceptId?: string;
  canvasCount: number;
}

function toRenderEdges(edges: EdgeWithRelationType[]): RenderEdge[] {
  return edges.map((e) => ({
    id: e.id,
    sourceId: e.source_node_id,
    targetId: e.target_node_id,
    directed: e.relation_type?.directed ?? false,
    label: e.relation_type?.name ?? '',
    color: e.relation_type?.color ?? undefined,
    lineStyle: (e.relation_type?.line_style as 'solid' | 'dashed' | 'dotted') ?? undefined,
  }));
}

export function ConceptWorkspace({ projectId }: ConceptWorkspaceProps): JSX.Element {
  const {
    currentCanvas, nodes, edges,
    loadCanvases, openCanvas,
    addNode, updateNode, removeNode,
    addEdge, removeEdge, saveViewport,
    drillInto, navigateBack,
  } = useCanvasStore();
  const { createConcept } = useConceptStore();
  const { canvasMode } = useUIStore();
  const { t } = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 });
  const [hoverOverlay, setHoverOverlay] = useState<{ conceptId: string; x: number; y: number } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);
  const [edgeLinkingState, setEdgeLinkingState] = useState<{ sourceNodeId: string } | null>(null);
  const [fileNodeModalOpen, setFileNodeModalOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load canvases and open first one
  useEffect(() => {
    loadCanvases(projectId).then(() => {
      const store = useCanvasStore.getState();
      if (store.canvases.length > 0 && !store.currentCanvas) {
        store.openCanvas(store.canvases[0].id);
      }
    });
  }, [projectId, loadCanvases]);

  // Cancel edge linking when mode changes
  useEffect(() => {
    setEdgeLinkingState(null);
  }, [canvasMode]);

  // Restore viewport from canvas
  useEffect(() => {
    if (currentCanvas) {
      setZoom(currentCanvas.viewport_zoom);
      setPanX(currentCanvas.viewport_x);
      setPanY(currentCanvas.viewport_y);
    }
  }, [currentCanvas?.id]);

  // Container resize observer — shift viewport center when canvas resizes
  const prevSizeRef = useRef<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const prev = prevSizeRef.current;
      if (prev) {
        const dx = width - prev.width;
        const dy = height - prev.height;
        if (dx !== 0 || dy !== 0) {
          setPanX((p) => p + dx / 2);
          setPanY((p) => p + dy / 2);
        }
      }
      prevSizeRef.current = { width, height };
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const archetypes = useArchetypeStore((s) => s.archetypes);
  const renderNodes = useMemo(() => toRenderNodes(nodes, archetypes), [nodes, archetypes]);
  const renderEdges = useMemo(() => toRenderEdges(edges), [edges]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: cancel edge linking
      if (e.key === 'Escape' && edgeLinkingState) {
        setEdgeLinkingState(null);
        return;
      }
      // Delete selected nodes
      if (e.key === 'Delete' && selectedIds.size > 0) {
        e.preventDefault();
        selectedIds.forEach((id) => removeNode(id));
        setSelectedIds(new Set());
      }
      // Ctrl+A: select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(renderNodes.map((n) => n.id)));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, renderNodes, removeNode, edgeLinkingState]);

  // --- Mouse interaction (via useInteraction, same pattern as Culturium) ---

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // Ctrl+wheel: canvas hierarchy navigation
    if (e.ctrlKey) {
      if (e.deltaY < 0) {
        // Ctrl+wheel up: drill into node under cursor
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const worldX = (e.clientX - rect.left - panX) / zoom;
        const worldY = (e.clientY - rect.top - panY) / zoom;
        // Find node under cursor
        const hitNode = nodes.find((n) => {
          const w = n.width ?? 160;
          const h = n.height ?? 60;
          return (
            n.concept_id &&
            n.canvas_count > 0 &&
            worldX >= n.position_x - w / 2 &&
            worldX <= n.position_x + w / 2 &&
            worldY >= n.position_y - h / 2 &&
            worldY <= n.position_y + h / 2
          );
        });
        if (hitNode?.concept_id) {
          drillInto(hitNode.concept_id);
        }
      } else {
        // Ctrl+wheel down: navigate back
        navigateBack();
      }
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(5, Math.max(0.1, zoom * factor));

    const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom, panX, panY, nodes, drillInto, navigateBack]);

  const handleNodeDragEnd = useCallback(async (nodeId: string, x: number, y: number) => {
    await updateNode(nodeId, { position_x: x, position_y: y });
  }, [updateNode]);

  const handlePanChange = useCallback((newPanX: number, newPanY: number) => {
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedIds(new Set());
    setContextMenu(null);
    setCanvasContextMenu(null);
    setEdgeLinkingState(null);
    setEdgeContextMenu(null);
  }, []);

  const handleSelectionBox = useCallback((nodeIds: string[]) => {
    setSelectedIds(new Set(nodeIds));
  }, []);

  const { dragState, nodeDragOffset, handleCanvasMouseDown, handleNodeDragStart } = useInteraction({
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    nodes: renderNodes,
    zoom,
    panX,
    panY,
    mode: canvasMode,
    renderingMode: 'canvas',
    onPanChange: handlePanChange,
    onNodeDragEnd: handleNodeDragEnd,
    onSelectionBox: handleSelectionBox,
    onCanvasClick: handleCanvasClick,
    onWheel: handleWheel,
  });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentCanvas) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Node right-clicks are handled by NodeLayer's onContextMenu (stopPropagation).
    // This handler only fires for blank canvas right-clicks.
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = (mx - panX) / zoom;
    const worldY = (my - panY) / zoom;
    setCanvasContextMenu({ x: e.clientX, y: e.clientY, worldX, worldY });
  }, [currentCanvas, panX, panY, zoom]);

  // Save viewport on change (debounced)
  useEffect(() => {
    if (!currentCanvas) return;
    const timer = setTimeout(() => {
      saveViewport({ viewport_x: panX, viewport_y: panY, viewport_zoom: zoom });
    }, 500);
    return () => clearTimeout(timer);
  }, [panX, panY, zoom, currentCanvas, saveViewport]);

  const fitToScreen = useCallback(() => {
    if (renderNodes.length === 0 || !containerSize.width) return;
    const padding = 80;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of renderNodes) {
      const w = n.width ?? 160;
      const h = n.height ?? 60;
      minX = Math.min(minX, n.x - w / 2);
      minY = Math.min(minY, n.y - h / 2);
      maxX = Math.max(maxX, n.x + w / 2);
      maxY = Math.max(maxY, n.y + h / 2);
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0) return;
    const scaleX = (containerSize.width - padding * 2) / contentW;
    const scaleY = (containerSize.height - padding * 2) / contentH;
    const newZoom = Math.min(scaleX, scaleY, 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setZoom(newZoom);
    setPanX(containerSize.width / 2 - centerX * newZoom);
    setPanY(containerSize.height / 2 - centerY * newZoom);
  }, [renderNodes, containerSize]);

  const canvasHistory = useCanvasStore((s) => s.canvasHistory);
  const toggleMode = useCallback(() => {
    useUIStore.getState().setCanvasMode(canvasMode === 'browse' ? 'edit' : 'browse');
  }, [canvasMode]);

  if (!currentCanvas) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No canvas selected
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-surface-base"
      style={{ cursor: dragState.type === 'pan' ? 'grabbing' : dragState.type === 'node' ? 'move' : 'default' }}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={handleContextMenu}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/moc-node')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={async (e) => {
        const raw = e.dataTransfer.getData('application/moc-node');
        if (!raw || !currentCanvas) return;
        e.preventDefault();
        const data = JSON.parse(raw) as { type: 'file' | 'dir'; path: string };
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const worldX = (e.clientX - rect.left - panX) / zoom;
        const worldY = (e.clientY - rect.top - panY) / zoom;
        await addNode({
          canvas_id: currentCanvas.id,
          ...(data.type === 'file' ? { file_path: data.path } : { dir_path: data.path }),
          position_x: worldX,
          position_y: worldY,
        });
      }}
    >
      <CanvasControls
        mode={canvasMode}
        zoom={zoom}
        canGoBack={canvasHistory.length > 0}
        canGoForward={false}
        onToggleMode={toggleMode}
        onZoomIn={() => setZoom((z) => Math.min(5, z * 1.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z / 1.2))}
        onFitToScreen={fitToScreen}
        onNavigateBack={() => navigateBack()}
        onNavigateForward={() => {}}
      />

      <Background
        width={containerSize.width}
        height={containerSize.height}
        zoom={zoom}
        panX={panX}
        panY={panY}
      />

      <EdgeLayer
        edges={renderEdges}
        nodes={renderNodes}
        zoom={zoom}
        panX={panX}
        panY={panY}
        nodeDragOffset={nodeDragOffset}
        onContextMenu={(type, x, y, targetId) => {
          if (type === 'edge' && targetId && canvasMode === 'edit') {
            setEdgeContextMenu({ x, y, edgeId: targetId });
          }
        }}
        onDoubleClick={(edgeId) => {
          const edge = edges.find((e) => e.id === edgeId);
          if (!edge) return;
          const srcNode = nodes.find((n) => n.id === edge.source_node_id);
          const tgtNode = nodes.find((n) => n.id === edge.target_node_id);
          const srcLabel = srcNode?.concept?.title ?? srcNode?.file_path?.split('/').pop() ?? '?';
          const tgtLabel = tgtNode?.concept?.title ?? tgtNode?.file_path?.split('/').pop() ?? '?';
          useEditorStore.getState().openTab({
            type: 'edge',
            targetId: edgeId,
            title: `${srcLabel} → ${tgtLabel}`,
          });
        }}
      />

      {edgeLinkingState && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-accent/90 text-text-on-accent px-4 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-lg">
          <span>{t('canvas.selectTarget') ?? 'Click a node to connect'}</span>
          <button
            type="button"
            className="underline opacity-80 hover:opacity-100"
            onClick={() => setEdgeLinkingState(null)}
          >
            {t('common.cancel') ?? 'Cancel'}
          </button>
        </div>
      )}

      <NodeLayer
        nodes={renderNodes}
        selectedIds={selectedIds}
        highlightedIds={edgeLinkingState ? new Set(renderNodes.filter((n) => n.id !== edgeLinkingState.sourceNodeId).map((n) => n.id)) : undefined}
        mode={canvasMode}
        zoom={zoom}
        panX={panX}
        panY={panY}
        nodeDragOffset={nodeDragOffset}
        onNodeClick={(id) => {
          if (edgeLinkingState) {
            if (id !== edgeLinkingState.sourceNodeId && currentCanvas) {
              addEdge({
                canvas_id: currentCanvas.id,
                source_node_id: edgeLinkingState.sourceNodeId,
                target_node_id: id,
              }).then((edge) => {
                openCanvas(currentCanvas.id);
                const srcNode = nodes.find((n) => n.id === edgeLinkingState.sourceNodeId);
                const tgtNode = nodes.find((n) => n.id === id);
                const srcLabel = srcNode?.concept?.title ?? '?';
                const tgtLabel = tgtNode?.concept?.title ?? '?';
                useEditorStore.getState().openTab({
                  type: 'edge',
                  targetId: edge.id,
                  title: `${srcLabel} → ${tgtLabel}`,
                });
              });
            }
            setEdgeLinkingState(null);
            return;
          }
          setSelectedIds(new Set([id]));
        }}
        onNodeDoubleClick={(id) => {
          const node = nodes.find((n) => n.id === id);
          if (node?.concept_id && node.concept) {
            useEditorStore.getState().openTab({
              type: 'concept',
              targetId: node.concept_id,
              title: node.concept.title,
            });
          } else if (node?.file_path) {
            useEditorStore.getState().openTab({
              type: 'file',
              targetId: node.file_path,
              title: node.file_path.split('/').pop() || 'File',
            });
          }
        }}
        onNodeDragStart={handleNodeDragStart}
        onContextMenu={(type, x, y, targetId) => {
          if (type === 'node' && targetId) {
            const node = nodes.find((n) => n.id === targetId);
            if (node) {
              setContextMenu({
                x,
                y,
                nodeId: targetId,
                conceptId: node.concept_id ?? undefined,
                canvasCount: node.canvas_count,
              });
            }
          }
        }}
        onNodeMouseEnter={(id, screenX, screenY) => {
          const node = nodes.find((n) => n.id === id);
          if (node?.concept_id && node.canvas_count > 0) {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = setTimeout(() => {
              setHoverOverlay({ conceptId: node.concept_id!, x: screenX, y: screenY });
            }, 500);
          }
        }}
        onNodeMouseLeave={() => {
          if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
        }}
      />

      {hoverOverlay && (
        <NodeCanvasOverlay
          conceptId={hoverOverlay.conceptId}
          x={hoverOverlay.x}
          y={hoverOverlay.y}
          onClose={() => setHoverOverlay(null)}
        />
      )}

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          conceptId={contextMenu.conceptId}
          canvasCount={contextMenu.canvasCount}
          mode={canvasMode}
          onAddConnection={(nodeId) => {
            setEdgeLinkingState({ sourceNodeId: nodeId });
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {edgeContextMenu && (
        <EdgeContextMenu
          x={edgeContextMenu.x}
          y={edgeContextMenu.y}
          edgeId={edgeContextMenu.edgeId}
          onClose={() => setEdgeContextMenu(null)}
        />
      )}

      {canvasContextMenu && (
        <CanvasContextMenu
          x={canvasContextMenu.x}
          y={canvasContextMenu.y}
          onCreateConcept={() => {
            setCreatePosition({ x: canvasContextMenu.worldX, y: canvasContextMenu.worldY });
            setCreateModalOpen(true);
            setCanvasContextMenu(null);
          }}
          onAddFileNode={() => {
            setFileNodeModalOpen(true);
            setCanvasContextMenu(null);
          }}
          onClose={() => setCanvasContextMenu(null)}
        />
      )}

      <FileNodeAddModal
        open={fileNodeModalOpen}
        onClose={() => setFileNodeModalOpen(false)}
        onSelect={async (path, type) => {
          if (!currentCanvas) return;
          await addNode({
            canvas_id: currentCanvas.id,
            ...(type === 'file' ? { file_path: path } : { dir_path: path }),
            position_x: canvasContextMenu?.worldX ?? 0,
            position_y: canvasContextMenu?.worldY ?? 0,
          });
          setFileNodeModalOpen(false);
        }}
      />

      <ConceptCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={async (data) => {
          if (!currentCanvas) return;
          const concept = await createConcept({
            project_id: projectId,
            ...data,
          });
          await addNode({
            canvas_id: currentCanvas.id,
            concept_id: concept.id,
            position_x: createPosition.x,
            position_y: createPosition.y,
          });
        }}
      />
    </div>
  );
}
