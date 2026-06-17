import { useState, Fragment } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import SearchFilters, { EMPTY_FILTERS } from '@/components/SearchFilters'

interface Intern {
  id: number
  name: string
  gender?: string
  identification_mark?: string
  institution_roll: string
  degree?: string
  branch: string
  year_of_study: string
  guardian_name: string
  guardian_relation: string
  res_c_o?: string
  res_p_o?: string
  res_pin?: string
  res_contact?: string
  cur_c_o?: string
  cur_p_o?: string
  cur_pin?: string
  cur_contact?: string
  starting_date: string
  no_of_days: number
  section_posted: string
  institution_name: string
  registration_id?: string
}

export default function ManageStudents() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [results, setResults] = useState<Intern[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleClear = () => {
    setFilters({ ...EMPTY_FILTERS })
    setResults([])
    setSearchError(null)
    setExpandedIds(new Set())
  }

  const handleSearch = async () => {
    setSearchError(null)
    setSearching(true)
    const result = await window.ipcRenderer.invoke('search:interns', filters)
    setSearching(false)
    if (result.success) {
      setResults(result.data as Intern[])
      setExpandedIds(new Set())
    } else {
      setSearchError(result.error)
      setResults([])
    }
  }

  const handleDelete = async (intern: Intern) => {
    if (!confirm(`Delete "${intern.name}" (${intern.institution_roll})? This cannot be undone.`)) return
    setDeleting(true)
    setSearchError(null)
    const result = await window.ipcRenderer.invoke('admin:deleteIntern', { id: intern.id })
    setDeleting(false)
    if (result.success) {
      setResults((prev) => prev.filter((r) => r.id !== intern.id))
    } else {
      setSearchError(result.error)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Manage Students</h3>
      <p className="text-muted-foreground mt-2">View and delete intern records.</p>

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
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Institution Roll</TableHead>
                  <TableHead>Institution Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.institution_roll}</TableCell>
                      <TableCell>{row.institution_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={deleting}
                            onClick={() => handleDelete(row)}
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpand(row.id)}
                          >
                            {expandedIds.has(row.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedIds.has(row.id) && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/20">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 p-2 text-sm">
                            <div><span className="font-medium">Gender:</span> {row.gender ?? '-'}</div>
                            <div><span className="font-medium">Branch:</span> {row.branch}</div>
                            <div><span className="font-medium">Year:</span> {row.year_of_study}</div>
                            <div><span className="font-medium">Degree:</span> {row.degree ?? '-'}</div>
                            <div><span className="font-medium">Guardian:</span> {row.guardian_name} ({row.guardian_relation})</div>
                            <div><span className="font-medium">ID Mark:</span> {row.identification_mark ?? '-'}</div>
                            <div className="col-span-full"><span className="font-medium">Res Address:</span> {row.res_c_o ?? '-'}, {row.res_p_o ?? '-'}-{row.res_pin ?? '-'}, Ph: {row.res_contact ?? '-'}</div>
                            <div className="col-span-full"><span className="font-medium">Cur Address:</span> {row.cur_c_o ?? '-'}, {row.cur_p_o ?? '-'}-{row.cur_pin ?? '-'}, Ph: {row.cur_contact ?? '-'}</div>
                            <div><span className="font-medium">Start:</span> {row.starting_date}</div>
                            <div><span className="font-medium">Days:</span> {row.no_of_days}</div>
                            <div><span className="font-medium">Section:</span> {row.section_posted}</div>
                            {row.registration_id && (
                              <div className="col-span-full"><span className="font-medium">Reg ID:</span> {row.registration_id}</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
