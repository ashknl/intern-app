import { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, FileBarChart, Printer } from 'lucide-react';
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import type { Intern } from '@/lib/IIntern';
import { Button } from '@/components/ui/button';
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
import SearchFilters, { EMPTY_FILTERS } from '@/components/SearchFilters';

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

            <div className="no-print">
                <SearchFilters
                    filters={filters}
                    onFilterChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
                    onSearch={handleSearch}
                    onClear={handleClear}
                    searching={searching}
                />
            </div>

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
