import type { EmscriptenModule, SCIPModuleFactory, SCIPOptions } from './types.js';

let singleton: Promise<EmscriptenModule> | null = null;

export async function loadSCIPModule(
  options?: SCIPOptions,
): Promise<EmscriptenModule> {
  if (singleton) {
    return singleton;
  }

  singleton = (async () => {
    const createModule = await loadSCIPFactory();
    return createModule();
  })();

  return singleton;
}

async function loadSCIPFactory(): Promise<SCIPModuleFactory> {
  const { default: SCIPModuleFactory } = await import(
    new URL('../build/scip.js', import.meta.url).href,
  );

  return SCIPModuleFactory;
}
