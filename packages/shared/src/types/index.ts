/**
 * Barrel re-export for all type modules.
 *
 * Individual type files are also re-exported from the package root
 * (src/index.ts). This file exists for consumers that prefer to
 * import from '@vein-clinic/shared/types'.
 */

export * from './lead';
export * from './conversation';
export * from './extraction';
export * from './playbook';
export * from './policy';
export * from './location';
export * from './scheduling';
export * from './insurance';
export * from './handoff';
export * from './operator';
export * from './slider';
export * from './audit';
export * from './analytics';
export * from './auth';
export * from './orchestration';
export * from './test-session';
export * from './api';
