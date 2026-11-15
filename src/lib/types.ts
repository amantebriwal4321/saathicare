export type MealRelation = 'before_food' | 'after_food' | 'with_food' | 'any'

export interface Medication {
  id: string
  name: string
  dosage: string
  /** 24h "HH:MM" times, sorted ascending */
  times: string[]
  meal: MealRelation
  /** pills left in hand */
  stock: number
  /** pills consumed per dose */
  perDose: number
  notes?: string
}

export type DoseStatus = 'taken' | 'skipped'

export interface DoseLog {
  medId: string
  /** ISO date YYYY-MM-DD */
  date: string
  time: string
  status: DoseStatus
  /** epoch ms when the action was recorded */
  at: number
}

export type VitalKind = 'bp' | 'sugar' | 'pulse' | 'spo2'

export interface VitalReading {
  id: string
  kind: VitalKind
  /** bp uses value=systolic, value2=diastolic */
  value: number
  value2?: number
  at: number
}

export interface Contact {
  id: string
  name: string
  relation: string
  phone: string
}

export interface AppState {
  version: 1
  elderName: string
  medications: Medication[]
  logs: DoseLog[]
  vitals: VitalReading[]
  contacts: Contact[]
}
