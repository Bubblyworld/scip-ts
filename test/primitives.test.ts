import { describe, it, expect } from 'vitest';
import { Model, LinExpr, sum, exprBounds, isIntegral } from '../src/index.node.js';

describe('exprBounds', () => {
  it('should compute bounds from a single variable', () => {
    const model = new Model();
    const x = model.numVar(-3, 7);
    expect(exprBounds(x)).toEqual({ lb: -3, ub: 7 });
  });

  it('should compute bounds from a linear expression', () => {
    const model = new Model();
    const x = model.numVar(0, 10);
    const y = model.numVar(-5, 5);
    // 2x - 3y + 1: lb = 2*0 - 3*5 + 1 = -14, ub = 2*10 - 3*(-5) + 1 = 36
    const expr = x.times(2).minus(y.times(3)).plus(1);
    expect(exprBounds(expr)).toEqual({ lb: -14, ub: 36 });
  });

  it('should handle constant expressions', () => {
    const expr = new LinExpr([], 42);
    expect(exprBounds(expr)).toEqual({ lb: 42, ub: 42 });
  });

  it('should return infinite bounds for unbounded variables', () => {
    const model = new Model();
    const x = model.numVar(0, Infinity);
    const b = exprBounds(x);
    expect(b.lb).toBe(0);
    expect(b.ub).toBe(Infinity);
  });
});

describe('boolean operations', () => {
  it('and() should produce correct truth table', async () => {
    for (const [xVal, yVal] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      const model = new Model();
      const x = model.boolVar('x');
      const y = model.boolVar('y');
      const z = model.and(x, y);

      model.addConstraint(x.eq(xVal));
      model.addConstraint(y.eq(yVal));
      model.minimize(z);

      const sol = await model.solve();
      expect(sol.status).toBe('optimal');
      expect(sol.getValue(z)).toBeCloseTo(xVal & yVal, 5);
    }
  });

  it('and() with single arg returns the same variable', () => {
    const model = new Model();
    const x = model.boolVar('x');
    expect(model.and(x)).toBe(x);
  });

  it('and() with no args throws', () => {
    const model = new Model();
    expect(() => model.and()).toThrow('at least 1');
  });

  it('and() with 3 variables', async () => {
    const model = new Model();
    const a = model.boolVar('a');
    const b = model.boolVar('b');
    const c = model.boolVar('c');
    const z = model.and(a, b, c);

    model.addConstraint(a.eq(1));
    model.addConstraint(b.eq(1));
    model.addConstraint(c.eq(1));
    model.maximize(z);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(z)).toBeCloseTo(1, 5);
  });

  it('or() should produce correct truth table', async () => {
    for (const [xVal, yVal] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      const model = new Model();
      const x = model.boolVar('x');
      const y = model.boolVar('y');
      const z = model.or(x, y);

      model.addConstraint(x.eq(xVal));
      model.addConstraint(y.eq(yVal));
      model.maximize(z);

      const sol = await model.solve();
      expect(sol.status).toBe('optimal');
      expect(sol.getValue(z)).toBeCloseTo(xVal | yVal, 5);
    }
  });

  it('or() with single arg returns the same variable', () => {
    const model = new Model();
    const x = model.boolVar('x');
    expect(model.or(x)).toBe(x);
  });

  it('not() should flip binary variable', async () => {
    for (const xVal of [0, 1]) {
      const model = new Model();
      const x = model.boolVar('x');
      const z = model.not(x);

      model.addConstraint(x.eq(xVal));
      model.minimize(z);

      const sol = await model.solve();
      expect(sol.status).toBe('optimal');
      expect(sol.getValue(z)).toBeCloseTo(1 - xVal, 5);
    }
  });

  it('xor() should produce correct truth table (constraints method)', async () => {
    for (const [xVal, yVal] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      const model = new Model();
      const x = model.boolVar('x');
      const y = model.boolVar('y');
      const z = model.xor(x, y);

      model.addConstraint(x.eq(xVal));
      model.addConstraint(y.eq(yVal));
      model.minimize(z);

      const sol = await model.solve();
      expect(sol.status).toBe('optimal');
      expect(sol.getValue(z)).toBeCloseTo(xVal ^ yVal, 5);
    }
  });

  it('xor() should produce correct truth table (compact method)', async () => {
    for (const [xVal, yVal] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      const model = new Model();
      const x = model.boolVar('x');
      const y = model.boolVar('y');
      const z = model.xor(x, y, { method: 'compact' });

      model.addConstraint(x.eq(xVal));
      model.addConstraint(y.eq(yVal));
      model.minimize(z);

      const sol = await model.solve();
      expect(sol.status).toBe('optimal');
      expect(sol.getValue(z)).toBeCloseTo(xVal ^ yVal, 5);
    }
  });
});

describe('cardinality constraints', () => {
  it('addAtMost should limit active variables', async () => {
    const model = new Model();
    const vars = [model.boolVar('a'), model.boolVar('b'), model.boolVar('c')];
    model.addAtMost(1, ...vars);
    model.maximize(sum(...vars));

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.objective).toBeCloseTo(1, 5);
  });

  it('addAtLeast should require minimum active variables', async () => {
    const model = new Model();
    const vars = [model.boolVar('a'), model.boolVar('b'), model.boolVar('c')];
    model.addAtLeast(2, ...vars);
    model.minimize(sum(...vars));

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.objective).toBeCloseTo(2, 5);
  });

  it('addExactly should require exact count', async () => {
    const model = new Model();
    const vars = [model.boolVar('a'), model.boolVar('b'), model.boolVar('c')];
    model.addExactly(2, ...vars);
    model.maximize(sum(...vars));

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.objective).toBeCloseTo(2, 5);
  });
});

describe('implication', () => {
  it('addImplication should enforce x <= y', async () => {
    const model = new Model();
    const x = model.boolVar('x');
    const y = model.boolVar('y');
    model.addImplication(x, y);

    model.addConstraint(x.eq(1));
    model.minimize(y);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(y)).toBeCloseTo(1, 5);
  });

  it('addImplication should allow y=0 when x=0', async () => {
    const model = new Model();
    const x = model.boolVar('x');
    const y = model.boolVar('y');
    model.addImplication(x, y);

    model.addConstraint(x.eq(0));
    model.minimize(y);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(y)).toBeCloseTo(0, 5);
  });
});

describe('indicator constraints', () => {
  it('should enforce <= constraint when delta=1', async () => {
    const model = new Model();
    const x = model.numVar(0, 100, 'x');
    const delta = model.boolVar('delta');

    model.addIndicator(delta, x.leq(10));
    model.addConstraint(delta.eq(1));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(10, 5);
  });

  it('should not enforce <= constraint when delta=0', async () => {
    const model = new Model();
    const x = model.numVar(0, 100, 'x');
    const delta = model.boolVar('delta');

    model.addIndicator(delta, x.leq(10));
    model.addConstraint(delta.eq(0));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(100, 5);
  });

  it('should enforce >= constraint when delta=1', async () => {
    const model = new Model();
    const x = model.numVar(0, 100, 'x');
    const delta = model.boolVar('delta');

    model.addIndicator(delta, x.geq(50));
    model.addConstraint(delta.eq(1));
    model.minimize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(50, 5);
  });

  it('should enforce = constraint when delta=1', async () => {
    const model = new Model();
    const x = model.numVar(0, 100, 'x');
    const delta = model.boolVar('delta');

    model.addIndicator(delta, x.eq(42));
    model.addConstraint(delta.eq(1));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(42, 5);
  });

  it('should support active=0', async () => {
    const model = new Model();
    const x = model.numVar(0, 100, 'x');
    const delta = model.boolVar('delta');

    model.addIndicator(delta, x.leq(10), { active: 0 });
    model.addConstraint(delta.eq(0));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(10, 5);
  });

  it('should support explicit bigM', async () => {
    const model = new Model();
    const x = model.numVar(0, Infinity, 'x');
    const delta = model.boolVar('delta');

    model.addIndicator(delta, x.leq(10), { bigM: 1000 });
    model.addConstraint(delta.eq(1));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(10, 5);
  });

  it('should throw on infinite bounds without explicit bigM', () => {
    const model = new Model();
    const x = model.numVar(0, Infinity, 'x');
    const delta = model.boolVar('delta');

    expect(() => model.addIndicator(delta, x.leq(10))).toThrow('infinite bounds');
  });
});

describe('abs', () => {
  it('should compute absolute value of positive expression', async () => {
    const model = new Model();
    const x = model.numVar(-10, 10, 'x');
    const t = model.abs(x);

    model.addConstraint(x.eq(7));
    model.minimize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(7, 5);
  });

  it('should compute absolute value of negative expression', async () => {
    const model = new Model();
    const x = model.numVar(-10, 10, 'x');
    const t = model.abs(x);

    model.addConstraint(x.eq(-5));
    model.minimize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(5, 5);
  });

  it('should compute absolute value of zero', async () => {
    const model = new Model();
    const x = model.numVar(-10, 10, 'x');
    const t = model.abs(x);

    model.addConstraint(x.eq(0));
    model.minimize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(0, 5);
  });

  it('should minimize absolute value correctly', async () => {
    const model = new Model();
    const x = model.numVar(-10, 10, 'x');
    const t = model.abs(x.minus(3));

    model.minimize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(3, 5);
    expect(sol.getValue(t)).toBeCloseTo(0, 5);
  });
});

describe('max', () => {
  it('should compute maximum of two expressions', async () => {
    const model = new Model();
    const x = model.numVar(0, 10, 'x');
    const y = model.numVar(0, 10, 'y');
    const t = model.max([x, y]);

    model.addConstraint(x.eq(3));
    model.addConstraint(y.eq(7));
    model.minimize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(7, 5);
  });

  it('should compute maximum of three expressions', async () => {
    const model = new Model();
    const x = model.numVar(0, 10, 'x');
    const y = model.numVar(0, 10, 'y');
    const z = model.numVar(0, 10, 'z');
    const t = model.max([x, y, z]);

    model.addConstraint(x.eq(2));
    model.addConstraint(y.eq(8));
    model.addConstraint(z.eq(5));
    model.minimize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(8, 5);
  });

  it('max of single var returns the same variable', () => {
    const model = new Model();
    const x = model.numVar(0, 10);
    expect(model.max([x])).toBe(x);
  });

  it('max of empty array throws', () => {
    const model = new Model();
    expect(() => model.max([])).toThrow('at least 1');
  });
});

describe('min', () => {
  it('should compute minimum of two expressions', async () => {
    const model = new Model();
    const x = model.numVar(0, 10, 'x');
    const y = model.numVar(0, 10, 'y');
    const t = model.min([x, y]);

    model.addConstraint(x.eq(3));
    model.addConstraint(y.eq(7));
    model.maximize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(3, 5);
  });

  it('should compute minimum of three expressions', async () => {
    const model = new Model();
    const x = model.numVar(0, 10, 'x');
    const y = model.numVar(0, 10, 'y');
    const z = model.numVar(0, 10, 'z');
    const t = model.min([x, y, z]);

    model.addConstraint(x.eq(2));
    model.addConstraint(y.eq(8));
    model.addConstraint(z.eq(5));
    model.maximize(t);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(t)).toBeCloseTo(2, 5);
  });

  it('min of single var returns the same variable', () => {
    const model = new Model();
    const x = model.numVar(0, 10);
    expect(model.min([x])).toBe(x);
  });

  it('min of empty array throws', () => {
    const model = new Model();
    expect(() => model.min([])).toThrow('at least 1');
  });
});

describe('product', () => {
  it('boolean * boolean should equal AND', async () => {
    for (const [xVal, yVal] of [[0, 0], [0, 1], [1, 0], [1, 1]] as const) {
      const model = new Model();
      const x = model.boolVar('x');
      const y = model.boolVar('y');
      const w = model.product(x, y);

      model.addConstraint(x.eq(xVal));
      model.addConstraint(y.eq(yVal));
      model.minimize(w);

      const sol = await model.solve();
      expect(sol.status).toBe('optimal');
      expect(sol.getValue(w)).toBeCloseTo(xVal * yVal, 5);
    }
  });

  it('boolean * continuous should use Glover linearization', async () => {
    const model = new Model();
    const delta = model.boolVar('delta');
    const z = model.numVar(0, 10, 'z');
    const w = model.product(delta, z);

    model.addConstraint(delta.eq(1));
    model.addConstraint(z.eq(7));
    model.minimize(w);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(w)).toBeCloseTo(7, 5);
  });

  it('boolean * continuous with delta=0 should give 0', async () => {
    const model = new Model();
    const delta = model.boolVar('delta');
    const z = model.numVar(0, 10, 'z');
    const w = model.product(delta, z);

    model.addConstraint(delta.eq(0));
    model.addConstraint(z.eq(7));
    model.maximize(w);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(w)).toBeCloseTo(0, 5);
  });

  it('continuous * boolean should also work (order-independent)', async () => {
    const model = new Model();
    const z = model.numVar(-5, 10, 'z');
    const delta = model.boolVar('delta');
    const w = model.product(z, delta);

    model.addConstraint(delta.eq(1));
    model.addConstraint(z.eq(-3));
    model.maximize(w);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(w)).toBeCloseTo(-3, 5);
  });

  it('continuous * continuous should throw', () => {
    const model = new Model();
    const x = model.numVar(0, 10);
    const y = model.numVar(0, 10);
    expect(() => model.product(x, y)).toThrow('at least one binary');
  });
});

describe('isIntegral', () => {
  it('should return true for integer and binary variables', () => {
    const model = new Model();
    expect(isIntegral(model.intVar(0, 10))).toBe(true);
    expect(isIntegral(model.boolVar())).toBe(true);
  });

  it('should return false for continuous variables', () => {
    const model = new Model();
    expect(isIntegral(model.numVar(0, 10))).toBe(false);
  });

  it('should return true for integer linear combinations', () => {
    const model = new Model();
    const x = model.intVar(0, 10);
    const y = model.boolVar();
    expect(isIntegral(x.times(3).plus(y.times(2)).plus(5))).toBe(true);
  });

  it('should return false with non-integer coefficients', () => {
    const model = new Model();
    const x = model.intVar(0, 10);
    expect(isIntegral(x.times(1.5))).toBe(false);
  });

  it('should return false with non-integer constant', () => {
    const model = new Model();
    const x = model.intVar(0, 10);
    expect(isIntegral(x.plus(0.5))).toBe(false);
  });

  it('should return false when mixing continuous vars', () => {
    const model = new Model();
    const x = model.intVar(0, 10);
    const y = model.numVar(0, 10);
    expect(isIntegral(x.plus(y))).toBe(false);
  });
});

describe('semiContVar', () => {
  it('should allow value in [lb, ub]', async () => {
    const model = new Model();
    const x = model.semiContVar(2, 8);
    model.addConstraint(x.geq(5));
    model.minimize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(5, 5);
  });

  it('should allow value of 0', async () => {
    const model = new Model();
    const x = model.semiContVar(2, 8);
    model.addConstraint(x.leq(1));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(0, 5);
  });

  it('should not allow values in (0, lb)', async () => {
    const model = new Model();
    const x = model.semiContVar(5, 10);
    model.maximize(x);
    model.addConstraint(x.leq(3));

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(0, 5);
  });

  it('should throw for invalid bounds', () => {
    const model = new Model();
    expect(() => model.semiContVar(0, 10)).toThrow('requires 0 < lb <= ub');
    expect(() => model.semiContVar(-1, 10)).toThrow('requires 0 < lb <= ub');
    expect(() => model.semiContVar(5, 3)).toThrow('requires 0 < lb <= ub');
  });
});

describe('divMod', () => {
  it('should compute quotient and remainder', async () => {
    const model = new Model();
    const x = model.intVar(0, 100, 'x');
    const { quotient, remainder } = model.divMod(x, 7);

    model.addConstraint(x.eq(23));
    model.minimize(quotient);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(quotient)).toBeCloseTo(3, 5);
    expect(sol.getValue(remainder)).toBeCloseTo(2, 5);
  });

  it('should handle exact division', async () => {
    const model = new Model();
    const x = model.intVar(0, 100, 'x');
    const { quotient, remainder } = model.divMod(x, 5);

    model.addConstraint(x.eq(35));
    model.minimize(quotient);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(quotient)).toBeCloseTo(7, 5);
    expect(sol.getValue(remainder)).toBeCloseTo(0, 5);
  });

  it('should handle zero', async () => {
    const model = new Model();
    const x = model.intVar(0, 100, 'x');
    const { quotient, remainder } = model.divMod(x, 3);

    model.addConstraint(x.eq(0));
    model.minimize(quotient);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(quotient)).toBeCloseTo(0, 5);
    expect(sol.getValue(remainder)).toBeCloseTo(0, 5);
  });

  it('should throw for non-positive d', () => {
    const model = new Model();
    const x = model.intVar(0, 100);
    expect(() => model.divMod(x, 0)).toThrow('positive integer');
    expect(() => model.divMod(x, -3)).toThrow('positive integer');
    expect(() => model.divMod(x, 2.5)).toThrow('positive integer');
  });

  it('should throw for negative expression', () => {
    const model = new Model();
    const x = model.intVar(-10, 100);
    expect(() => model.divMod(x, 3)).toThrow('non-negative');
  });
});

describe('addEitherOr', () => {
  it('should enforce at least one constraint', async () => {
    const model = new Model();
    const x = model.numVar(0, 20, 'x');
    const y = model.numVar(0, 20, 'y');

    model.addEitherOr(x.leq(5), y.leq(5));
    model.maximize(x.plus(y));

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    const xVal = sol.getValue(x)!;
    const yVal = sol.getValue(y)!;
    expect(xVal <= 5 + 1e-6 || yVal <= 5 + 1e-6).toBe(true);
    expect(xVal + yVal).toBeCloseTo(25, 5);
  });

  it('should allow both constraints to hold', async () => {
    const model = new Model();
    const x = model.numVar(0, 20, 'x');
    const y = model.numVar(0, 20, 'y');

    model.addEitherOr(x.leq(5), y.leq(5));
    model.minimize(x.plus(y));

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(0, 5);
    expect(sol.getValue(y)).toBeCloseTo(0, 5);
  });
});

describe('reify', () => {
  it('should reify <= constraint (satisfied)', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.leq(5));

    model.addConstraint(x.eq(3));
    model.minimize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(1, 5);
  });

  it('should reify <= constraint (not satisfied)', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.leq(5));

    model.addConstraint(x.eq(8));
    model.maximize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(0, 5);
  });

  it('should reify <= constraint (boundary)', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.leq(5));

    model.addConstraint(x.eq(5));
    model.minimize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(1, 5);
  });

  it('should reify >= constraint', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.geq(5));

    model.addConstraint(x.eq(7));
    model.minimize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(1, 5);
  });

  it('should reify >= constraint (not satisfied)', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.geq(5));

    model.addConstraint(x.eq(3));
    model.maximize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(0, 5);
  });

  it('should reify = constraint (satisfied)', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.eq(5));

    model.addConstraint(x.eq(5));
    model.minimize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(1, 5);
  });

  it('should reify = constraint (not satisfied)', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.eq(5));

    model.addConstraint(x.eq(7));
    model.maximize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(0, 5);
  });

  it('should use delta=1 to force constraint satisfaction', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.leq(3));

    model.addConstraint(delta.eq(1));
    model.maximize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(3, 5);
  });

  it('should use delta=0 to force constraint violation', async () => {
    const model = new Model();
    const x = model.intVar(0, 10, 'x');
    const delta = model.reify(x.leq(5));

    model.addConstraint(delta.eq(0));
    model.minimize(x);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(x)).toBeCloseTo(6, 5);
  });

  it('should support explicit bigM for unbounded vars', async () => {
    const model = new Model();
    const x = model.intVar(0, Infinity, 'x');
    const delta = model.reify(x.leq(5), { bigM: 100 });

    model.addConstraint(x.eq(3));
    model.minimize(delta);

    const sol = await model.solve();
    expect(sol.status).toBe('optimal');
    expect(sol.getValue(delta)).toBeCloseTo(1, 5);
  });
});
