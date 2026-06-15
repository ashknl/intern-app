import { useState, useEffect } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Trash2, UserRoundPlus } from 'lucide-react'
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

interface OfficerRow {
  id: number
  officer_name: string
  officer_designation: string
  created_at: string
}

const columns: ColumnDef<OfficerRow>[] = [
  { accessorKey: 'officer_name', header: 'Name' },
  { accessorKey: 'officer_designation', header: 'Designation' },
  { accessorKey: 'created_at', header: 'Created At' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const onDelete = (table.options.meta as { onDelete: (id: number) => void } | undefined)?.onDelete
      return (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete?.(row.original.id)}
        >
          <Trash2 size={16} />
        </Button>
      )
    },
  },
]

export default function SigningOfficers() {
  const [officers, setOfficers] = useState<OfficerRow[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [error, setError] = useState<string | null>(null)

  const [officerName, setOfficerName] = useState('')
  const [officerDesignation, setOfficerDesignation] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function fetchOfficers() {
    window.ipcRenderer.invoke('admin:getAllOfficers').then((result) => {
      if (result.success) {
        setOfficers(result.data as OfficerRow[])
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  useEffect(() => { fetchOfficers() }, [])

  async function handleAddOfficer() {
    if (!officerName.trim() || !officerDesignation.trim()) {
      setAddError('Both fields are required.')
      return
    }

    setAdding(true)
    setAddError(null)
    setAddSuccess(null)

    const result = await window.ipcRenderer.invoke('admin:insertOfficer', {
      officerName: officerName.trim(),
      officerDesignation: officerDesignation.trim(),
    })

    setAdding(false)

    if (result.success) {
      setAddSuccess(`Officer "${officerName.trim()}" added.`)
      setOfficerName('')
      setOfficerDesignation('')
      fetchOfficers()
    } else {
      setAddError(result.error)
    }
  }

  async function handleDeleteOfficer(id: number) {
    const result = await window.ipcRenderer.invoke('admin:deleteOfficer', { id })
    if (result.success) {
      fetchOfficers()
    } else {
      setError(result.error)
    }
  }

  const table = useReactTable({
    data: officers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: { onDelete: handleDeleteOfficer },
  })

  return (
    <div>
      <h3 className="text-lg font-semibold">Signing Officers</h3>
      <p className="text-muted-foreground mt-2">Manage signing officers list.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundPlus size={18} /> Add Officer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Officer Name *</FieldLabel>
              <Input
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Designation *</FieldLabel>
              <Input
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
              />
            </Field>
          </div>

          {addError && <p className="mt-4 text-sm text-destructive">{addError}</p>}
          {addSuccess && <p className="mt-4 text-sm text-green-600 font-medium">{addSuccess}</p>}

          <Button className="mt-4" onClick={handleAddOfficer} disabled={adding}>
            {adding ? 'Adding...' : 'Add Officer'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Officers ({officers.length})</CardTitle>
        </CardHeader>
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
    </div>
  )
}
