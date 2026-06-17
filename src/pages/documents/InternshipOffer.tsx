import { useState, useEffect, useMemo } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import SearchFilters, { EMPTY_FILTERS } from '@/components/SearchFilters'

interface Intern {
  id: number
  name: string
  institution_roll: string
  institution_name: string
  starting_date: string
  no_of_days: number
  gender: string
}

interface Officer {
  id: number
  officer_name: string
  officer_designation: string
}

export default function InternshipOffer() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [results, setResults] = useState<Intern[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const [officers, setOfficers] = useState<Officer[]>([])
  const [selectedOfficerId, setSelectedOfficerId] = useState('')

  const [applicationDates, setApplicationDates] = useState<Record<number, string>>({})
  const [nocDates, setNocDates] = useState<Record<number, string>>({})

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    window.ipcRenderer.invoke('admin:getAllOfficers').then((r) => {
      if (r.success && r.data?.length) {
        setOfficers(r.data as Officer[])
        setSelectedOfficerId(String((r.data as Officer[])[0].id))
      }
    })
  }, [])

  const selectedOfficer = officers.find((o) => String(o.id) === selectedOfficerId)

  const handleGenerate = async (intern: Intern) => {
    const appDate = applicationDates[intern.id]
    if (!appDate) {
      setGenerateError('Please fill in the Application Date.')
      return
    }

    setGenerateError(null)
    setGenerating(true)

    try {
      const result = await window.ipcRenderer.invoke('document:generateInternshipOffer', {
        intern: {
          id: intern.id,
          name: intern.name,
          institution_name: intern.institution_name,
          starting_date: intern.starting_date,
          no_of_days: intern.no_of_days,
          gender: intern.gender,
        },
        applicationDate: appDate,
        nocDate: nocDates[intern.id] ?? appDate,
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

  const resultColumns = useMemo<ColumnDef<Intern>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'institution_roll', header: 'Institution Roll' },
    { accessorKey: 'institution_name', header: 'Institution Name' },
    {
      id: 'application_date',
      header: 'App Date',
      cell: ({ row, table }) => {
        const meta = table.options.meta as {
          applicationDates: Record<number, string>
          setApplicationDate: (id: number, val: string) => void
        }
        return (
          <Input
            type="date"
            className="w-32"
            value={meta.applicationDates[row.original.id] ?? ''}
            onChange={(e) => meta.setApplicationDate(row.original.id, e.target.value)}
          />
        )
      },
    },
    {
      id: 'noc_date',
      header: 'NOC Date',
      cell: ({ row, table }) => {
        const meta = table.options.meta as {
          nocDates: Record<number, string>
          setNocDate: (id: number, val: string) => void
        }
        return (
          <Input
            type="date"
            className="w-32"
            value={meta.nocDates[row.original.id] ?? ''}
            onChange={(e) => meta.setNocDate(row.original.id, e.target.value)}
          />
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row, table }) => {
        const meta = table.options.meta as {
          generating: boolean
          submitOffer: (intern: Intern) => void
        }
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={meta.generating}
            onClick={() => meta.submitOffer(row.original)}
          >
            <Printer size={14} />
            Generate
          </Button>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: results,
    columns: resultColumns,
    state: { sorting },
    onSortingChange: setSorting,
    meta: {
      applicationDates,
      setApplicationDate: (id: number, val: string) =>
        setApplicationDates((prev) => ({ ...prev, [id]: val })),
      nocDates,
      setNocDate: (id: number, val: string) =>
        setNocDates((prev) => ({ ...prev, [id]: val })),
      generating,
      submitOffer: handleGenerate,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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

  return (
    <div>
      <h3 className="text-lg font-semibold">Internship Offer</h3>
      <p className="text-muted-foreground mt-2">Generate internship offer letters.</p>

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

      <SearchFilters
        filters={filters}
        onFilterChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
        onSearch={handleSearch}
        onClear={handleClear}
        searching={searching}
      />

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
