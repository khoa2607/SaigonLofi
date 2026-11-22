// Building definitions. Footprints are in tiles; `work` is builder-months to complete; costs are paid as construction progresses.
export const BT = {
  shelter:  { name: 'Shelter',  w: 2, d: 2, cap: 6, cost: { wood: 10, stone: 0 },  work: 4,  dwelling: true },
  house:    { name: 'House',    w: 2, d: 2, cap: 5, cost: { wood: 14, stone: 3 },  work: 6,  dwelling: true },
  farm:     { name: 'Farm',     w: 3, d: 3, cap: 0, cost: { wood: 6,  stone: 0 },  work: 4 },
  storage:  { name: 'Storage',  w: 2, d: 2, cap: 0, cost: { wood: 22, stone: 6 },  work: 6 },
  well:     { name: 'Well',     w: 1, d: 1, cap: 0, cost: { wood: 3,  stone: 10 }, work: 4 },
  workshop: { name: 'Workshop', w: 2, d: 2, cap: 0, cost: { wood: 26, stone: 10 }, work: 8 },
};
export const TYPES = Object.keys(BT);
