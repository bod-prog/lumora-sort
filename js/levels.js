const PALETTE = [
  "#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0",
  "#7b2cbf", "#f72585", "#80ffdb", "#f77f00",
  "#90be6d", "#c77dff"
];

function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function cloneTubes(tubes) {
  return tubes.map(t => t.slice());
}

function topColor(tube) {
  return tube.length ? tube[tube.length - 1] : null;
}

function canPour(from, to, cap = 4) {
  if (!from.length || from === to) return false;
  if (to.length >= cap) return false;
  const c = topColor(from);
  return to.length === 0 || topColor(to) === c;
}

function pourAmount(from, to, cap = 4) {
  if (!canPour(from, to, cap)) return 0;
  const c = topColor(from);
  let n = 0;
  for (let i = from.length - 1; i >= 0 && from[i] === c; i--) n++;
  return Math.min(n, cap - to.length);
}

function doPour(from, to, cap = 4, max = 99) {
  const n = Math.min(pourAmount(from, to, cap), max);
  for (let i = 0; i < n; i++) to.push(from.pop());
  return n;
}

function isSolved(tubes, cap = 4) {
  return tubes.every(t => t.length === 0 || (t.length === cap && t.every(c => c === t[0])));
}

function reversePour(tubes, rng, cap = 4) {
  const src = [];
  tubes.forEach((t, i) => { if (t.length) src.push(i); });
  if (!src.length) return false;
  const from = src[Math.floor(rng() * src.length)];
  const color = tubes[from][tubes[from].length - 1];
  let run = 0;
  for (let i = tubes[from].length - 1; i >= 0 && tubes[from][i] === color; i--) run++;
  const n = 1 + Math.floor(rng() * run);
  const dests = [];
  tubes.forEach((t, i) => { if (i !== from && t.length + n <= cap) dests.push(i); });
  if (!dests.length) return false;
  const to = dests[Math.floor(rng() * dests.length)];
  for (let i = 0; i < n; i++) tubes[to].push(tubes[from].pop());
  return true;
}

export function generateLevel(level, seedExtra = "") {
  const cap = 4;
  const colors = Math.min(3 + Math.floor((level - 1) / 4), 10);
  const empty = level < 6 ? 2 : (level % 7 === 0 ? 2 : 1);
  const tubes = [];
  for (let c = 0; c < colors; c++) tubes.push(Array(cap).fill(c));
  for (let e = 0; e < empty; e++) tubes.push([]);
  const rng = mulberry32(hashString(`lumora-${level}-${seedExtra}`));
  const mixes = 25 + level * 6;
  for (let i = 0; i < mixes; i++) reversePour(tubes, rng, cap);
  let guard = 0;
  while (isSolved(tubes, cap) && guard++ < 30) reversePour(tubes, rng, cap);
  return { tubes, cap, colors, empty };
}

export function generateDaily(dateStr) {
  return generateLevel(18 + (Number(dateStr.replaceAll("-", "")) % 25), dateStr);
}

export { PALETTE, cloneTubes, topColor, canPour, pourAmount, doPour, isSolved };
