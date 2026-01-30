import { describe, it, expect, afterEach } from 'vitest';
import { SCIP } from '../src/index.node.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fixtures } from './fixtures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function examplePath(name: string): string {
  return join(__dirname, '..', 'examples', `${name}.lp`);
}

describe('SCIP', () => {
  let scip: SCIP | null = null;

  afterEach(() => {
    if (scip) {
      scip.free();
      scip = null;
    }
  });

  describe('instance lifecycle', () => {
    it('should create a SCIP instance', async () => {
      scip = await SCIP.create({ console: { log: null, error: null } });
      expect(scip).toBeDefined();
    });

    it('should read a problem from file', async () => {
      scip = await SCIP.create({ console: { log: null, error: null } });
      await expect(scip.readProblem(examplePath('simple'))).resolves.not.toThrow();
    });

    it('should throw when using a freed instance', async () => {
      scip = await SCIP.create({ console: { log: null, error: null } });
      scip.free();

      await expect(scip.readProblem(examplePath('simple'))).rejects.toThrow(
        'SCIP instance has been freed'
      );

      scip = null;
    });

    it('should handle multiple free calls gracefully', async () => {
      scip = await SCIP.create({ console: { log: null, error: null } });
      scip.free();
      expect(() => scip!.free()).not.toThrow();
      scip = null;
    });
  });

  describe('solving examples', () => {
    for (const fixture of fixtures) {
      it(`should solve ${fixture.name}`, async () => {
        scip = await SCIP.create({ console: { log: null, error: null } });
        await scip.readProblem(examplePath(fixture.name));
        const result = await scip.solve();

        expect(result.status).toBe(fixture.expected.status);

        if (fixture.expected.objective !== undefined) {
          expect(result.objective).toBeCloseTo(fixture.expected.objective, 5);
        } else {
          expect(result.objective).toBeUndefined();
        }

        if (fixture.expected.solution !== undefined) {
          expect(result.solution).toBeDefined();
          for (const [key, value] of Object.entries(fixture.expected.solution)) {
            expect(result.solution!.get(key)).toBeCloseTo(value, 5);
          }
        } else if (fixture.expected.status === 'infeasible') {
          expect(result.solution).toBeUndefined();
        }
      });
    }
  });
});
