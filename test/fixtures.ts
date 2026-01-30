export type ExpectedStatus = 'optimal' | 'infeasible' | 'unbounded';

export interface ExpectedResult {
  status: ExpectedStatus;
  objective?: number;
  solution?: Record<string, number>;
}

export interface TestFixture {
  name: string;
  expected: ExpectedResult;
}

export const fixtures: TestFixture[] = [
  {
    name: 'simple',
    expected: {
      status: 'optimal',
      objective: 20,
      solution: { x: 0, y: 10 },
    },
  },
  {
    name: 'infeasible',
    expected: {
      status: 'infeasible',
    },
  },
  {
    name: 'tsp',
    expected: {
      status: 'optimal',
      objective: 80,
    },
  },
  {
    name: 'binpacking',
    expected: {
      status: 'optimal',
      objective: 2,
    },
  },
  {
    name: 'milp',
    expected: {
      status: 'optimal',
      objective: 50,
      solution: { y_a: 1, y_b: 0, x_a: 10, x_b: 0 },
    },
  },
];
