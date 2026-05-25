import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useDashboardData, type InternRow } from '@/hooks/useDashboardData'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PieChart, Pie, Cell } from 'recharts'

const PIE_COLORS = [
  'hsl(220 80% 60%)',
  'hsl(280 65% 60%)',
  'hsl(340 75% 60%)',
  'hsl(25 90% 55%)',
  'hsl(45 80% 55%)',
  'hsl(145 55% 50%)',
  'hsl(190 70% 50%)',
  'hsl(0 70% 60%)',
]

function buildPieConfig(
  data: { name: string; value: number }[],
): ChartConfig {
  const config: ChartConfig = {}
  data.forEach((item, i) => {
    config[item.name] = {
      label: item.name,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }
  })
  return config
}

const columns: ColumnDef<InternRow>[] = [
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
]

export default function Dashboard() {
  const { interns, metrics, loading, error } = useDashboardData()
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: interns,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return (
      <div className="space-y-6 max-w-screen-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard size={24} /> Dashboard
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-0">
            <Skeleton className="h-64 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-screen-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard size={24} /> Dashboard
          </h2>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (metrics.totalStudents === 0) {
    return (
      <div className="space-y-6 max-w-screen-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard size={24} /> Dashboard
          </h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              No data yet. Import some intern data to see the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const branchConfig = buildPieConfig(metrics.branchDistribution)
  const yearConfig = buildPieConfig(metrics.yearDistribution)

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard size={24} /> Dashboard
        </h2>
        <p className="mt-1 text-muted-foreground">
          Overview of intern data and statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users size={16} />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalStudents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 size={16} />
              Institutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalInstitutions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {metrics.avgDuration}
              <span className="text-base font-normal text-muted-foreground ml-1">
                days
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar size={16} />
              Year Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {metrics.yearRange
                ? `${metrics.yearRange.min} – ${metrics.yearRange.max}`
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Branch Distribution</CardTitle>
            <CardDescription>
              Students grouped by their branch of study
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={branchConfig}>
              <PieChart>
                <Pie
                  data={metrics.branchDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={48}
                  labelLine={false}
                >
                  {metrics.branchDistribution.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Year of Study</CardTitle>
            <CardDescription>
              Students grouped by their academic year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={yearConfig}>
              <PieChart>
                <Pie
                  data={metrics.yearDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={48}
                  labelLine={false}
                >
                  {metrics.yearDistribution.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Interns</CardTitle>
          <CardDescription>
            List of all interns sorted by the most recently added
          </CardDescription>
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
              Page {table.getState().pagination.pageIndex + 1} of{' '}
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
    </div>
  )
}
