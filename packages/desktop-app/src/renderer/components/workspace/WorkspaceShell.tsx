import React from 'react';
import type { Project } from '@moc/shared/types';
import { ConceptWorkspace } from './ConceptWorkspace';

interface WorkspaceShellProps {
  project: Project;
}

export function WorkspaceShell({ project }: WorkspaceShellProps): JSX.Element {
  return (
    <div className="flex h-full">
      {/* Sidebar — Phase 6 */}

      {/* Canvas */}
      <div className="flex-1">
        <ConceptWorkspace projectId={project.id} />
      </div>

      {/* Editor Dock — Phase 6 */}
    </div>
  );
}
