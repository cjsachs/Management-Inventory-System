// utils/processorAgeEstimator.ts
import type { Equipment } from '../types/equipment';

export interface ProcessorAgeEstimate {
  generation: string;
  year: number;
  confidence: 'high' | 'medium' | 'guessed';
}

export interface EquipmentAgeResult {
  equipment: Equipment;
  estimate: ProcessorAgeEstimate;
  age: number;
  category: 'Current' | 'Aging' | 'Legacy';
}

export interface OverrideEntry {
  matchString: string;
  label: string;
  releaseYear: number;
}

const INTEL_GEN_YEAR: Record<number, number> = {
  1: 2010, 2: 2011, 3: 2012, 4: 2013, 5: 2015, 6: 2015,
  7: 2017, 8: 2017, 9: 2018, 10: 2019, 11: 2020, 12: 2021,
  13: 2022, 14: 2023, 15: 2024,
};

const AMD_SERIES_YEAR: Record<number, number> = {
  1: 2017, 2: 2018, 3: 2019, 4: 2020, 5: 2020,
  6: 2022, 7: 2022, 8: 2024, 9: 2024,
};

const APPLE_M_YEAR: Record<number, number> = { 1: 2020, 2: 2022, 3: 2023, 4: 2024 };

function parseProcessor(
  processorStr: string,
  overrides: OverrideEntry[] = []
): ProcessorAgeEstimate | null {
  if (!processorStr || !processorStr.trim()) return null;
  const upper = processorStr.trim().toUpperCase();

  for (const override of overrides) {
    if (upper.includes(override.matchString)) {
      return { generation: 'Manually verified', year: override.releaseYear, confidence: 'high' };
    }
  }

  const appleMatch = upper.match(/\bM(\d)\b/);
  if (appleMatch && (upper.includes('APPLE') || upper.includes('PRO') || upper.includes('MAX'))) {
    const gen = parseInt(appleMatch[1], 10);
    const year = APPLE_M_YEAR[gen] || (gen > 4 ? 2024 + (gen - 4) : 2020);
    return { generation: `M${gen}`, year, confidence: APPLE_M_YEAR[gen] ? 'high' : 'medium' };
  }

  if (upper.includes('ULTRA')) {
    return { generation: 'Core Ultra', year: 2024, confidence: 'medium' };
  }

  if (upper.includes('XEON')) {
    const xeonGenMatch = upper.match(/\b([2-9])\d{3}\b/);
    if (xeonGenMatch) {
      const gen = parseInt(xeonGenMatch[1], 10);
      return { generation: `Xeon (~Gen ${gen})`, year: INTEL_GEN_YEAR[gen] || 2015, confidence: 'medium' };
    }
    return { generation: 'Xeon (unspecified)', year: 2016, confidence: 'guessed' };
  }

  const nSeriesMatch = upper.match(/\bN(\d{3,4})\b/);
  if (nSeriesMatch && (upper.includes('CELERON') || upper.includes('PENTIUM'))) {
    const num = nSeriesMatch[1];
    let year: number;
    if (num.length === 3) year = 2023;
    else if (num.startsWith('3')) year = 2016;
    else if (num.startsWith('4')) year = 2018;
    else if (num.startsWith('5')) year = 2020;
    else if (num.startsWith('6')) year = 2021;
    else year = 2019;
    return { generation: `N${num} series`, year, confidence: 'medium' };
  }

  const intelMatch = upper.match(/I[3579][\s-]?(\d{3,5})/);
  if (intelMatch) {
    const numStr = intelMatch[1];
    let gen: number | null;
    if (numStr.length === 4 && numStr.startsWith('1')) {
      gen = parseInt(numStr.substring(0, 2), 10);
    } else {
      const remainder = numStr.slice(0, -3);
      gen = remainder ? parseInt(remainder, 10) : null;
    }
    if (gen) {
      let year = INTEL_GEN_YEAR[gen];
      let confidence: ProcessorAgeEstimate['confidence'] = 'high';
      if (!year) {
        year = gen > 14 ? 2023 + (gen - 14) : gen < 1 ? 2009 : 2015;
        confidence = 'medium';
      }
      return { generation: `${gen}th Gen`, year, confidence };
    }
  }

  if (upper.includes('CORE I') || upper.match(/\bI[3579]\b/)) {
    return { generation: '~Mid-range Gen (guessed)', year: 2018, confidence: 'guessed' };
  }

  const amdMatch = upper.match(/RYZEN\s*\d?\s*(\d)\d{3}/);
  if (amdMatch) {
    const series = parseInt(amdMatch[1], 10);
    let year = AMD_SERIES_YEAR[series];
    let confidence: ProcessorAgeEstimate['confidence'] = 'high';
    if (!year) {
      year = series > 9 ? 2024 + (series - 9) : 2017;
      confidence = 'medium';
    }
    return { generation: `${series}000 Series`, year, confidence };
  }

  if (upper.includes('AMD') || upper.includes('RYZEN')) {
    return { generation: '~Mid Series (guessed)', year: 2019, confidence: 'guessed' };
  }

  return null;
}

function getCategory(age: number): 'Current' | 'Aging' | 'Legacy' {
  if (age <= 2) return 'Current';
  if (age <= 4) return 'Aging';
  return 'Legacy';
}

/**
 * Analyzes a list of equipment and estimates each item's age based on its processor.
 * Falls back to the fleet average year for anything that can't be parsed at all.
 */
export function analyzeEquipmentAge(
  equipmentList: Equipment[],
  overrides: OverrideEntry[] = [],
  currentYear: number = new Date().getFullYear()
): EquipmentAgeResult[] {
  const parsed = equipmentList.map((item) => ({
    equipment: item,
    estimate: parseProcessor(item.processor, overrides),
  }));

  const knownYears = parsed
    .filter((p) => p.estimate !== null)
    .map((p) => p.estimate!.year);
  const fleetAvgYear =
    knownYears.length > 0
      ? Math.round(knownYears.reduce((a, b) => a + b, 0) / knownYears.length)
      : currentYear - 3;

  return parsed.map((p) => {
    const estimate: ProcessorAgeEstimate = p.estimate || {
      generation: 'Fleet avg (guessed)',
      year: fleetAvgYear,
      confidence: 'guessed',
    };
    const age = currentYear - estimate.year;
    return {
      equipment: p.equipment,
      estimate,
      age,
      category: getCategory(age),
    };
  });
}