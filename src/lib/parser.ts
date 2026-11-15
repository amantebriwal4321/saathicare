import type { MealRelation, Medication } from './types'
import { cleanText } from './validate'

/**
 * Turns a plain sentence (typed or spoken, the way a doctor or family member would say it)
 * into a medication draft. Example: "Metformin 500mg twice a day after food, 60 tablets".
 * Rule based on purpose: works offline, deterministic, no health data leaves the device.
 */
export interface ParseResult {
  draft: Omit<Medication, 'id'> | null
  confidence: number
  hints: string[]
}

const SLOT_TIMES: Record<string, string> = {
  morning: '08:00',
  breakfast: '08:00',
  afternoon: '13:00',
  lunch: '13:00',
  evening: '18:00',
  night: '21:00',
  dinner: '20:00',
  bedtime: '22:00',
}

const FREQ: Array<[RegExp, string[]]> = [
  [/\b(four times|4 times|qid)\b/, ['08:00', '12:00', '16:00', '20:00']],
  [/\b(thrice|three times|3 times|tds|tid)\b/, ['08:00', '14:00', '20:00']],
  [/\b(twice|two times|2 times|bd|bid)\b/, ['08:00', '20:00']],
  [/\b(once|one time|1 time|daily|od)\b/, ['08:00']],
]

const DOSAGE_RE = /(\d+(?:\.\d+)?)\s?(mg|mcg|g|ml|iu|units?)\b/i
const STOCK_RE = /(\d{1,4})\s?(tablets?|tabs?|pills?|capsules?|caps?|strips?)\b/i
const PER_DOSE_RE = /\b(half|one|two|1|2|0\.5)\s(tablet|tab|pill|capsule)s?\b(?!\s*(left|in stock))/i
const CLOCK_RE = /\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/gi

function meal(text: string): MealRelation {
  if (/\bbefore\s(food|meals?|breakfast|lunch|dinner|eating)\b|empty stomach/.test(text)) return 'before_food'
  if (/\bafter\s(food|meals?|breakfast|lunch|dinner|eating)\b/.test(text)) return 'after_food'
  if (/\b(with)\s(food|meal|milk)\b/.test(text)) return 'with_food'
  return 'any'
}

function clockTimes(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(CLOCK_RE)) {
    let h = Number(m[1]) % 12
    if (m[3].toLowerCase() === 'pm') h += 12
    const min = Number(m[2] ?? 0)
    if (Number(m[1]) <= 12 && min < 60) out.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return out
}

export function parseMedicationText(input: string): ParseResult {
  const raw = cleanText(input, 200)
  const text = raw.toLowerCase()
  const hints: string[] = []
  if (!text) return { draft: null, confidence: 0, hints: ['Say or type the medicine name first.'] }

  const nameMatch = raw.match(/^[A-Za-z][A-Za-z\- ]{1,40}?(?=\s+\d|\s+(once|twice|thrice|daily|every|in the|at|before|after|with)\b|,|$)/i)
  const name = nameMatch ? nameMatch[0].trim().replace(/\b\w/g, (c) => c.toUpperCase()) : ''
  if (!name) hints.push('Could not find a medicine name.')

  let times = clockTimes(text)
  if (times.length === 0) {
    const slots = Object.keys(SLOT_TIMES).filter((k) => new RegExp(`\\b${k}\\b`).test(text))
    times = slots.map((s) => SLOT_TIMES[s])
  }
  if (times.length === 0) {
    const f = FREQ.find(([re]) => re.test(text))
    if (f) times = f[1]
  }
  if (times.length === 0) {
    times = ['08:00']
    hints.push('No timing found, defaulted to 8 AM. Edit if needed.')
  }

  const dosage = text.match(DOSAGE_RE)?.[0].replace(/\s/g, '') ?? ''
  const stockMatch = text.match(STOCK_RE)
  const stock = stockMatch && /strip/.test(stockMatch[2]) ? Number(stockMatch[1]) * 10 : stockMatch ? Number(stockMatch[1]) : 30
  if (!stockMatch) hints.push('Stock not mentioned, assumed 30.')
  const pd = text.match(PER_DOSE_RE)?.[1]
  const perDose = pd === 'half' || pd === '0.5' ? 0.5 : pd === 'two' || pd === '2' ? 2 : 1

  const draft = name
    ? { name, dosage, times: [...new Set(times)].sort(), meal: meal(text), stock, perDose }
    : null
  const confidence = draft ? Math.max(0.2, 1 - hints.length * 0.25) : 0
  return { draft, confidence, hints }
}
