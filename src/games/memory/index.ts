// Magic Garden (Memory Match) — barrel re-exports for the registry.
//
// `src/games/registry.ts` imports from this module rather than
// reaching into the individual files; this keeps the registry
// decoupled from the internal folder layout.
export { default as MemoryGame } from './MemoryGame';
export { useMemory } from './useMemory';
export * from './types';
export * from './constants';
