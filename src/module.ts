import type { EmscriptenModule, SCIPModuleFactory, SCIPOptions } from './types.js';

/** Loads a fresh SCIP WebAssembly module with the given options. */
export async function loadSCIPModule(
  options?: SCIPOptions,
): Promise<EmscriptenModule> {
  const createModule = await loadSCIPFactory();

  const consoleConfig = options?.console ?? { log: null, error: null };
  const moduleOptions: Record<string, unknown> = {
    print: consoleConfig.log ?? (() => {}),
    printErr: consoleConfig.error ?? (() => {}),
  };

  return createModule(moduleOptions);
}

async function loadSCIPFactory(): Promise<SCIPModuleFactory> {
  const { default: SCIPModuleFactory } = await import(
    new URL('../build/scip.js', import.meta.url).href,
  );

  return SCIPModuleFactory;
}
