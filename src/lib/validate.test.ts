import { describe, expect, it } from 'vitest'
import { cleanText, isPhone, parseMedication, parseState } from './validate'

describe('validation', () => {
  it('cleans text', () => {
    expect(cleanText('  <b>Hi</b>\u0000 ')).toBe('bHi/b')
    expect(cleanText(42)).toBe('')
    expect(cleanText('x'.repeat(200), 10)).toHaveLength(10)
  })
  it('validates phones', () => {
    expect(isPhone('+91 98765 43210')).toBe(true)
    expect(isPhone('call me')).toBe(false)
  })
  it('rejects medications with bad times or numbers', () => {
    expect(parseMedication({ name: 'X', times: ['25:00'], stock: 1, perDose: 1 })).toBeNull()
    expect(parseMedication({ name: 'X', times: ['08:00'], stock: -1, perDose: 1 })).toBeNull()
    expect(parseMedication({ name: 'X', times: ['20:00', '08:00', '08:00'], stock: 5, perDose: 1 })?.times).toEqual(['08:00', '20:00'])
  })
  it('drops bad rows but keeps good ones', () => {
    const s = parseState({
      version: 1,
      elderName: 'Nani',
      medications: [{ id: 'a', name: 'A', times: ['08:00'], stock: 3, perDose: 1 }, { bad: true }],
      logs: [{ medId: 'a', date: 'nope', time: '08:00', status: 'taken', at: 1 }],
      vitals: [{ kind: 'sugar', value: 120, at: 1 }, { kind: 'evil', value: 1, at: 1 }],
      contacts: [{ name: 'Aman', phone: '9876543210' }],
    })
    expect(s?.medications).toHaveLength(1)
    expect(s?.logs).toHaveLength(0)
    expect(s?.vitals).toHaveLength(1)
    expect(s?.contacts).toHaveLength(1)
  })
  it('rejects unknown versions and non objects', () => {
    expect(parseState({ version: 2 })).toBeNull()
    expect(parseState(null)).toBeNull()
    expect(parseState([])).toBeNull()
  })
})
