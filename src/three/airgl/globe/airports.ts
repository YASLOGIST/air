/* Airport geodetic anchors for the corridor globe.
   WGS-84 decimal degrees, terminal reference points. */

export interface AirportAnchor {
  iata: string;
  lat: number;
  lon: number;
}

export const AIRPORT_ANCHORS: Record<string, AirportAnchor> = {
  CAI: { iata: 'CAI', lat: 30.1219, lon: 31.4056 },
  FRA: { iata: 'FRA', lat: 50.0379, lon: 8.5622 },
  DXB: { iata: 'DXB', lat: 25.2532, lon: 55.3657 },
  AMS: { iata: 'AMS', lat: 52.3105, lon: 4.7683 },
  PVG: { iata: 'PVG', lat: 31.1443, lon: 121.8083 },
};

export function anchorFor(iata: string): AirportAnchor {
  return AIRPORT_ANCHORS[iata] ?? AIRPORT_ANCHORS.CAI;
}
