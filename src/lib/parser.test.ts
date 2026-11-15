import { describe, expect, it } from 'vitest'
import { parseMedicationText } from './parser'

describe('parseMedicationText', () => {
  it('parses a typical doctor instruction', () => {
    const r = parseMedicationText('Metformin 500mg twice a day after food, 60 tablets')
    expect(r.draft).toMatchObject({ name: 'Metformin', dosage: '500mg', times: ['08:00', '20:00'], meal: 'after_food', stock: 60, perDose: 1 })
    expect(r.confidence).toBe(1)
  })
  it('understands clock times and empty stomach', () => {
    const r = parseMedicationText('Thyronorm 50mcg at 6:30 am on empty stomach')
    expect(r.draft?.times).toEqual(['06:30'])
    expect(r.draft?.meal).toBe('before_food')
  })
  it('maps named slots and strips', () => {
    const r = parseMedicationText('Atorvastatin 10mg at night, 2 strips')
    expect(r.draft?.times).toEqual(['21:00'])
    expect(r.draft?.stock).toBe(20)
  })
  it('handles half tablets and thrice daily', () => {
    const r = parseMedicationText('Paracetamol half tablet thrice a day')
    expect(r.draft?.perDose).toBe(0.5)
    expect(r.draft?.times).toHaveLength(3)
  })
  it('defaults with hints when info is missing', () => {
    const r = parseMedicationText('Vitamin D')
    expect(r.draft?.times).toEqual(['08:00'])
    expect(r.hints.length).toBe(2)
    expect(r.confidence).toBeLessThan(1)
  })
  it('rejects empty and markup input safely', () => {
    expect(parseMedicationText('   ').draft).toBeNull()
    const r = parseMedicationText('<script>alert(1)</script>')
    expect(JSON.stringify(r)).not.toContain('<')
  })
})
