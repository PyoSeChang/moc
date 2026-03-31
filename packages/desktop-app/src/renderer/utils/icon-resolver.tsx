import React from 'react';
import { icons, type LucideIcon } from 'lucide-react';

/** kebab-case → PascalCase: "book-open" → "BookOpen", "settings" → "Settings" */
function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
}

/** Backwards-compat aliases for icon names that don't match lucide's kebab convention */
const ALIASES: Record<string, string> = {
  wand: 'Wand2',
};

/** Resolve a kebab-case icon name to a LucideIcon component */
function lookupIcon(name: string): LucideIcon | undefined {
  const alias = ALIASES[name];
  if (alias) return (icons as Record<string, LucideIcon>)[alias];
  return (icons as Record<string, LucideIcon>)[toPascalCase(name)];
}

/**
 * Resolve an icon string to a lucide component.
 * If the string matches a known lucide icon name, renders the component.
 * Otherwise, renders the raw string (emoji fallback).
 */
export function resolveIcon(icon: string, size = 20): React.ReactNode {
  const Icon = lookupIcon(icon);
  if (Icon) {
    return <Icon size={size} />;
  }
  // Emoji or unknown string fallback
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}
