\ 4-city TSP with distances:
\   0 -- 1: 10
\   0 -- 2: 15
\   0 -- 3: 20
\   1 -- 2: 35
\   1 -- 3: 25
\   2 -- 3: 30
\ Optimal tour: 0 -> 1 -> 3 -> 2 -> 0 with cost 10 + 25 + 30 + 15 = 80
Minimize
  obj: 10 x01 + 15 x02 + 20 x03 + 35 x12 + 25 x13 + 30 x23
Subject To
  deg0: x01 + x02 + x03 = 2
  deg1: x01 + x12 + x13 = 2
  deg2: x02 + x12 + x23 = 2
  deg3: x03 + x13 + x23 = 2
  sub012: x01 + x02 + x12 <= 2
  sub013: x01 + x03 + x13 <= 2
  sub023: x02 + x03 + x23 <= 2
  sub123: x12 + x13 + x23 <= 2
Binary
  x01 x02 x03 x12 x13 x23
End
