import { useState, useEffect, useMemo } from 'react'

export interface InternRow {
  name: string
  institution_roll: string
  guardian_name: string
  guardian_relation: string
  branch: string
  year_of_study: string
  starting_date: string
  no_of_days: number
  section_posted: string
  institution_name: string
}

export interface DashboardMetrics {
  totalStudents: number
  totalInstitutions: number
  avgDuration: number
  yearRange: { min: number; max: number } | null
  branchDistribution: { name: string; value: number }[]
  yearDistribution: { name: string; value: number }[]
  sectionDistribution: { name: string; value: number }[]
  monthlyTrend: { month: string; count: number }[]
}

export function useDashboardData() {
  const [interns, setInterns] = useState<InternRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const result = await window.ipcRenderer.invoke('dashboard:getAllInterns')
        if (cancelled) return
        if (result.success) {
          setInterns(result.data as InternRow[])
        } else {
          setError(result.error ?? 'Failed to fetch dashboard data')
        }
      } catch (err) {
        if (cancelled) return
        setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const metrics = useMemo<DashboardMetrics>(() => {
    if (interns.length === 0) {
      return {
        totalStudents: 0,
        totalInstitutions: 0,
        avgDuration: 0,
        yearRange: null,
        branchDistribution: [],
        yearDistribution: [],
        sectionDistribution: [],
        monthlyTrend: [],
      }
    }

    const totalStudents = interns.length
    const uniqueInstitutions = new Set(interns.map((i) => i.institution_name))
    const avgDuration = Math.round(
      interns.reduce((sum, i) => sum + i.no_of_days, 0) / totalStudents,
    )

    const dates = interns.map((i) => new Date(i.starting_date))
    const validDates = dates.filter((d) => !isNaN(d.getTime()))
    const yearRange =
      validDates.length > 0
        ? {
            min: Math.min(...validDates.map((d) => d.getFullYear())),
            max: Math.max(...validDates.map((d) => d.getFullYear())),
          }
        : null

    const countBy = (key: keyof InternRow) => {
      const map = new Map<string, number>()
      interns.forEach((i) => {
        const val = String(i[key])
        map.set(val, (map.get(val) ?? 0) + 1)
      })
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    }

    const monthMap = new Map<string, number>()
    validDates.forEach((d) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
    })
    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalStudents,
      totalInstitutions: uniqueInstitutions.size,
      avgDuration,
      yearRange,
      branchDistribution: countBy('branch'),
      yearDistribution: countBy('year_of_study'),
      sectionDistribution: countBy('section_posted'),
      monthlyTrend,
    }
  }, [interns])

  return { interns, metrics, loading, error }
}
