\ Bin packing: 4 items with sizes 3, 3, 2, 2 and bin capacity 5
\ Optimal: 2 bins, e.g. {3,2} and {3,2}
Minimize
  obj: y0 + y1 + y2 + y3
Subject To
  item0: x00 + x01 + x02 + x03 = 1
  item1: x10 + x11 + x12 + x13 = 1
  item2: x20 + x21 + x22 + x23 = 1
  item3: x30 + x31 + x32 + x33 = 1
  cap0: 3 x00 + 3 x10 + 2 x20 + 2 x30 - 5 y0 <= 0
  cap1: 3 x01 + 3 x11 + 2 x21 + 2 x31 - 5 y1 <= 0
  cap2: 3 x02 + 3 x12 + 2 x22 + 2 x32 - 5 y2 <= 0
  cap3: 3 x03 + 3 x13 + 2 x23 + 2 x33 - 5 y3 <= 0
Binary
  x00 x01 x02 x03
  x10 x11 x12 x13
  x20 x21 x22 x23
  x30 x31 x32 x33
  y0 y1 y2 y3
End
