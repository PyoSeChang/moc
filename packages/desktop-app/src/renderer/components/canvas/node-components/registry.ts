/**
 * Node Component Registry
 *
 * Central registry for all node rendering components.
 * Supports Level 1 (default), Level 2 (app-provided), Level 3 (culture-provided).
 */

import type { NodeComponent } from './types';
import { NodeCardDefault } from './NodeCardDefault';

/** Component registry (extensible) */
const registry: Record<string, NodeComponent> = {
  default: NodeCardDefault,
};

/**
 * Register a node component
 * @param key - Component key (e.g., 'default', 'profile', 'timeline')
 * @param component - React component
 */
export function registerNodeComponent(key: string, component: NodeComponent): void {
  registry[key] = component;
}

/**
 * Get a node component by key
 * @param key - Component key
 * @returns Component or default component
 */
export function getNodeComponent(key?: string): NodeComponent {
  if (!key) {
    return registry.default;
  }

  return registry[key] || registry.default;
}

/**
 * Check if a component is registered
 * @param key - Component key
 */
export function hasNodeComponent(key: string): boolean {
  return key in registry;
}

/**
 * Get all registered component keys
 */
export function getRegisteredKeys(): string[] {
  return Object.keys(registry);
}
