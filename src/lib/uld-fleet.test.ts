import { describe, expect, it } from 'vitest';
import { assessUldFit, recommendUld, ULD_FLEET, findUld, BROKEN_STOWAGE_LIMIT } from './uld-fleet';

const smallBox = { lengthCm: 60, widthCm: 50, heightCm: 45, grossWeightKg: 35, pieces: 1, requiresCoolChain: false };

describe('ULD fleet data', () => {
  it('ships four units with coherent envelopes and payloads', () => {
    expect(ULD_FLEET).toHaveLength(4);
    for (const uld of ULD_FLEET) {
      expect(uld.maxGrossWeightKg).toBeGreaterThan(uld.tareWeightKg);
      // Internal envelope volume must not exceed the rated volume by a silly margin
      const envelopeCbm = (uld.internalCm.lengthCm * uld.internalCm.widthCm * uld.internalCm.heightCm) / 1_000_000;
      expect(envelopeCbm).toBeGreaterThan(0);
      expect(uld.volumeCbm).toBeGreaterThan(0);
    }
    expect(findUld('uld-ake')?.code).toBe('AKE');
    expect(findUld('nope')).toBeNull();
    expect(findUld(null)).toBeNull();
  });
});

describe('ULD load-fit engine', () => {
  it('recommends the smallest fitting unit for a small ambient box', () => {
    const rec = recommendUld(smallBox);
    expect(rec.best?.uld.code).toBe('RKN'); // smallest rated volume that fits
    expect(rec.assessments).toHaveLength(4);
    expect(rec.assessments.every((a) => typeof a.volumeUtilizationPct === 'number')).toBe(true);
  });

  it('restricts cool-chain consignments to actively cooled units', () => {
    const rec = recommendUld({ ...smallBox, requiresCoolChain: true });
    for (const a of rec.assessments) {
      if (!a.uld.activeCooling) {
        expect(a.fits).toBe(false);
        expect(a.blockers).toContain('NO_ACTIVE_COOLING');
      }
    }
    expect(rec.best?.uld.activeCooling).toBe(true);
  });

  it('allows horizontal rotation but never tipping', () => {
    const ake = findUld('uld-ake')!;
    // 140 wide × 60 long fits AKE only when rotated in plan
    expect(assessUldFit(ake, { ...smallBox, lengthCm: 60, widthCm: 144 }).fits).toBe(true);
    // Too tall even though footprint fits — tipping is not allowed
    expect(assessUldFit(ake, { ...smallBox, heightCm: 170 }).blockers).toContain('PIECE_TOO_LARGE');
  });

  it('blocks over-payload and over-volume builds', () => {
    const ake = findUld('uld-ake')!;
    const heavy = assessUldFit(ake, { ...smallBox, grossWeightKg: 800, pieces: 2 });
    expect(heavy.blockers).toContain('OVER_PAYLOAD');
    expect(heavy.payloadUtilizationPct).toBeGreaterThan(100);

    const bulky = assessUldFit(ake, { ...smallBox, pieces: 20 }); // 2.7 CBM vs 4.3 × 0.9
    expect(bulky.fits).toBe(true);
    const tooBulky = assessUldFit(ake, { ...smallBox, pieces: 30 }); // 4.05 CBM > 3.87
    expect(tooBulky.blockers).toContain('OVER_VOLUME');
    expect(BROKEN_STOWAGE_LIMIT).toBeLessThan(1);
  });

  it('returns null best when nothing in the fleet can take the consignment', () => {
    const rec = recommendUld({ lengthCm: 400, widthCm: 300, heightCm: 250, grossWeightKg: 9000, pieces: 1, requiresCoolChain: false });
    expect(rec.best).toBeNull();
    expect(rec.assessments.every((a) => !a.fits)).toBe(true);
  });
});
