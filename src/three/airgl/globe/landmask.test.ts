import { describe, expect, it } from 'vitest';
import { isLand } from './landmask';

/* The corridor globe's dot shell is classified by this mask, so its geometry
   is only as trustworthy as the coastline data. The probes below are real
   coordinates: corridor endpoints must be on land, the seas the corridors
   cross must be water, and the coastal cities the network serves — Cairo,
   Frankfurt, Dubai, Shanghai — must survive a user zooming in on them. */

describe('isLand', () => {
  it('classifies the corridor endpoint cities as land', () => {
    expect(isLand(30.1, 31.2)).toBe(true); // CAI — Cairo
    expect(isLand(50.0, 8.5)).toBe(true); // FRA — Frankfurt
    expect(isLand(25.25, 55.36)).toBe(true); // DXB — Dubai
    expect(isLand(52.3, 4.7)).toBe(true); // AMS — Amsterdam
    expect(isLand(31.14, 121.8)).toBe(true); // PVG — Shanghai
  });

  it('classifies open water as water', () => {
    expect(isLand(0, -20)).toBe(false); // mid-Atlantic
    expect(isLand(-30, 80)).toBe(false); // Indian Ocean
    expect(isLand(35, 18)).toBe(false); // Mediterranean, between Sicily and Libya
    expect(isLand(90, 0)).toBe(false); // the pole itself is ocean
  });

  it('carves the enclosed seas out of the Eurasian landmass', () => {
    expect(isLand(43, 34)).toBe(false); // Black Sea
    expect(isLand(41, 51)).toBe(false); // Caspian Sea
    expect(isLand(55, 148)).toBe(false); // Sea of Okhotsk
    expect(isLand(27, 51.5)).toBe(false); // Persian Gulf
    expect(isLand(62, 19)).toBe(false); // Gulf of Bothnia
  });

  it('keeps the straits that shape the network readable', () => {
    expect(isLand(21.5, 38.2)).toBe(false); // Red Sea between Africa and Arabia
    expect(isLand(64, -51)).toBe(false); // Davis Strait between Baffin and Greenland
  });

  it('recognizes the continents at their heartlands', () => {
    expect(isLand(62, 95)).toBe(true); // Siberia
    expect(isLand(-25, 135)).toBe(true); // Australia
    expect(isLand(-33, -63)).toBe(true); // Argentina
    expect(isLand(-72, 0)).toBe(true); // Antarctica
    expect(isLand(70, -45)).toBe(true); // Greenland
  });
});
