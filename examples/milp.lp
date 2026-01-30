\ Production planning with fixed costs:
\ - Two machines A and B with activation costs (binary decision)
\ - Integer production quantities on each machine
\ - Machine capacities only apply when activated (big-M constraints)
\ - Limited raw material shared between machines
\
\ Analysis:
\   - Only A: x_a=10, profit = 100 - 50 = 50
\   - Only B: x_b=8, profit = 96 - 60 = 36
\   - Both: x_a + x_b <= 12, best is x_b=8, x_a=4: profit = 40 + 96 - 110 = 26
\ Optimal: use only machine A, produce 10 units, profit = 50
Maximize
  obj: 10 x_a + 12 x_b - 50 y_a - 60 y_b
Subject To
  cap_a: x_a - 10 y_a <= 0
  cap_b: x_b - 8 y_b <= 0
  material: x_a + x_b <= 12
Bounds
  0 <= x_a <= 10
  0 <= x_b <= 8
General
  x_a x_b
Binary
  y_a y_b
End
