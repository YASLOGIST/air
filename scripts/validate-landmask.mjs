import { readFileSync } from 'node:fs';
const src = readFileSync('src/three/airgl/globe/landmask.ts', 'utf8');
const grab = (name) => {
  const m = src.match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`;'));
  if (!m) throw new Error('missing ' + name);
  return m[1];
};
const parse = (d) =>
  d.split(';').map((r) => r.trim()).filter(Boolean)
    .map((r) => r.split(/\s+/).map((p) => p.split(',').map(Number)));
const land = parse(grab('LAND_DATA'));
const water = parse(grab('WATER_DATA'));
const bounds = land.map((r) => {
  let a = 180, b = -180, c = 90, e = -90;
  for (const [lo, la] of r) { a = Math.min(a, lo); b = Math.max(b, lo); c = Math.min(c, la); e = Math.max(e, la); }
  return [a, b, c, e];
});
function contains(ring, lat, lon) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lonI, latI] = ring[i], [lonJ, latJ] = ring[j];
    if (latI > lat !== latJ > lat) {
      const cross = lonI + ((lat - latI) * (lonJ - lonI)) / (latJ - latI);
      if (lon < cross) ins = !ins;
    }
  }
  return ins;
}
function isLand(lat, lon) {
  let on = false;
  for (let r = 0; r < land.length; r++) {
    const b = bounds[r];
    if (lat < b[2] || lat > b[3] || lon < b[0] || lon > b[1]) continue;
    if (contains(land[r], lat, lon)) { on = true; break; }
  }
  if (!on) return false;
  for (const w of water) if (contains(w, lat, lon)) return false;
  return true;
}
const cols = 120, rows = 40;
for (let row = 0; row < rows; row++) {
  const lat = 80 - (row + 0.5) * (160 / rows);
  let line = '';
  for (let col = 0; col < cols; col++) {
    const lon = -180 + (col + 0.5) * (360 / cols);
    line += isLand(lat, lon) ? '#' : '.';
  }
  console.log(line);
}
const probes = [
  [30, 31, "Cairo land"], [41, 51, "Caspian water"], [43, 34, "BlackSea water"],
  [35, 18, "Med water"], [21.5, 38.2, "RedSea water"], [-25, 135, "Australia land"],
  [62, 95, "Siberia land"], [64.5, -19, "Iceland land"], [0, -20, "Atlantic water"],
  [37.8, -122.3, "SF land"], [55, 148, "Okhotsk water"], [27, 51.5, "PersianGulf water"],
  [36, 138, "Japan land"], [-33, -63, "Argentina land"], [22.3, -79.5, "Cuba land"],
  [-72, 0, "Antarctica land"], [90, 0, "NorthPole water"], [70, -45, "Greenland land"],
  [48.9, 2.35, "Paris land"], [52.5, 13.4, "Berlin land"], [41, 29, "Istanbul land"],
  [25.3, 55.3, "Dubai land"], [31.2, 121.5, "Shanghai land"], [59.3, 18.05, "Stockholm land"],
  [62, 19, "Bothnia water"], [64, -51, "DavisStrait water"], [67, -100, "Nunavut land"],
  [19.4, 99, "Bangkok land"], [-6.2, 106.85, "Jakarta land"], [-43.5, 172.6, "Christchurch land"],
  [-36.8, 174.8, "Auckland land"], [51.5, -0.1, "London land"], [55.75, 37.6, "Moscow land"],
  [-1.3, 36.8, "Nairobi land"], [28.6, 77.2, "Delhi land"], [39.9, 116.4, "Beijing land"],
  [13.7, 100.5, "BangkokInland land"], [43.6, -79.4, "Toronto land"], [40.4, -3.7, "Madrid land"],
];
for (const [la, lo, n] of probes) console.log(n.padEnd(20), `${la},${lo} =>`, isLand(la, lo));
