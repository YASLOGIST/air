/* ── AIRGL · compact landmask for the corridor globe ───────────────────────
   The dot-shell planet needs to know which dots are land. Shipping a raster
   texture (or fetching one) would break the scene's zero-network, zero-asset
   contract, so the coastlines live here as low-poly rings: one integer-degree
   polygon per landmass, authored at the resolution the globe can actually
   express (a dot every ~2° of arc). Total cost: ~3 KB of source, parsed once
   at module load, consulted only while the shell geometry is built — never
   per frame.

   Encoding: "lon,lat lon,lat …" per ring, `;` between rings. Land rings
   describe solid ground; the small WATER ring set carves the enclosed seas
   (Black Sea, Caspian, Sea of Okhotsk) that the coarse outer coastline would
   otherwise swallow. Classification is even-odd ray casting in equirectangular
   space — the sub-degree distortion this introduces near the poles is far
   below the dot lattice's own resolution.
────────────────────────────────────────────────────────────────────────── */

/** [lon, lat] polygon rings, traced along the real coastlines. */
type Ring = readonly (readonly [number, number])[];

const LAND_DATA = `
-168,66 -164,60 -158,58 -152,59 -145,60 -136,58 -130,54 -124,48 -124,43 -124,40 -123,38 -122,37 -121,36 -120,34 -118,34 -117,33 -113,28 -109,23 -105,20 -97,16 -94,18 -91,14 -87,13 -85,11 -83,9 -80,8 -78,8 -81,9 -83,10 -86,12 -88,16 -87,21 -90,21 -91,19 -95,19 -97,21 -97,26 -94,29 -90,29 -84,30 -81,25 -80,27 -81,31 -76,35 -74,40 -70,42 -70,44 -66,45 -65,47 -66,49 -60,50 -58,52 -60,55 -64,60 -70,61 -77,62 -77,58 -79,55 -85,55 -92,57 -94,60 -92,63 -86,66 -95,68 -110,68 -125,70 -140,70 -156,71 -166,69;
-78,8 -75,10 -71,12 -64,10 -60,8 -52,5 -50,0 -44,-3 -38,-5 -35,-8 -39,-13 -39,-18 -41,-22 -48,-25 -53,-33 -57,-38 -62,-40 -65,-45 -68,-50 -68,-55 -74,-52 -75,-46 -73,-40 -71,-33 -70,-25 -70,-18 -76,-14 -81,-6 -80,-2 -78,1 -77,4;
-6,35 0,37 10,37 20,32 30,32 33,29 36,22 37,18 40,15 43,11 48,11 51,12 48,5 44,0 41,-2 40,-10 35,-19 33,-26 28,-33 20,-35 17,-30 12,-18 9,-2 9,4 5,5 -4,5 -8,4 -13,9 -17,14 -17,21 -10,27;
44,-25 50,-16 49,-12 45,-16 43,-22;
-6,36 -2,37 0,39 3,42 5,43 8,44 10,44 12,42 14,41 16,38 17,39 18,40 16,42 13,44 13,45 15,44 17,43 19,42 20,40 21,38 22,36 24,37 26,39 26,40 29,41 32,36 36,36 36,34 35,31 33,28 35,28 39,20 43,12 45,12 52,17 59,22 58,25 56,26 54,25 51,26 50,28 49,30 52,29 56,27 61,25 66,25 68,23 72,21 73,16 76,9 77,8 80,13 84,18 88,22 91,22 94,16 98,10 100,6 103,2 102,5 100,8 100,13 105,9 107,11 109,13 108,16 106,19 108,21 110,21 114,22 117,24 121,28 122,31 120,34 122,37 118,39 121,41 125,39 126,35 129,35 130,38 131,43 135,44 138,48 141,53 139,56 143,59 150,59 156,51 159,54 163,58 170,61 176,65 179,67 176,69 170,70 160,71 150,72 139,73 128,72 113,74 104,77 96,76 86,75 77,73 69,72 67,70 60,70 54,69 48,68 43,67 39,66 37,67 33,69 28,71 25,71 20,70 15,68 12,66 9,64 5,62 5,60 7,58 11,58 13,56 16,56 18,59 19,60 17,62 20,64 24,66 25,65 22,63 21,61 23,60 26,60 28,60 30,60 28,59 24,58 21,56 18,55 14,54 12,54 10,56 10,57 8,57 8,55 5,53 1,51 -2,49 -5,48 -2,47 -1,46 -2,44 -9,43 -9,42 -9,38 -7,37;
-5,50 1,51 2,53 0,54 -2,56 -4,58 -5,57 -3,54 -5,52;
-10,52 -6,52 -6,54 -8,55 -10,54;
-22,64 -16,63 -14,65 -18,66 -22,65;
130,31 131,33 134,34 137,35 140,36 141,39 141,42 145,43 142,45 140,41 139,37 136,36 133,35 130,34 129,32;
95,5 99,3 103,-1 106,-6 103,-6 99,0 95,3;
105,-6 108,-6 110,-7 114,-8 111,-8 107,-7;
109,1 111,3 114,5 117,7 119,4 118,1 116,-2 112,-3 109,-1;
131,-1 135,-2 139,-3 143,-4 147,-6 150,-9 145,-8 141,-8 137,-6 133,-3;
120,14 122,17 121,18 120,16;
122,7 125,9 126,7 124,6;
114,-22 113,-26 115,-33 119,-35 124,-33 129,-32 132,-32 137,-35 140,-38 146,-39 150,-37 153,-32 153,-27 150,-22 146,-19 143,-14 142,-11 141,-15 138,-17 135,-15 132,-11 129,-15 125,-14 121,-18;
145,-41 148,-41 147,-43 145,-43;
173,-35 178,-37 178,-39 175,-41 174,-40 174,-37;
172,-41 174,-42 173,-44 170,-46 168,-46 170,-43;
-45,60 -41,62 -40,65 -33,68 -25,70 -20,70 -22,74 -25,77 -33,80 -45,82 -58,82 -68,80 -72,78 -67,76 -60,75 -55,72 -53,68 -50,64;
-78,68 -72,67 -64,66 -66,70 -74,73 -80,72;
-84,22 -80,23 -75,20 -78,21;
52,71 58,72 62,76 56,76 52,73;
12,77 18,78 22,80 15,80 11,79;
-180,-71 -160,-72 -140,-73 -120,-73 -100,-72 -75,-72 -62,-64 -58,-68 -45,-73 -20,-70 0,-69 20,-70 45,-67 70,-68 100,-66 120,-66 140,-67 160,-70 180,-72 180,-89 -180,-89
`;

const WATER_DATA = `
28,42 33,42 38,41 41,42 40,44 37,45 34,45 31,46 28,45;
48,37 53,37 54,41 52,45 49,46 47,42;
143,54 148,55 152,54 150,58 145,58
`;

function parseRings(data: string): Ring[] {
  return data
    .split(';')
    .map((ring) => ring.trim())
    .filter((ring) => ring.length > 0)
    .map((ring) =>
      ring
        .split(/\s+/)
        .map((pair) => {
          const [lon, lat] = pair.split(',');
          return [Number(lon), Number(lat)] as const;
        }),
    );
}

const LAND_RINGS: readonly Ring[] = parseRings(LAND_DATA);
const WATER_RINGS: readonly Ring[] = parseRings(WATER_DATA);

/** Ring bounding boxes, precomputed once so the hot loop rejects fast. */
const RING_BOUNDS = LAND_RINGS.map((ring) => {
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, maxLon, minLat, maxLat };
});

/** Even-odd ray casting; the half-open rule keeps vertices unambiguous. */
function ringContains(ring: Ring, lat: number, lon: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lonI, latI] = ring[i];
    const [lonJ, latJ] = ring[j];
    if (latI > lat !== latJ > lat) {
      const crossLon = lonI + ((lat - latI) * (lonJ - lonI)) / (latJ - latI);
      if (lon < crossLon) inside = !inside;
    }
  }
  return inside;
}

/**
 * Whether a geographic point is on land, per the coarse ring set. Precision is
 * ~1–2° — right for a dot shell, wrong for navigation.
 */
export function isLand(latDeg: number, lonDeg: number): boolean {
  let onLand = false;
  for (let r = 0; r < LAND_RINGS.length; r++) {
    const bounds = RING_BOUNDS[r];
    if (latDeg < bounds.minLat || latDeg > bounds.maxLat) continue;
    if (lonDeg < bounds.minLon || lonDeg > bounds.maxLon) continue;
    if (ringContains(LAND_RINGS[r], latDeg, lonDeg)) {
      onLand = true;
      break;
    }
  }
  if (!onLand) return false;
  for (const ring of WATER_RINGS) {
    if (ringContains(ring, latDeg, lonDeg)) return false;
  }
  return true;
}
