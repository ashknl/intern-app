import { useState, useEffect } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
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
import { Select } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'

interface SafeUserRow {
  id: number
  username: string
  security_question: string
  created_at: string
}

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What city were you born in?",
]

const columns: ColumnDef<SafeUserRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'security_question', header: 'Security Question' },
  { accessorKey: 'created_at', header: 'Created At' },
]

export default function Users() {
  const [users, setUsers] = useState<SafeUserRow[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [error, setError] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [questionMode, setQuestionMode] = useState<'preset' | 'custom'>('preset')
  const [customQuestion, setCustomQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function fetchUsers() {
    window.ipcRenderer.invoke('admin:getAllUsers').then((result) => {
      if (result.success) {
        setUsers(result.data as SafeUserRow[])
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleAddUser() {
    const question = questionMode === 'custom' ? customQuestion.trim() : securityQuestion
    if (!username.trim() || !password.trim() || !question || !securityAnswer.trim()) {
      setAddError('All fields are required.')
      return
    }

    setAdding(true)
    setAddError(null)
    setAddSuccess(null)

    const result = await window.ipcRenderer.invoke('admin:createUser', {
      username: username.trim(),
      password,
      securityQuestion: question,
      securityAnswer,
    })

    setAdding(false)

    if (result.success) {
      setAddSuccess(`User "${username.trim()}" created.`)
      setUsername('')
      setPassword('')
      setSecurityQuestion('')
      setQuestionMode('preset')
      setCustomQuestion('')
      setSecurityAnswer('')
      fetchUsers()
    } else {
      setAddError(result.error)
    }
  }

  const handleQuestionChange = (val: string) => {
    if (val === '__custom__') {
      setSecurityQuestion('')
      setCustomQuestion('')
      setQuestionMode('custom')
    } else {
      setSecurityQuestion(val)
      setQuestionMode('preset')
    }
  }

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <h3 className="text-lg font-semibold">Users</h3>
      <p className="text-muted-foreground mt-2">Manage user accounts.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={18} /> Add User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Username *</FieldLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Password *</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Security Question *</FieldLabel>
              <Select
                value={questionMode === 'custom' ? '__custom__' : securityQuestion}
                onChange={(e) => handleQuestionChange(e.target.value)}
              >
                <option value="">Select a question</option>
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
                <option value="__custom__">Other (type your own)...</option>
              </Select>
            </Field>
            {questionMode === 'custom' && (
              <Field>
                <FieldLabel>Custom Question *</FieldLabel>
                <Input
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Type your security question"
                />
              </Field>
            )}
            <Field>
              <FieldLabel>Security Answer *</FieldLabel>
              <Input
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
              />
            </Field>
          </div>

          {addError && <p className="mt-4 text-sm text-destructive">{addError}</p>}
          {addSuccess && <p className="mt-4 text-sm text-green-600 font-medium">{addSuccess}</p>}

          <Button className="mt-4" onClick={handleAddUser} disabled={adding}>
            {adding ? 'Creating...' : 'Create User'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
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
