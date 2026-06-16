import { useState, useEffect } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, FileBarChart, Printer, Search, X } from 'lucide-react';
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import type { Intern } from '@/lib/IIntern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const SEARCH_FIELDS = [
  { field: 'name', label: 'Name' },
  { field: 'institution_roll', label: 'Institution Roll' },
  { field: 'guardian_name', label: 'Guardian Name' },
  { field: 'guardian_relation', label: 'Guardian Relation' },
  { field: 'branch', label: 'Branch' },
  { field: 'year_of_study', label: 'Year of Study' },
  { field: 'section_posted', label: 'Section Posted' },
  { field: 'institution_name', label: 'Institution Name' },
] as const;

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
};

const columns: ColumnDef<Intern>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'institution_roll', header: 'Institution Roll' },
    { accessorKey: 'guardian_name', header: 'Guardian Name' },
    { accessorKey: 'guardian_relation', header: 'Guardian Relation' },
    { accessorKey: 'branch', header: 'Branch' },
    { accessorKey: 'year_of_study', header: 'Year of Study' },
    { accessorKey: 'starting_date', header: 'Starting Date' },
    { accessorKey: 'no_of_days', header: 'No. of Days' },
    { accessorKey: 'section_posted', header: 'Section Posted' },
    { accessorKey: 'institution_name', header: 'Institution Name' },
];

export default function Reports() {
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
    const [results, setResults] = useState<Intern[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);

    const [options, setOptions] = useState<Record<string, string[]>>({});

    useEffect(() => {
        for (const { field } of SEARCH_FIELDS) {
            window.ipcRenderer.invoke('search:distinctValues', { column: field }).then((r) => {
                if (r.success) setOptions((prev) => ({ ...prev, [field]: r.data as string[] }))
            })
        }
    }, []);

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

        const result = await window.ipcRenderer.invoke('search:interns', filters);

        setSearching(false);

        if (result.success) {
            setResults(result.data as Intern[]);
        } else {
            setSearchError(result.error);
            setResults([]);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileBarChart size={24} /> Reports
            </h2>
            <p className="mt-2 text-muted-foreground no-print">View and generate reports.</p>

            <Card className="mt-6 no-print">
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
                                        value={filters[field]}
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
                <p className="mt-4 text-sm text-destructive no-print">{searchError}</p>
            )}

            {results.length > 0 && (
                <Card className="mt-6" id="reports-table">
                    <CardHeader className="py-3 no-print">
                        <CardTitle className="text-base flex items-center justify-between">
                            Results
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                <Printer size={14} />
                                Print
                            </Button>
                        </CardTitle>
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

                        <div className="flex items-center justify-between px-4 py-4 border-t no-print">
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
