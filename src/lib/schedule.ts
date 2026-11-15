import type { DoseLog, Medication } from './types'

export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export type SlotState = 'taken' | 'skipped' | 'due' | 'missed' | 'upcoming'

export interface DoseSlot {
  med: Medication
  time: string
  state: SlotState
}

/** Grace window after the scheduled time before a dose counts as missed. */
export const GRACE_MIN = 60

const logKey = (medId: string, date: string, time: string) => `${medId}|${date}|${time}`

export function indexLogs(logs: DoseLog[]): Map<string, DoseLog> {
  const m = new Map<string, DoseLog>()
  for (const l of logs) m.set(logKey(l.medId, l.date, l.time), l)
  return m
}

/** All dose slots for a day, sorted by time. O(meds * times). */
export function daySlots(meds: Medication[], logs: DoseLog[], now: Date): DoseSlot[] {
  const date = toISODate(now)
  const idx = indexLogs(logs)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const slots: DoseSlot[] = []
  for (const med of meds) {
    for (const time of med.times) {
      const log = idx.get(logKey(med.id, date, time))
      const t = minutesOf(time)
      let state: SlotState
      if (log) state = log.status
      else if (nowMin < t - 30) state = 'upcoming'
      else if (nowMin <= t + GRACE_MIN) state = 'due'
      else state = 'missed'
      slots.push({ med, time, state })
    }
  }
  return slots.sort((a, b) => minutesOf(a.time) - minutesOf(b.time) || a.med.name.localeCompare(b.med.name))
}

/** Adherence over the last `days` full days including today (only past-due slots count). */
export function adherence(meds: Medication[], logs: DoseLog[], now: Date, days = 7): { taken: number; expected: number; pct: number } {
  const idx = indexLogs(logs)
  let taken = 0
  let expected = 0
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = toISODate(d)
    const cutoff = i === 0 ? now.getHours() * 60 + now.getMinutes() - GRACE_MIN : Infinity
    for (const med of meds) {
      for (const time of med.times) {
        const logged = idx.get(logKey(med.id, date, time))
        if (minutesOf(time) > cutoff && !logged) continue
        expected++
        if (logged?.status === 'taken') taken++
      }
    }
  }
  return { taken, expected, pct: expected === 0 ? 100 : Math.round((taken / expected) * 100) }
}

/** Days of stock left at the current schedule. */
export function daysOfStock(med: Medication): number {
  const perDay = med.times.length * med.perDose
  return perDay === 0 ? Infinity : Math.floor(med.stock / perDay)
}

export const needsRefill = (med: Medication, thresholdDays = 5) => daysOfStock(med) <= thresholdDays

export function recordDose(
  meds: Medication[],
  logs: DoseLog[],
  medId: string,
  time: string,
  status: 'taken' | 'skipped',
  now: Date,
): { medications: Medication[]; logs: DoseLog[] } {
  const date = toISODate(now)
  const exists = logs.some((l) => l.medId === medId && l.date === date && l.time === time)
  if (exists) return { medications: meds, logs }
  const medications = status === 'taken'
    ? meds.map((m) => (m.id === medId ? { ...m, stock: Math.max(0, m.stock - m.perDose) } : m))
    : meds
  return { medications, logs: [...logs, { medId, date, time, status, at: now.getTime() }] }
}
