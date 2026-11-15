import { parseState } from './validate'
import type { AppState } from './types'

export const STORAGE_KEY = 'saathicare:v1'

export function demoState(): AppState {
  return {
    version: 1,
    elderName: 'Dadi',
    medications: [
      { id: 'm1', name: 'Metformin', dosage: '500mg', times: ['08:00', '20:00'], meal: 'after_food', stock: 40, perDose: 1 },
      { id: 'm2', name: 'Amlodipine', dosage: '5mg', times: ['09:00'], meal: 'any', stock: 4, perDose: 1 },
      { id: 'm3', name: 'Aspirin', dosage: '75mg', times: ['14:00'], meal: 'after_food', stock: 25, perDose: 1 },
    ],
    logs: [],
    vitals: [],
    contacts: [{ id: 'c1', name: 'Aman', relation: 'Grandson', phone: '+91 90000 00000' }],
  }
}

export function loadState(store: Pick<Storage, 'getItem'> = localStorage): AppState {
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw || raw.length > 2_000_000) return demoState()
    return parseState(JSON.parse(raw)) ?? demoState()
  } catch {
    return demoState()
  }
}

export function saveState(state: AppState, store: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota or private mode: app keeps working in memory */
  }
}
