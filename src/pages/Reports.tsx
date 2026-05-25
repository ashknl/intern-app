import { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, FileBarChart, Search, X } from 'lucide-react';
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

const YEAR_OPTIONS = ['1st', '2nd', '3rd', '4th'];
const SECTION_OPTIONS = ['ITC', 'HRD', 'UNIT-1', 'UNIT-2', 'UNIT-3', 'UNIT-4'];

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
            <p className="mt-2 text-muted-foreground">View and generate reports.</p>

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
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Institution Roll</FieldLabel>
                                <Input
                                    type="text"
                                    value={filters.institution_roll}
                                    onChange={(e) => handleChange('institution_roll', e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Guardian Name</FieldLabel>
                                <Input
                                    type="text"
                                    value={filters.guardian_name}
                                    onChange={(e) => handleChange('guardian_name', e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Guardian Relation</FieldLabel>
                                <Input
                                    type="text"
                                    value={filters.guardian_relation}
                                    onChange={(e) => handleChange('guardian_relation', e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Branch</FieldLabel>
                                <Input
                                    type="text"
                                    value={filters.branch}
                                    onChange={(e) => handleChange('branch', e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Year of Study</FieldLabel>
                                <Select
                                    value={filters.year_of_study}
                                    onChange={(e) => handleChange('year_of_study', e.target.value)}
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
                            <Field>
                                <FieldLabel>Section Posted</FieldLabel>
                                <Select
                                    value={filters.section_posted}
                                    onChange={(e) => handleChange('section_posted', e.target.value)}
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
                                    onChange={(e) => handleChange('institution_name', e.target.value)}
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
