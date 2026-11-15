import { describe, expect, it } from 'vitest'
import { adherence, daySlots, daysOfStock, needsRefill, recordDose, toISODate } from './schedule'
import type { Medication } from './types'

const med: Medication = { id: 'a', name: 'Metformin', dosage: '500mg', times: ['08:00', '20:00'], meal: 'any', stock: 10, perDose: 1 }
const at = (h: number, m = 0) => new Date(2026, 10, 15, h, m)

describe('daySlots', () => {
  it('marks upcoming, due and missed by time of day', () => {
    expect(daySlots([med], [], at(7, 0)).map((s) => s.state)).toEqual(['upcoming', 'upcoming'])
    expect(daySlots([med], [], at(8, 30))[0].state).toBe('due')
    expect(daySlots([med], [], at(10, 0))[0].state).toBe('missed')
  })
  it('uses logs when present', () => {
    const { logs } = recordDose([med], [], 'a', '08:00', 'taken', at(8, 5))
    expect(daySlots([med], logs, at(12))[0].state).toBe('taken')
  })
})

describe('recordDose', () => {
  it('decrements stock only on taken and ignores duplicates', () => {
    const r1 = recordDose([med], [], 'a', '08:00', 'taken', at(8))
    expect(r1.medications[0].stock).toBe(9)
    const r2 = recordDose(r1.medications, r1.logs, 'a', '08:00', 'taken', at(8, 10))
    expect(r2.logs).toHaveLength(1)
    expect(r2.medications[0].stock).toBe(9)
    const r3 = recordDose([med], [], 'a', '20:00', 'skipped', at(20))
    expect(r3.medications[0].stock).toBe(10)
  })
})

describe('adherence', () => {
  it('counts only past due slots for today', () => {
    const { logs } = recordDose([med], [], 'a', '08:00', 'taken', at(8))
    expect(adherence([med], logs, at(12), 1)).toEqual({ taken: 1, expected: 1, pct: 100 })
  })
  it('includes previous days', () => {
    const y = new Date(2026, 10, 14, 8)
    const logs = [{ medId: 'a', date: toISODate(y), time: '08:00', status: 'taken' as const, at: y.getTime() }]
    expect(adherence([med], logs, at(7), 2).pct).toBe(50)
  })
  it('is 100 with nothing scheduled', () => {
    expect(adherence([], [], at(12)).pct).toBe(100)
  })
})

describe('stock', () => {
  it('computes days left and refill need', () => {
    expect(daysOfStock(med)).toBe(5)
    expect(needsRefill(med)).toBe(true)
    expect(needsRefill({ ...med, stock: 100 })).toBe(false)
  })
})
