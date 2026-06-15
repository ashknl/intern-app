import { useState, useEffect } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Printer, Search, X } from 'lucide-react'
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface Intern {
  id: number
  name: string
  institution_roll: string
  institution_name: string
  starting_date: string
  no_of_days: number
}

interface Officer {
  id: number
  officer_name: string
  officer_designation: string
}

const SEARCH_FIELDS = [
  { field: 'name', label: 'Name' },
  { field: 'institution_roll', label: 'Institution Roll' },
  { field: 'guardian_name', label: 'Guardian Name' },
  { field: 'guardian_relation', label: 'Guardian Relation' },
  { field: 'branch', label: 'Branch' },
  { field: 'year_of_study', label: 'Year of Study' },
  { field: 'section_posted', label: 'Section Posted' },
  { field: 'institution_name', label: 'Institution Name' },
] as const

const EMPTY_FILTERS = {
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

export default function Certificate() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [results, setResults] = useState<Intern[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const [options, setOptions] = useState<Record<string, string[]>>({})
  const [officers, setOfficers] = useState<Officer[]>([])
  const [selectedOfficerId, setSelectedOfficerId] = useState('')

  const [workAreas, setWorkAreas] = useState<Record<number, string>>({})
  const [ratings, setRatings] = useState<Record<number, string>>({})

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    for (const { field } of SEARCH_FIELDS) {
      window.ipcRenderer.invoke('search:distinctValues', { column: field }).then((r) => {
        if (r.success) setOptions((prev) => ({ ...prev, [field]: r.data as string[] }))
      })
    }
    window.ipcRenderer.invoke('admin:getAllOfficers').then((r) => {
      if (r.success && r.data?.length) {
        setOfficers(r.data as Officer[])
        setSelectedOfficerId(String((r.data as Officer[])[0].id))
      }
    })
  }, [])

  const selectedOfficer = officers.find((o) => String(o.id) === selectedOfficerId)

  const resultColumns: ColumnDef<Intern>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'institution_roll', header: 'Institution Roll' },
    { accessorKey: 'institution_name', header: 'Institution Name' },
    {
      id: 'work_areas',
      header: 'Work Areas',
      cell: ({ row }) => (
        <Textarea
          className="w-48 text-xs"
          rows={3}
          placeholder="One per line"
          value={workAreas[row.original.id] ?? ''}
          onChange={(e) => setWorkAreas((prev) => ({ ...prev, [row.original.id]: e.target.value }))}
        />
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <Input
          className="w-28"
          value={ratings[row.original.id] ?? ''}
          onChange={(e) => setRatings((prev) => ({ ...prev, [row.original.id]: e.target.value }))}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={generating}
          onClick={() => handleGenerate(row.original)}
        >
          <Printer size={14} />
          Generate
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: results,
    columns: resultColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => {
    setFilters({ ...EMPTY_FILTERS })
    setResults([])
    setSearchError(null)
    setSorting([])
  }

  const handleSearch = async () => {
    setSearchError(null)
    setSearching(true)
    const result = await window.ipcRenderer.invoke('search:interns', filters)
    setSearching(false)
    if (result.success) {
      setResults(result.data as Intern[])
    } else {
      setSearchError(result.error)
      setResults([])
    }
  }

  const handleGenerate = async (intern: Intern) => {
    const areas = (workAreas[intern.id] ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
    if (areas.length === 0) {
      setGenerateError('Please fill in at least one Work Area.')
      return
    }
    const rating = (ratings[intern.id] ?? '').trim()
    if (!rating) {
      setGenerateError('Please fill in the Rating.')
      return
    }

    setGenerateError(null)
    setGenerating(true)

    try {
      const result = await window.ipcRenderer.invoke('document:generateCertificate', {
        intern: {
          id: intern.id,
          name: intern.name,
          institution_name: intern.institution_name,
          starting_date: intern.starting_date,
          no_of_days: intern.no_of_days,
        },
        workAreas: areas,
        rating,
        officerName: selectedOfficer?.officer_name ?? '',
        officerDesignation: selectedOfficer?.officer_designation ?? '',
      })

      if (!result.success && result.error !== 'Save cancelled') {
        setGenerateError(result.error)
      }
    } catch (err) {
      setGenerateError(String(err))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Certificate</h3>
      <p className="text-muted-foreground mt-2">Generate completion certificates.</p>

      {officers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Signing Officer</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Select Officer</FieldLabel>
              <Select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
              >
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.officer_name} - {o.officer_designation}
                  </option>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
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
                    value={filters[field as keyof typeof EMPTY_FILTERS]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  >
                    <option value="">All</option>
                    {(options[field] ?? []).map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </Select>
                </Field>
              ))}
              <Field>
                <FieldLabel>Starting Date</FieldLabel>
                <Input
                  type="date"
                  value={filters.starting_date}
                  onChange={(e) => handleChange('starting_date', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>No. of Days</FieldLabel>
                <Input
                  type="number"
                  value={filters.no_of_days}
                  onChange={(e) => handleChange('no_of_days', e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={handleSearch} disabled={searching}>
                <Search />
                {searching ? 'Searching...' : 'Search'}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={searching}>
                <X />
                Clear
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {searchError && (
        <p className="mt-4 text-sm text-destructive">{searchError}</p>
      )}

      {generateError && (
        <p className="mt-4 text-sm text-destructive">{generateError}</p>
      )}

      {results.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <Button
                            variant="ghost"
                            className="-ml-3"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="ml-1" size={14} />
                          </Button>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
