import { describe, expect, it } from 'vitest'
import { findInteractions } from './interactions'
import { classifyVital } from './vitals'
import { buildAlerts, dailySummary } from './alerts'
import { demoState, loadState, saveState, STORAGE_KEY } from './storage'

describe('interactions', () => {
  it('finds known pairs regardless of case/extra words', () => {
    const hits = findInteractions(['Warfarin 5mg', 'ASPIRIN', 'Ibuprofen'])
    expect(hits.map((h) => `${h.a}+${h.b}`)).toEqual(['warfarin+aspirin', 'warfarin+ibuprofen', 'aspirin+ibuprofen'])
  })
  it('returns nothing for safe lists', () => {
    expect(findInteractions(['Metformin', 'Amlodipine'])).toEqual([])
  })
})

describe('vitals', () => {
  it('classifies BP, sugar, pulse, SpO2', () => {
    expect(classifyVital({ kind: 'bp', value: 120, value2: 80 })).toBe('normal')
    expect(classifyVital({ kind: 'bp', value: 150, value2: 85 })).toBe('watch')
    expect(classifyVital({ kind: 'bp', value: 185, value2: 100 })).toBe('critical')
    expect(classifyVital({ kind: 'sugar', value: 60 })).toBe('critical')
    expect(classifyVital({ kind: 'pulse', value: 72 })).toBe('normal')
    expect(classifyVital({ kind: 'spo2', value: 92 })).toBe('watch')
  })
})

describe('alerts', () => {
  it('surfaces missed doses, low stock and vitals, critical first', () => {
    const s = demoState()
    const now = new Date(2026, 10, 15, 16, 0)
    s.vitals.push({ id: 'v', kind: 'sugar', value: 50, at: now.getTime() - 1000 })
    const alerts = buildAlerts(s, now)
    expect(alerts[0].level).toBe('critical')
    expect(alerts.some((a) => a.title === 'Missed Metformin')).toBe(true)
    expect(alerts.some((a) => a.title === 'Refill Amlodipine')).toBe(true)
    expect(dailySummary(s, now)).toContain('Dadi today: 0/4 doses taken.')
  })
})

describe('storage', () => {
  it('round trips and falls back on corrupt data', () => {
    const mem = new Map<string, string>()
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
    const s = demoState()
    s.elderName = 'Nana'
    saveState(s, store)
    expect(loadState(store).elderName).toBe('Nana')
    mem.set(STORAGE_KEY, '{not json')
    expect(loadState(store).elderName).toBe('Dadi')
  })
})
