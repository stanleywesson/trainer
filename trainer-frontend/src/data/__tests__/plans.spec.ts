import { describe, expect, it } from 'vitest'
import { capsSets, getExercise, getWorkout, isCardio, planExercises, workoutLocation, workouts, type WorkoutLocation } from '@/data'
import {
  generatePlan, planWeekOf, setCapOn, weekLayout, type CalendarEntry, type DayKind, type PlanId,
} from '@/data/plans'

/** A Monday, so plan week 0 is a full week */
const START = '2026-11-23'

/** Mon = 0 … Sun = 6 */
const dayOf = (date: string) => (new Date(date + 'T00:00:00').getDay() + 6) % 7

/** Entries of one plan week, grouped per weekday */
function week(entries: CalendarEntry[], n: number): CalendarEntry[][] {
  const days: CalendarEntry[][] = [[], [], [], [], [], [], []]
  for (const e of entries) if (planWeekOf(START, e.date) === n) days[dayOf(e.date)]!.push(e)
  return days
}

/** Workout names per weekday, e.g. ['Chest A', 'run', …] */
function names(entries: CalendarEntry[], n: number): string[] {
  return week(entries, n).map(day => day.map(e =>
    e.type === 'workout' ? getWorkout(e.workoutId)!.name : e.type === 'jog' ? 'run' : 'rest').join(' + '))
}

const plan = (id: PlanId, location: WorkoutLocation, weeks: number, includeRuns = true) =>
  generatePlan(id, location, START, 0, weeks, 0, includeRuns)

const isCardioId = (id?: string) => isCardio(getWorkout(id))

describe('generatePlan: layouts', () => {
  it('custom plans start empty', () => {
    expect(generatePlan('custom', 'gym', START, 0, 12)).toEqual([])
  })

  it.each(['rebuild', 'build'] as const)('%s with runs: strength Mon/Wed/Fri, runs Tue/Thu, rest Sat, long run Sun', id => {
    const entries = plan(id, 'gym', 16)
    for (let n = 0; n < 16; n++) {
      const days = week(entries, n)
      for (const d of [0, 2, 4]) expect(days[d]!.every(e => e.type === 'workout')).toBe(true)
      for (const d of [1, 3, 6]) expect(days[d]!.map(e => e.type)).toEqual(['jog'])
      expect(days[5]!.map(e => e.type)).toEqual(['rest'])
    }
  })

  it.each([
    ['rebuild', 'gym'], ['rebuild', 'home'], ['build', 'gym'], ['build', 'home'],
  ] as const)('%s %s without runs never schedules a run', (id, location) => {
    expect(plan(id, location, 24, false).filter(e => e.type === 'jog')).toEqual([])
  })

  it('build without runs: five strength days, Saturday cardio, Sunday rest', () => {
    for (const location of ['gym', 'home'] as const) {
      const entries = plan('build', location, 12, false)
      for (let n = 0; n < 12; n++) {
        const days = week(entries, n)
        for (const d of [0, 1, 2, 3, 4]) {
          expect(days[d]!.length).toBeGreaterThan(0)
          expect(days[d]!.every(e => e.type === 'workout' && !isCardioId(e.workoutId))).toBe(true)
        }
        expect(days[5]!.map(e => isCardioId(e.workoutId))).toEqual([true])
        expect(days[6]!.map(e => e.type)).toEqual(['rest'])
      }
    }
  })

  it('rebuild without runs: four strength days with Wednesday and Sunday off, then the five-day week', () => {
    const entries = plan('rebuild', 'gym', 6, false)
    for (let n = 0; n < 4; n++) {
      const days = week(entries, n)
      for (const d of [0, 1, 3, 4]) expect(days[d]!.every(e => e.type === 'workout' && !isCardioId(e.workoutId))).toBe(true)
      expect(days[2]!.map(e => e.type)).toEqual(['rest'])
      expect(days[6]!.map(e => e.type)).toEqual(['rest'])
      expect(days[5]!.map(e => isCardioId(e.workoutId))).toEqual([true])
    }
    expect(week(entries, 4)[2]!.map(e => e.type)).toEqual(['workout'])
  })

  it('weekLayout matches what the generator schedules', () => {
    const kind = (day: CalendarEntry[], d: number): DayKind => {
      const e = day[0]!
      if (e.type === 'rest') return 'Rest'
      if (e.type === 'jog') return d === 6 ? 'Long run' : 'Run'
      return isCardioId(e.workoutId) ? 'Cardio' : 'Strength'
    }
    for (const id of ['rebuild', 'build'] as const) for (const runs of [true, false]) {
      const days = week(plan(id, 'gym', 1, runs), 0)
      expect(days.map(kind)).toEqual(weekLayout(id, runs))
    }
  })
})

describe('generatePlan: dates', () => {
  it('skips days before the start date', () => {
    const wednesday = '2026-11-25'
    const entries = generatePlan('build', 'gym', wednesday, 0, 2)
    expect(entries.every(e => e.date >= wednesday)).toBe(true)
    expect(entries.some(e => e.date === wednesday)).toBe(true)
  })

  it('weekOffset pushes the same plan weeks later on the calendar', () => {
    const normal = generatePlan('build', 'gym', START, 2, 3)
    const shifted = generatePlan('build', 'gym', START, 2, 3, 1)
    expect(shifted.map(e => e.workoutId ?? e.type)).toEqual(normal.map(e => e.workoutId ?? e.type))
    expect(planWeekOf(START, shifted[0]!.date)).toBe(planWeekOf(START, normal[0]!.date) + 1)
  })

  it('generating in blocks gives the same plan as generating at once', () => {
    const strip = (es: CalendarEntry[]) => es.map(({ id: _id, ...rest }) => rest)
    for (const runs of [true, false]) {
      const whole = generatePlan('rebuild', 'gym', START, 0, 24, 0, runs)
      const blocks = [...generatePlan('rebuild', 'gym', START, 0, 12, 0, runs), ...generatePlan('rebuild', 'gym', START, 12, 24, 0, runs)]
      expect(strip(blocks)).toEqual(strip(whole))
    }
  })
})

describe('generatePlan: phases', () => {
  it('rebuild with runs: 8 Rebuild weeks, then 4 Base weeks, then the A/B rotation', () => {
    const entries = plan('rebuild', 'gym', 13)
    expect(names(entries, 0)[0]).toBe('Gym Starter A')
    expect(names(entries, 7)[0]).toBe('Gym Upper')
    expect(names(entries, 8)[0]).toBe('Chest Base')
    expect(names(entries, 11)[0]).toMatch(/^Chest Base/)
    expect(names(entries, 12)[0]).toBe('Chest A')
  })

  it('rebuild without runs: 4 Rebuild weeks, then 4 Base weeks, then the A/B rotation', () => {
    const entries = plan('rebuild', 'gym', 9, false)
    expect(names(entries, 0)[0]).toBe('Gym Starter A')
    expect(names(entries, 2)[0]).toBe('Gym Upper')
    expect(names(entries, 4).slice(0, 5)).toEqual(['Chest Base', 'Back Base', 'Legs Base', 'Shoulders B', 'Arms B'])
    expect(names(entries, 8).slice(0, 5)).toEqual(['Chest A', 'Back A', 'Legs A', 'Shoulders A', 'Arms A'])
  })

  it('build alternates A and B weeks, and an easy week repeats the week before it', () => {
    const entries = plan('build', 'gym', 8)
    const chest = Array.from({ length: 8 }, (_, n) => names(entries, n)[0]!.replace(' + Arm Pump', ''))
    expect(chest).toEqual(['Chest A', 'Chest B', 'Chest A', 'Chest A', 'Chest B', 'Chest A', 'Chest B', 'Chest B'])
  })

  it('build without runs follows the same A/B rotation for every day', () => {
    const entries = plan('build', 'gym', 8, false)
    for (let n = 0; n < 8; n++) {
      const strength = names(entries, n).slice(0, 5)
      const letter = strength[0]!.slice(-1)
      expect(strength.every(s => s.endsWith(letter))).toBe(true)
    }
  })
})

describe('generatePlan: extras', () => {
  const armPumpWeeks = (entries: CalendarEntry[]) =>
    [...new Set(entries.filter(e => e.workoutId === 'gym20').map(e => planWeekOf(START, e.date)))]

  it('Arm Pump only comes in easy weeks, on chest and back day of the gym plan with runs', () => {
    const entries = plan('build', 'gym', 12)
    expect(armPumpWeeks(entries)).toEqual([3, 7, 11])
    for (const e of entries.filter(x => x.workoutId === 'gym20')) expect([0, 4]).toContain(dayOf(e.date))
    expect(armPumpWeeks(plan('rebuild', 'gym', 16))).toEqual([11, 15])
  })

  it('Arm Pump is never added at home or without runs (that plan has its own arms day)', () => {
    expect(armPumpWeeks(plan('build', 'home', 12))).toEqual([])
    expect(armPumpWeeks(plan('build', 'gym', 12, false))).toEqual([])
  })

  it('without runs, hard cardio only in Build B weeks: never in Rebuild, Base or easy weeks', () => {
    const hard = (entries: CalendarEntry[]) => [...new Set(entries
      .filter(e => e.workoutId === 'gym19' || e.workoutId === 'w9').map(e => planWeekOf(START, e.date)))]
    // build: B weeks are 1, 4, 6; 7 is an easy week
    expect(hard(plan('build', 'gym', 8, false))).toEqual([1, 4, 6])
    // rebuild: weeks 0–3 Rebuild, 4–7 Base, then Build
    expect(hard(plan('rebuild', 'gym', 12, false)).every(n => n >= 8)).toBe(true)
    expect(hard(plan('rebuild', 'home', 12, false)).every(n => n >= 8)).toBe(true)
  })
})

describe('generatePlan: runs', () => {
  const runs = (entries: CalendarEntry[], n: number) => week(entries, n).flat().filter(e => e.type === 'jog').map(e => e.jog!)

  it('rebuild: the longest unbroken running block never shrinks, and runs reach 20 min continuous by week 8', () => {
    const entries = plan('rebuild', 'gym', 8)
    let longest = 0
    for (let n = 0; n < 8; n++) {
      const block = runs(entries, n)[0]!.runSeconds
      expect(block).toBeGreaterThanOrEqual(longest)
      longest = block
    }
    expect(runs(entries, 6)[0]).toEqual({ runSeconds: 600, walkSeconds: 60, repeats: 2 })
    expect(runs(entries, 7)[0]).toEqual({ runSeconds: 1200, walkSeconds: 0, repeats: 1 })
  })

  it('build: the long run grows but never past an hour, and easy weeks cut every run back', () => {
    const entries = plan('build', 'gym', 40)
    const longRun = (n: number) => runs(entries, n)[2]!.runSeconds / 60
    for (let n = 0; n < 40; n++) expect(longRun(n)).toBeLessThanOrEqual(60)
    // week 39 is itself an easy week
    expect(longRun(38)).toBe(60)
    expect(runs(entries, 3)[0]!.runSeconds).toBeLessThan(runs(entries, 2)[0]!.runSeconds)
    expect(longRun(3)).toBeLessThan(longRun(2))
  })
})

describe('setCapOn: easy weeks', () => {
  const easyWeeks = (id: PlanId, runs: boolean, weeks = 16, skipped: number[] = []) =>
    Array.from({ length: weeks }, (_, n) => n).filter(n => {
      const monday = new Date(START + 'T00:00:00')
      monday.setDate(monday.getDate() + n * 7)
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
      return setCapOn(id, START, key, skipped, runs) !== undefined
    })

  it('every 4th Build week is an easy week', () => {
    expect(easyWeeks('build', true)).toEqual([3, 7, 11, 15])
    expect(easyWeeks('build', false)).toEqual([3, 7, 11, 15])
  })

  it('in Rebuild, easy weeks start counting after the Rebuild weeks (8 with runs, 4 without)', () => {
    expect(easyWeeks('rebuild', true)).toEqual([11, 15])
    expect(easyWeeks('rebuild', false)).toEqual([7, 11, 15])
  })

  it('custom plans have no easy weeks', () => {
    expect(easyWeeks('custom', true)).toEqual([])
  })

  it('weeks skipped by "Catch me up" push the easy weeks back', () => {
    expect(easyWeeks('build', true, 16, [1])).toEqual([4, 8, 12])
  })
})

describe('workout data', () => {
  it('every workout uses known exercises', () => {
    for (const w of workouts) for (const e of w.exercises) expect(() => getExercise(e.exerciseId)).not.toThrow()
  })

  it('workout ids are unique', () => {
    expect(new Set(workouts.map(w => w.id)).size).toBe(workouts.length)
  })

  it.each([
    ['rebuild', 'gym'], ['rebuild', 'home'], ['build', 'gym'], ['build', 'home'],
  ] as const)('%s %s only schedules existing workouts for that location', (id, location) => {
    for (const runs of [true, false]) {
      for (const e of plan(id, location, 24, runs).filter(x => x.type === 'workout')) {
        const w = getWorkout(e.workoutId)
        expect(w, e.workoutId).toBeDefined()
        expect(workoutLocation(w!)).toBe(location)
      }
    }
  })

  it('easy-week caps cut strength sets but leave cardio intervals alone', () => {
    const chest = getWorkout('gym2')
    const intervals = getWorkout('gym19')
    expect(capsSets(chest, 2)).toBe(true)
    expect(planExercises(chest, 2).every(p => p.sets <= 2)).toBe(true)
    expect(capsSets(intervals, 2)).toBe(false)
    expect(planExercises(intervals, 2).find(p => p.id === 'g-row')!.sets).toBe(8)
  })
})
