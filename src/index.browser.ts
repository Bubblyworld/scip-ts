import { SCIP as BaseSCIP } from './solver.js';
import type { SCIPOptions } from './types.js';

export type { SCIPOptions, SolveResult, SolveStatus } from './types.js';
export {
  Model,
  Var,
  LinExpr,
  Constraint,
  Solution,
  sum,
} from './model/index.js';
export type { VarType, Sense, Term, ModelFormat } from './model/index.js';

/**
 * Sub-SCIP heuristics that must be disabled in browser environments.
 * These create recursive solver instances whose deep call stacks overflow
 * the browser's ~1MB native stack limit.
 */
const BROWSER_DISABLED_HEURISTICS: string[] = [
  'rens', 'rins', 'crossover', 'mutation', 'localbranching',
  'dins', 'trustregion', 'alns', 'feaspump', 'undercover',
  'proximity', 'vbounds',
];

/** SCIP solver configured for browser environments. */
export class SCIP extends BaseSCIP {
  static override async create(options?: SCIPOptions): Promise<SCIP> {
    const base = await BaseSCIP.create(options);
    const instance = Object.setPrototypeOf(base, SCIP.prototype) as SCIP;

    for (const name of BROWSER_DISABLED_HEURISTICS) {
      instance.setParam(`heuristics/${name}/freq`, -1);
    }

    return instance;
  }
}
