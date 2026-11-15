import type { AppState, Contact, DoseLog, Medication, VitalReading } from './types'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const PHONE_RE = /^\+?[0-9 ]{7,15}$/
const MEALS = new Set(['before_food', 'after_food', 'with_food', 'any'])
const VITALS = new Set(['bp', 'sugar', 'pulse', 'spo2'])

/** Trim, strip control chars and angle brackets, cap length. Defense in depth on top of React escaping. */
export function cleanText(input: unknown, max = 80): string {
  if (typeof input !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max)
}

export const isTime = (t: unknown): t is string => typeof t === 'string' && TIME_RE.test(t)
export const isPhone = (p: unknown): p is string => typeof p === 'string' && PHONE_RE.test(p.trim())

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max

export function parseMedication(v: unknown): Medication | null {
  if (!isObj(v)) return null
  const name = cleanText(v.name, 60)
  const times = Array.isArray(v.times) ? v.times.filter(isTime) : []
  if (!name || times.length === 0 || times.length > 8) return null
  if (!isNum(v.stock, 0, 10000) || !isNum(v.perDose, 0.25, 20)) return null
  return {
    id: cleanText(v.id, 40) || crypto.randomUUID(),
    name,
    dosage: cleanText(v.dosage, 30),
    times: [...new Set(times)].sort(),
    meal: typeof v.meal === 'string' && MEALS.has(v.meal) ? (v.meal as Medication['meal']) : 'any',
    stock: v.stock,
    perDose: v.perDose,
    notes: cleanText(v.notes, 200) || undefined,
  }
}

function parseLog(v: unknown): DoseLog | null {
  if (!isObj(v)) return null
  if (typeof v.medId !== 'string' || typeof v.date !== 'string' || !DATE_RE.test(v.date)) return null
  if (!isTime(v.time) || (v.status !== 'taken' && v.status !== 'skipped') || !isNum(v.at, 0, 1e14)) return null
  return { medId: v.medId, date: v.date, time: v.time, status: v.status, at: v.at }
}

function parseVital(v: unknown): VitalReading | null {
  if (!isObj(v) || typeof v.kind !== 'string' || !VITALS.has(v.kind)) return null
  if (!isNum(v.value, 0, 1000) || !isNum(v.at, 0, 1e14)) return null
  if (v.value2 !== undefined && !isNum(v.value2, 0, 1000)) return null
  return {
    id: cleanText(v.id, 40) || crypto.randomUUID(),
    kind: v.kind as VitalReading['kind'],
    value: v.value,
    value2: v.value2 as number | undefined,
    at: v.at,
  }
}

function parseContact(v: unknown): Contact | null {
  if (!isObj(v) || !isPhone(v.phone)) return null
  const name = cleanText(v.name, 40)
  if (!name) return null
  return { id: cleanText(v.id, 40) || crypto.randomUUID(), name, relation: cleanText(v.relation, 30), phone: (v.phone as string).trim() }
}

const keep = <T,>(arr: unknown, fn: (x: unknown) => T | null, cap: number): T[] =>
  Array.isArray(arr) ? arr.slice(-cap).map(fn).filter((x): x is T => x !== null) : []

/** Validates untrusted JSON (localStorage / import). Drops bad rows instead of crashing. */
export function parseState(raw: unknown): AppState | null {
  if (!isObj(raw) || raw.version !== 1) return null
  return {
    version: 1,
    elderName: cleanText(raw.elderName, 40) || 'Dadi',
    medications: keep(raw.medications, parseMedication, 50),
    logs: keep(raw.logs, parseLog, 5000),
    vitals: keep(raw.vitals, parseVital, 2000),
    contacts: keep(raw.contacts, parseContact, 10),
  }
}
