import { registerProjectIpc } from './project-ipc';
import { registerConceptIpc } from './concept-ipc';
import { registerCanvasIpc } from './canvas-ipc';
import { registerConceptFileIpc } from './concept-file-ipc';
import { registerFsIpc } from './fs-ipc';
import { registerModuleIpc } from './module-ipc';
import { registerEditorPrefsIpc } from './editor-prefs-ipc';

export function registerAllIpc(): void {
  registerProjectIpc();
  registerConceptIpc();
  registerCanvasIpc();
  registerConceptFileIpc();
  registerFsIpc();
  registerModuleIpc();
  registerEditorPrefsIpc();
}
