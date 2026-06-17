import { useState, useEffect, useMemo } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
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
  branch: string
  year_of_study: string
  section_posted: string
  starting_date: string
  no_of_days: number
  guardian_name: string
  guardian_relation: string
}

interface FeedbackDisplayRow {
  id: number
  feedback_text: string
  created_at: string
  name: string
  institution_roll: string
  institution_name: string
}

export default function FeedbackDetails() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [results, setResults] = useState<Intern[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const [feedbacks, setFeedbacks] = useState<FeedbackDisplayRow[]>([])
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackTexts, setFeedbackTexts] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({})

  function fetchFeedbacks() {
    window.ipcRenderer.invoke('feedback:getAllFeedbacks').then((result) => {
      if (result.success) {
        setFeedbacks(result.data as FeedbackDisplayRow[])
        setFeedbackError(null)
      } else {
        setFeedbackError(result.error)
      }
    })
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  async function handleSubmitFeedback(internId: number) {
    const text = (feedbackTexts[internId] ?? '').trim()
    if (!text) return

    setSubmitting((prev) => ({ ...prev, [internId]: true }))
    setFeedbackError(null)

    const result = await window.ipcRenderer.invoke('feedback:insertFeedback', {
      internId,
      feedbackText: text,
    })

    setSubmitting((prev) => ({ ...prev, [internId]: false }))

    if (result.success) {
      setFeedbackTexts((prev) => ({ ...prev, [internId]: '' }))
      fetchFeedbacks()
    } else {
      setFeedbackError(result.error)
    }
  }

  async function handleDeleteFeedback(internId: number) {
    const result = await window.ipcRenderer.invoke('feedback:deleteFeedback', { internId })
    if (result.success) {
      fetchFeedbacks()
    } else {
      setFeedbackError(result.error)
    }
  }

  const resultColumns = useMemo<ColumnDef<Intern>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'institution_roll', header: 'Institution Roll' },
    { accessorKey: 'institution_name', header: 'Institution Name' },
    {
      id: 'feedback',
      header: 'Feedback',
      cell: ({ row, table }) => {
        const meta = table.options.meta as {
          feedbackTexts: Record<number, string>
          submitting: Record<number, boolean>
          setFeedbackText: (id: number, text: string) => void
          submitFeedback: (id: number) => void
        }
        const internId = row.original.id
        const isSubmitting = meta.submitting[internId] ?? false
        return (
          <div className="flex items-center gap-2 min-w-[300px]">
            <textarea
              className="h-8 w-full min-w-0 rounded-xl border border-input/50 bg-input/50 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              rows={1}
              value={meta.feedbackTexts[internId] ?? ''}
              onChange={(e) => meta.setFeedbackText(internId, e.target.value)}
            />
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={() => meta.submitFeedback(internId)}
            >
              {isSubmitting ? '...' : 'Save'}
            </Button>
          </div>
        )
      },
    },
  ], [])

  const resultTable = useReactTable({
    data: results,
    columns: resultColumns,
    state: { sorting },
    onSortingChange: setSorting,
    meta: {
      feedbackTexts,
      submitting,
      setFeedbackText: (id: number, text: string) =>
        setFeedbackTexts((prev) => ({ ...prev, [id]: text })),
      submitFeedback: handleSubmitFeedback,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const feedbackColumns: ColumnDef<FeedbackDisplayRow>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'institution_roll', header: 'Institution Roll' },
    {
      accessorKey: 'feedback_text',
      header: 'Feedback',
      cell: ({ getValue }) => {
        const text = getValue() as string
        return text.length > 80 ? text.slice(0, 80) + '...' : text
      },
    },
    { accessorKey: 'created_at', header: 'Created At' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => handleDeleteFeedback(row.original.id)}
        >
          <Trash2 size={16} />
        </Button>
      ),
    },
  ]

  const [feedbackSorting, setFeedbackSorting] = useState<SortingState>([])

  const feedbackTable = useReactTable({
    data: feedbacks,
    columns: feedbackColumns,
    state: { sorting: feedbackSorting },
    onSortingChange: setFeedbackSorting,
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
      <h3 className="text-lg font-semibold">Add Feedback for Students</h3>
      <p className="text-muted-foreground mt-2">Search for a student to submit their feedback.</p>

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

      {results.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {resultTable.getHeaderGroups().map((headerGroup) => (
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
                {resultTable.getRowModel().rows.map((row) => (
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
                Page {resultTable.getState().pagination.pageIndex + 1} of {resultTable.getPageCount()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resultTable.previousPage()}
                  disabled={!resultTable.getCanPreviousPage()}
                >
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resultTable.nextPage()}
                  disabled={!resultTable.getCanNextPage()}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {feedbackError && (
        <p className="mt-4 text-sm text-destructive">{feedbackError}</p>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Feedbacks ({feedbacks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {feedbackTable.getHeaderGroups().map((headerGroup) => (
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
              {feedbackTable.getRowModel().rows.map((row) => (
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
              Page {feedbackTable.getState().pagination.pageIndex + 1} of {feedbackTable.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => feedbackTable.previousPage()}
                disabled={!feedbackTable.getCanPreviousPage()}
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => feedbackTable.nextPage()}
                disabled={!feedbackTable.getCanNextPage()}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
