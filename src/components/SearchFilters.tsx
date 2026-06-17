/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const SEARCH_FIELDS = [
  { field: 'name', label: 'Name' },
  { field: 'institution_roll', label: 'Institution Roll' },
  { field: 'guardian_name', label: 'Guardian Name' },
  { field: 'guardian_relation', label: 'Guardian Relation' },
  { field: 'branch', label: 'Branch' },
  { field: 'year_of_study', label: 'Year of Study' },
  { field: 'section_posted', label: 'Section Posted' },
  { field: 'institution_name', label: 'Institution Name' },
] as const

export const EMPTY_FILTERS = {
  name: '',
  institution_roll: '',
  guardian_name: '',
  guardian_relation: '',
  branch: '',
  year_of_study: '',
  starting_date: '',
  no_of_days: '',
  section_posted: '',
  institution_name: '',
}

const OTHER_FIELDS = new Set(['branch', 'section_posted'])

interface SearchFiltersProps {
  filters: Record<string, string>
  onFilterChange: (field: string, value: string) => void
  onSearch: () => void
  onClear: () => void
  searching: boolean
}

export default function SearchFilters({ filters, onFilterChange, onSearch, onClear, searching }: SearchFiltersProps) {
  const [options, setOptions] = useState<Record<string, string[]>>({})
  const [otherMode, setOtherMode] = useState<Set<string>>(new Set())
  const [otherValues, setOtherValues] = useState<Record<string, string>>({})

  useEffect(() => {
    for (const { field } of SEARCH_FIELDS) {
      window.ipcRenderer.invoke('search:distinctValues', { column: field }).then((r) => {
        if (r.success) setOptions((prev) => ({ ...prev, [field]: r.data as string[] }))
      })
    }
  }, [])

  const handleSelect = (field: string, value: string) => {
    if (value === '__other__') {
      setOtherMode((prev) => new Set(prev).add(field))
      onFilterChange(field, otherValues[field] ?? '')
    } else {
      setOtherMode((prev) => {
        const next = new Set(prev)
        next.delete(field)
        return next
      })
      onFilterChange(field, value)
    }
  }

  const handleOtherInput = (field: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [field]: value }))
    onFilterChange(field, value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="@container">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SEARCH_FIELDS.map(({ field, label }) => (
              <Field key={field}>
                <FieldLabel>{label}</FieldLabel>
                <Select
                  value={otherMode.has(field) ? '__other__' : (filters[field] ?? '')}
                  onChange={(e) => handleSelect(field, e.target.value)}
                >
                  <option value="">All</option>
                  {(options[field] ?? []).map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                  {OTHER_FIELDS.has(field) && (
                    <option value="__other__">Other (type your own)...</option>
                  )}
                </Select>
                {otherMode.has(field) && (
                  <Input
                    className="mt-2"
                    placeholder={`Type ${label.toLowerCase()}...`}
                    value={otherValues[field] ?? ''}
                    onChange={(e) => handleOtherInput(field, e.target.value)}
                  />
                )}
              </Field>
            ))}
            <Field>
              <FieldLabel>Starting Date</FieldLabel>
              <Input
                type="date"
                value={filters.starting_date}
                onChange={(e) => onFilterChange('starting_date', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>No. of Days</FieldLabel>
              <Input
                type="number"
                value={filters.no_of_days}
                onChange={(e) => onFilterChange('no_of_days', e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-6 flex gap-2">
            <Button onClick={onSearch} disabled={searching}>
              <Search />
              {searching ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={onClear} disabled={searching}>
              <X />
              Clear
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
