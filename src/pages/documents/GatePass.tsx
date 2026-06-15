import { useState, useEffect } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, FolderOpen, Printer, Search, X } from 'lucide-react'
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  guardian_name: string
  degree: string
  branch: string
  identification_mark: string
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

export default function GatePass() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [results, setResults] = useState<Intern[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const [options, setOptions] = useState<Record<string, string[]>>({})

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [bulkFolderPath, setBulkFolderPath] = useState<string | null>(null)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ generated: number; errors: string[] } | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)

  useEffect(() => {
    for (const { field } of SEARCH_FIELDS) {
      window.ipcRenderer.invoke('search:distinctValues', { column: field }).then((r) => {
        if (r.success) setOptions((prev) => ({ ...prev, [field]: r.data as string[] }))
      })
    }
  }, [])

  const resultColumns: ColumnDef<Intern>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'institution_roll', header: 'Institution Roll' },
    { accessorKey: 'institution_name', header: 'Institution Name' },
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
    setGenerateError(null)
    setGenerating(true)
    try {
      const result = await window.ipcRenderer.invoke('document:generateGatePass', {
        name: intern.name,
        guardian_name: intern.guardian_name,
        institution_name: intern.institution_name,
        degree: intern.degree,
        branch: intern.branch,
        identification_mark: intern.identification_mark,
        starting_date: '',
        no_of_days: 0,
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

  const handleSelectFolder = async () => {
    const folderPath = await window.ipcRenderer.invoke('dialog:selectFolder')
    if (folderPath) {
      setBulkFolderPath(folderPath)
      setBulkResult(null)
      setBulkError(null)
    }
  }

  const handleBulkGenerate = async () => {
    if (!bulkFolderPath) return
    setBulkResult(null)
    setBulkError(null)
    setBulkGenerating(true)
    try {
      const result = await window.ipcRenderer.invoke('document:bulkGenerateGatePass', {
        folderPath: bulkFolderPath,
      })
      if (result.success) {
        setBulkResult({ generated: result.generated, errors: result.errors })
      } else {
        setBulkError(result.error)
      }
    } catch (err) {
      setBulkError(String(err))
    } finally {
      setBulkGenerating(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Gate Pass</h3>
      <p className="text-muted-foreground mt-2">Generate gate pass documents.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Bulk Generate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSelectFolder}
              disabled={bulkGenerating}
            >
              <FolderOpen size={16} />
              Select Folder
            </Button>
            {bulkFolderPath && (
              <span className="text-sm text-muted-foreground truncate max-w-md">
                {bulkFolderPath}
              </span>
            )}
          </div>

          {bulkFolderPath && (
            <div className="mt-4">
              <Button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating}
              >
                <Printer size={14} />
                {bulkGenerating ? 'Generating...' : 'Generate All Gate Passes'}
              </Button>
            </div>
          )}

          {bulkResult && (
            <p className="mt-4 text-sm text-green-600">
              Generated {bulkResult.generated} document
              {bulkResult.generated !== 1 ? 's' : ''}.
              {bulkResult.errors.length > 0 && (
                <span className="text-destructive">
                  {' '}
                  {bulkResult.errors.length} error
                  {bulkResult.errors.length !== 1 ? 's' : ''}.
                </span>
              )}
            </p>
          )}

          {bulkResult && bulkResult.errors.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              {bulkResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-destructive">{err}</p>
              ))}
            </div>
          )}

          {bulkError && (
            <p className="mt-4 text-sm text-destructive">{bulkError}</p>
          )}
        </CardContent>
      </Card>

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
