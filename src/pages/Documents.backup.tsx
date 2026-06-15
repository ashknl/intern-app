import { useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Printer,
  Search,
  Ticket,
  X,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { Intern } from "@/lib/IIntern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th"];
const SECTION_OPTIONS = ["ITC", "HRD", "UNIT-1", "UNIT-2", "UNIT-3", "UNIT-4"];

const EMPTY_FILTERS = {
  name: "",
  guardian_name: "",
  guardian_relation: "",
  branch: "",
  year_of_study: "",
  starting_date: "",
  no_of_days: "",
  section_posted: "",
  institution_name: "",
};

export default function Documents() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [results, setResults] = useState<Intern[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [bulkFolderPath, setBulkFolderPath] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ generated: number; errors: string[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const folderPath = await window.ipcRenderer.invoke('dialog:selectFolder')
    if (folderPath) {
      setBulkFolderPath(folderPath)
      setBulkResult(null)
      setBulkError(null)
    }
  }

  const handleBulkGenerate = async (type: 'certificate' | 'gatepass') => {
    if (!bulkFolderPath) return
    setBulkResult(null)
    setBulkError(null)
    setBulkGenerating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const result = await window.ipcRenderer.invoke(
        'document:bulkGenerate',
        { folderPath: bulkFolderPath, type },
      )
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

  const handleGenerateCertificate = async (intern: Intern) => {
    setGenerateError(null)
    setGenerating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const result = await window.ipcRenderer.invoke(
        'document:generateCertificate',
        {
          name: intern.name,
          institution_name: intern.institution_name,
          starting_date: intern.starting_date,
          no_of_days: intern.no_of_days,
        },
      )
      if (!result.success) {
        if (result.error !== 'Save cancelled') {
          setGenerateError(result.error)
        }
      }
    } catch (err) {
      setGenerateError(String(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateGatePass = async (intern: Intern) => {
    setGenerateError(null)
    setGenerating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const result = await window.ipcRenderer.invoke(
        'document:generateGatePass',
        {
          name: intern.name,
          guardian_name: intern.guardian_name,
          institution_name: intern.institution_name,
          starting_date: intern.starting_date,
          no_of_days: intern.no_of_days,
        },
      )
      if (!result.success) {
        if (result.error !== 'Save cancelled') {
          setGenerateError(result.error)
        }
      }
    } catch (err) {
      setGenerateError(String(err))
    } finally {
      setGenerating(false)
    }
  }

  const columns: ColumnDef<Intern>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "guardian_name", header: "Guardian Name" },
    { accessorKey: "branch", header: "Branch" },
    { accessorKey: "year_of_study", header: "Year of Study" },
    { accessorKey: "starting_date", header: "Starting Date" },
    { accessorKey: "no_of_days", header: "No. of Days" },
    { accessorKey: "section_posted", header: "Section Posted" },
    { accessorKey: "institution_name", header: "Institution Name" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={generating}
            onClick={() => handleGenerateCertificate(row.original)}
          >
            <Printer size={14} />
            Certificate
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={generating}
            onClick={() => handleGenerateGatePass(row.original)}
          >
            <Ticket size={14} />
            Gate Pass
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: results,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setFilters({ ...EMPTY_FILTERS });
    setResults([]);
    setSearchError(null);
    setSorting([]);
  };

  const handleSearch = async () => {
    setSearchError(null);
    setSearching(true);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const result = await window.ipcRenderer.invoke("search:interns", filters);

    setSearching(false);

    if (result.success) {
      setResults(result.data as Intern[]);
      setSorting([]);
    } else {
      setSearchError(result.error);
      setResults([]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText size={24} /> Documents
      </h2>
      <p className="mt-2 text-muted-foreground">
        Search interns and generate certificates.
      </p>

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
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handleBulkGenerate('certificate')}
                disabled={bulkGenerating}
              >
                <Printer size={14} />
                {bulkGenerating
                  ? 'Generating...'
                  : 'Generate All Certificates'}
              </Button>
              <Button
                onClick={() => handleBulkGenerate('gatepass')}
                disabled={bulkGenerating}
              >
                <Ticket size={14} />
                {bulkGenerating
                  ? 'Generating...'
                  : 'Generate All Gate Passes'}
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
                <p key={i} className="text-xs text-destructive">
                  {err}
                </p>
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
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  type="text"
                  value={filters.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Guardian Name</FieldLabel>
                <Input
                  type="text"
                  value={filters.guardian_name}
                  onChange={(e) =>
                    handleChange("guardian_name", e.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Guardian Relation</FieldLabel>
                <Input
                  type="text"
                  value={filters.guardian_relation}
                  onChange={(e) =>
                    handleChange("guardian_relation", e.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Branch</FieldLabel>
                <Input
                  type="text"
                  value={filters.branch}
                  onChange={(e) => handleChange("branch", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Year of Study</FieldLabel>
                <Select
                  value={filters.year_of_study}
                  onChange={(e) =>
                    handleChange("year_of_study", e.target.value)
                  }
                >
                  <option value="">All</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel>Starting Date</FieldLabel>
                <Input
                  type="date"
                  value={filters.starting_date}
                  onChange={(e) =>
                    handleChange("starting_date", e.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel>No. of Days</FieldLabel>
                <Input
                  type="number"
                  value={filters.no_of_days}
                  onChange={(e) => handleChange("no_of_days", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Section Posted</FieldLabel>
                <Select
                  value={filters.section_posted}
                  onChange={(e) =>
                    handleChange("section_posted", e.target.value)
                  }
                >
                  <option value="">All</option>
                  {SECTION_OPTIONS.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel>Institution Name</FieldLabel>
                <Input
                  type="text"
                  value={filters.institution_name}
                  onChange={(e) =>
                    handleChange("institution_name", e.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={handleSearch} disabled={searching}>
                <Search />
                {searching ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={searching}
              >
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
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
