import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useProjectStore } from '../../stores/project-store';
import { ProjectCard } from './ProjectCard';
import { ProjectCreateDialog } from './ProjectCreateDialog';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Spinner } from '../ui/Spinner';

export function ProjectHome(): JSX.Element {
  const { projects, loading, loadProjects, createProject, openProject, deleteProject } =
    useProjectStore();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (name: string, rootDir: string) => {
    const project = await createProject(name, rootDir);
    openProject(project);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProject(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-default">MoC</h1>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-1" />
            New Project
          </Button>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-subtle py-12 text-center">
            <p className="text-sm text-muted">No projects yet</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowCreate(true)}>
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={openProject}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProjectCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Delete Project"
        message="This will remove the project reference. Files in the folder will not be deleted."
      />
    </div>
  );
}
