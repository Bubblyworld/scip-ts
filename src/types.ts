export type SolveStatus =
  | 'optimal'
  | 'infeasible'
  | 'unbounded'
  | 'inforunbd'
  | 'timelimit'
  | 'nodelimit'
  | 'stallnodelimit'
  | 'gaplimit'
  | 'sollimit'
  | 'bestsollimit'
  | 'restartlimit'
  | 'unknown';

export interface SolveResult {
  status: SolveStatus;
  objective?: number;
  solution?: Map<string, number>;
}

export interface SCIPOptions {
}

export interface EmscriptenModule {
  ccall: (
    name: string,
    returnType: string | null,
    argTypes: string[],
    args: unknown[]
  ) => unknown;
  cwrap: (
    name: string,
    returnType: string | null,
    argTypes: string[]
  ) => (...args: unknown[]) => unknown;
  getValue: (ptr: number, type: string) => number;
  setValue: (ptr: number, value: number, type: string) => void;
  UTF8ToString: (ptr: number) => string;
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  FS: {
    writeFile: (path: string, data: string | Uint8Array) => void;
    readFile: (path: string, opts?: { encoding?: string }) => string | Uint8Array;
    unlink: (path: string) => void;
    mkdir: (path: string) => void;
  };
}

export type SCIPModuleFactory = () => Promise<EmscriptenModule>;
