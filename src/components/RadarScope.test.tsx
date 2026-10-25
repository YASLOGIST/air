import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import {
  RadarScope,
  RADAR_RANGE_NM,
  TAG_SIZE,
  bearingFromField,
  plotPoint,
  polarPoint,
  tagPlacement,
} from './RadarScope';

const FLIGHTS = [
  {
    id: 'ms-552',
    flightNumber: 'MS-552',
    aircraft: 'A330-200F',
    headingDeg: 138,
    altitudeFt: 38000,
    distanceNm: 38.5,
    radarCoords: { x: 38, y: 32 },
  },
  {
    id: 'ek-927',
    flightNumber: 'EK-927',
    aircraft: 'B777-F',
    headingDeg: 285,
    altitudeFt: 35000,
    distanceNm: 52,
    radarCoords: { x: 72, y: 48 },
  },
  {
    id: 'kl-553',
    flightNumber: 'KL-553',
    aircraft: 'B747-400F',
    headingDeg: 145,
    altitudeFt: 36000,
    distanceNm: 44,
    radarCoords: { x: 28, y: 55 },
  },
];

function renderScope(props: Partial<React.ComponentProps<typeof RadarScope>> = {}) {
  const onSelectFlight = vi.fn();
  const view = render(
    <RadarScope
      flights={FLIGHTS}
      activeFlight={FLIGHTS[0]}
      distanceNm={FLIGHTS[0].distanceNm}
      active
      isArabic={false}
      onSelectFlight={onSelectFlight}
      {...props}
    />,
  );
  return { ...view, onSelectFlight };
}

describe('radar scope geometry', () => {
  /* The picture is only honest if the maths behind it is. These are the two
     functions every mark on the scope is placed with. */
  it('reads bearings clockwise from north', () => {
    expect(bearingFromField({ x: 50, y: 20 })).toBeCloseTo(0); // above centre = north
    expect(bearingFromField({ x: 80, y: 50 })).toBeCloseTo(90); // right = east
    expect(bearingFromField({ x: 50, y: 80 })).toBeCloseTo(180); // below = south
    expect(bearingFromField({ x: 20, y: 50 })).toBeCloseTo(270); // left = west
  });

  it('places a bearing/range pair on the matching side of the field', () => {
    const north = polarPoint(0, 100);
    expect(north.y).toBeLessThan(polarPoint(180, 100).y);
    const east = polarPoint(90, 100);
    expect(east.x).toBeGreaterThan(polarPoint(270, 100).x);
  });

  it('scales the range rings so the outer ring is the full scope range', () => {
    renderScope();
    // 20 / 40 / 60 NM rings, labelled inside the plot.
    for (const nm of [20, 40, 60]) {
      expect(screen.getByText(String(nm))).toBeInTheDocument();
    }
    expect(RADAR_RANGE_NM).toBe(80);
  });
});

describe('radar scope placement', () => {
  it('keeps the data block on the scope for every bearing and range', () => {
    for (let bearingStep = 0; bearingStep < 72; bearingStep += 1) {
      const bearing = bearingStep * 5;
      for (const distanceNm of [0, 5, 20, 38.5, 60, 79.9, 80, 120]) {
        const point = plotPoint(bearing, distanceNm);
        const tag = tagPlacement(point, bearing);
        expect(tag.x).toBeGreaterThanOrEqual(0);
        expect(tag.y).toBeGreaterThanOrEqual(0);
        expect(tag.x + TAG_SIZE.width).toBeLessThanOrEqual(440);
        expect(tag.y + TAG_SIZE.height).toBeLessThanOrEqual(440);
      }
    }
  });

  it('flips the block away from the range-label radial', () => {
    const nearScale = tagPlacement(plotPoint(128, 40), 128);
    const point = plotPoint(128, 40);
    // The block sits on the opposite side of the target from the labels.
    expect(nearScale.x).toBeLessThan(point.x);
  });
});

describe('radar scope readability', () => {
  it('states the range and the selected target in words, not only in pixels', () => {
    renderScope();
    expect(screen.getByText(new RegExp(`RNG ${RADAR_RANGE_NM} NM`))).toBeInTheDocument();
    expect(screen.getAllByText(/BRG \d{3}°/).length).toBeGreaterThan(0);
  });

  it('gives the plot an accessible name and a legend for every mark', () => {
    renderScope();
    expect(
      screen.getByRole('img', { name: /plan-position radar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Selected freighter/i)).toBeInTheDocument();
    expect(screen.getByText(/Weather cell/i)).toBeInTheDocument();
  });

  it('translates its own labels without flipping the layout', async () => {
    const { container } = renderScope({ isArabic: true });
    expect(screen.getByText(/مراقبة القاهرة/)).toBeInTheDocument();
    // Every scope element that carries text is explicitly left-to-right.
    expect(container.querySelector('[dir="rtl"]')).toBeNull();
  });

  it('lets the reader switch target from the scope itself', async () => {
    const user = userEvent.setup();
    const { onSelectFlight } = renderScope();
    await user.click(screen.getByRole('button', { name: 'Select EK-927' }));
    expect(onSelectFlight).toHaveBeenCalledWith('ek-927');
  });

  it('has no axe violations', async () => {
    const { container } = renderScope();
    /* Contrast is measured by the palette tests; jsdom cannot resolve the
       CSS custom properties the scope paints with. */
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
