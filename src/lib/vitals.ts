import type { VitalReading } from './types'

export type VitalFlag = 'normal' | 'watch' | 'critical'

/** Simple thresholds for older adults. Conservative, meant to nudge a call to the doctor. */
export function classifyVital(r: Pick<VitalReading, 'kind' | 'value' | 'value2'>): VitalFlag {
  switch (r.kind) {
    case 'bp': {
      const sys = r.value
      const dia = r.value2 ?? 0
      if (sys >= 180 || dia >= 120 || sys < 90) return 'critical'
      if (sys >= 140 || dia >= 90) return 'watch'
      return 'normal'
    }
    case 'sugar':
      if (r.value < 70 || r.value > 300) return 'critical'
      if (r.value > 180) return 'watch'
      return 'normal'
    case 'pulse':
      if (r.value < 45 || r.value > 130) return 'critical'
      if (r.value < 55 || r.value > 100) return 'watch'
      return 'normal'
    case 'spo2':
      if (r.value < 90) return 'critical'
      if (r.value < 94) return 'watch'
      return 'normal'
  }
}

export const VITAL_LABEL: Record<VitalReading['kind'], string> = {
  bp: 'Blood pressure',
  sugar: 'Blood sugar',
  pulse: 'Pulse',
  spo2: 'SpO2',
}

export const formatVital = (r: VitalReading): string => {
  switch (r.kind) {
    case 'bp':
      return `${r.value}/${r.value2 ?? '?'} mmHg`
    case 'sugar':
      return `${r.value} mg/dL`
    case 'pulse':
      return `${r.value} bpm`
    case 'spo2':
      return `${r.value}%`
  }
}
