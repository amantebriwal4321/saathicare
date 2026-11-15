/**
 * Small curated list of well known, high risk combinations common in elderly polypharmacy.
 * Not medical advice. The UI always says "ask your doctor".
 */
export interface Interaction {
  a: string
  b: string
  severity: 'high' | 'moderate'
  note: string
}

const RULES: Interaction[] = [
  { a: 'warfarin', b: 'aspirin', severity: 'high', note: 'Higher bleeding risk.' },
  { a: 'warfarin', b: 'ibuprofen', severity: 'high', note: 'Higher bleeding risk.' },
  { a: 'clopidogrel', b: 'omeprazole', severity: 'moderate', note: 'Omeprazole can make clopidogrel less effective.' },
  { a: 'metformin', b: 'alcohol', severity: 'moderate', note: 'Risk of lactic acidosis and low sugar.' },
  { a: 'lisinopril', b: 'spironolactone', severity: 'high', note: 'Potassium can climb too high.' },
  { a: 'amlodipine', b: 'simvastatin', severity: 'moderate', note: 'Keep simvastatin at or under 20 mg.' },
  { a: 'digoxin', b: 'amiodarone', severity: 'high', note: 'Digoxin levels can become toxic.' },
  { a: 'sildenafil', b: 'nitroglycerin', severity: 'high', note: 'Dangerous drop in blood pressure.' },
  { a: 'levothyroxine', b: 'calcium', severity: 'moderate', note: 'Keep a 4 hour gap, calcium blocks absorption.' },
  { a: 'aspirin', b: 'ibuprofen', severity: 'moderate', note: 'Stomach bleeding risk, ibuprofen can blunt aspirin.' },
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

/** Returns every known interaction among the given medicine names. O(n^2 * rules), n is tiny. */
export function findInteractions(names: string[]): Interaction[] {
  const list = [...new Set(names.map(norm))]
  const hits: Interaction[] = []
  for (const r of RULES) {
    const hasA = list.some((n) => n.includes(r.a))
    const hasB = list.some((n) => n.includes(r.b))
    if (hasA && hasB) hits.push(r)
  }
  return hits.sort((x, y) => (x.severity === y.severity ? 0 : x.severity === 'high' ? -1 : 1))
}
