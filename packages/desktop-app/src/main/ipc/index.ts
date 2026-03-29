import { registerProjectIpc } from './project-ipc';
import { registerConceptIpc } from './concept-ipc';
import { registerCanvasIpc } from './canvas-ipc';
import { registerConceptFileIpc } from './concept-file-ipc';
import { registerFsIpc } from './fs-ipc';
import { registerModuleIpc } from './module-ipc';
import { registerEditorPrefsIpc } from './editor-prefs-ipc';
import { registerArchetypeIpc } from './archetype-ipc';
import { registerConceptPropertyIpc } from './concept-property-ipc';
import { registerConceptContentIpc } from './concept-content-ipc';
import { registerPtyIpc } from './pty-ipc';
import { registerConfigIpc } from './config-ipc';

export function registerAllIpc(): void {
  registerProjectIpc();
  registerConceptIpc();
  registerCanvasIpc();
  registerConceptFileIpc();
  registerFsIpc();
  registerModuleIpc();
  registerEditorPrefsIpc();
  registerArchetypeIpc();
  registerConceptPropertyIpc();
  registerConceptContentIpc();
  registerPtyIpc();
  registerConfigIpc();
}
