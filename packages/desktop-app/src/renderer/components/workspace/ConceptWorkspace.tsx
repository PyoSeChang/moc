import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '../canvas/Canvas';
import { Background } from './Background';
import { NodeLayer } from './NodeLayer';
import { EdgeLayer } from './EdgeLayer';
import { InteractionLayer } from './InteractionLayer';
import { useCanvasStore, type CanvasNodeWithConcept } from '../../stores/canvas-store';
import { useConceptStore } from '../../stores/concept-store';
import { useUIStore } from '../../stores/ui-store';
import type { RenderNode, RenderEdge } from './types';

interface ConceptWorkspaceProps {
  projectId: string;
}

function toRenderNodes(nodes: CanvasNodeWithConcept[]): RenderNode[] {
  return nodes.map((n) => ({
    id: n.id,
    x: n.position_x,
    y: n.position_y,
    label: n.concept.title,
    icon: n.concept.icon || '📌',
    semanticType: 'concept',
    semanticTypeLabel: 'Concept',
    width: n.width ?? 160,
    height: n.height ?? 60,
  }));
}

function toRenderEdges(edges: { id: string; source_node_id: string; target_node_id: string }[]): RenderEdge[] {
  return edges.map((e) => ({
    id: e.id,
    sourceId: e.source_node_id,
    targetId: e.target_node_id,
    directed: false,
    label: '',
  }));
}

export function ConceptWorkspace({ projectId }: ConceptWorkspaceProps): JSX.Element {
  const {
    currentCanvas, nodes, edges,
    loadCanvases, openCanvas, canvases,
    addNode, updateNode, removeNode,
    addEdge, removeEdge, saveViewport,
  } = useCanvasStore();
  const { createConcept } = useConceptStore();
  const { canvasMode } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);

  // Load canvases and open first one
  useEffect(() => {
    loadCanvases(projectId).then(() => {
      const store = useCanvasStore.getState();
      if (store.canvases.length > 0 && !store.currentCanvas) {
        store.openCanvas(store.canvases[0].id);
      }
    });
  }, [projectId, loadCanvases]);

  // Restore viewport from canvas
  useEffect(() => {
    if (currentCanvas) {
      setZoom(currentCanvas.viewport_zoom);
      setPanX(currentCanvas.viewport_x);
      setPanY(currentCanvas.viewport_y);
    }
  }, [currentCanvas?.id]);

  // Container resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderNodes = useMemo(() => toRenderNodes(nodes), [nodes]);
  const renderEdges = useMemo(() => toRenderEdges(edges), [edges]);

  // Compute node positions map for edge rendering
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number }>();
    for (const n of renderNodes) {
      let x = n.x;
      let y = n.y;
      if (nodeDragOffset && nodeDragOffset.id === n.id) {
        x += nodeDragOffset.dx / zoom;
        y += nodeDragOffset.dy / zoom;
      }
      map.set(n.id, { x, y, width: n.width ?? 160, height: n.height ?? 60 });
    }
    return map;
  }, [renderNodes, nodeDragOffset, zoom]);

  const handleNodeClick = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const handleNodeDoubleClick = useCallback((_id: string) => {
    // Phase 6: open editor
  }, []);

  const handleNodeDragStart = useCallback((_id: string, _x: number, _y: number) => {
    // Handled by InteractionLayer
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleContextMenu = useCallback(
    async (type: 'canvas' | 'node' | 'edge', screenX: number, screenY: number, targetId?: string) => {
      if (type === 'canvas' && currentCanvas) {
        // Create concept at click position
        const worldX = (screenX - panX) / zoom;
        const worldY = (screenY - panY) / zoom;

        const concept = await createConcept({
          project_id: projectId,
          title: 'New Concept',
        });

        await addNode({
          canvas_id: currentCanvas.id,
          concept_id: concept.id,
          position_x: worldX,
          position_y: worldY,
        });
      } else if (type === 'node' && targetId) {
        await removeNode(targetId);
      } else if (type === 'edge' && targetId) {
        await removeEdge(targetId);
      }
    },
    [currentCanvas, panX, panY, zoom, projectId, createConcept, addNode, removeNode, removeEdge],
  );

  // Viewport change handlers
  const handleZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
  }, []);

  const handleDragNode = useCallback((id: string, dx: number, dy: number) => {
    setNodeDragOffset({ id, dx, dy });
  }, []);

  const handleDragNodeEnd = useCallback(async (id: string) => {
    if (!nodeDragOffset || nodeDragOffset.id !== id) return;
    await updateNode(id, {
      position_x: (renderNodes.find((n) => n.id === id)?.x ?? 0) + nodeDragOffset.dx / zoom,
      position_y: (renderNodes.find((n) => n.id === id)?.y ?? 0) + nodeDragOffset.dy / zoom,
    });
    setNodeDragOffset(null);
  }, [nodeDragOffset, zoom, renderNodes, updateNode]);

  // Save viewport on change (debounced)
  useEffect(() => {
    if (!currentCanvas) return;
    const timer = setTimeout(() => {
      saveViewport({ viewport_x: panX, viewport_y: panY, viewport_zoom: zoom });
    }, 500);
    return () => clearTimeout(timer);
  }, [panX, panY, zoom, currentCanvas, saveViewport]);

  if (!currentCanvas) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No canvas selected
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-surface-base">
      <Background
        width={containerSize.width}
        height={containerSize.height}
        zoom={zoom}
        panX={panX}
        panY={panY}
      />

      <EdgeLayer
        edges={renderEdges}
        nodePositions={nodePositions}
        zoom={zoom}
        panX={panX}
        panY={panY}
        onContextMenu={handleContextMenu}
      />

      <NodeLayer
        nodes={renderNodes}
        selectedIds={selectedIds}
        mode={canvasMode}
        zoom={zoom}
        panX={panX}
        panY={panY}
        nodeDragOffset={nodeDragOffset}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStart={handleNodeDragStart}
        onContextMenu={handleContextMenu}
      />

      <InteractionLayer
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
        zoom={zoom}
        panX={panX}
        panY={panY}
        nodes={renderNodes}
        selectedIds={selectedIds}
        mode={canvasMode}
        onZoom={handleZoom}
        onPan={handlePan}
        onDragNode={handleDragNode}
        onDragNodeEnd={handleDragNodeEnd}
        onCanvasClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
