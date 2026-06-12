// Sky Squadron — barrel re-exports for the registry.
//
// `src/games/registry.ts` imports from this module rather than
// reaching into the individual files; this keeps the registry
// decoupled from the internal folder layout.
export { default as ShootingPlaneGame } from './ShootingPlaneGame';
export { useShootingPlane } from './useShootingPlane';
export * from './types';
export * from './constants';
