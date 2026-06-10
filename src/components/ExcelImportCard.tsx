import { useState, useCallback } from 'react'
import { FileSpreadsheet, Columns3 } from 'lucide-react'
import { useExcelImport } from '@/hooks/useExcelImport'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function ExcelImportCard() {
  const { openFile, importData, filePath, columns, isLoading, error: importError } = useExcelImport()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())

  const handleOpenFile = useCallback(async () => {
    const result = await openFile()
    if (result) {
      setSelectedColumns(new Set(result.columns))
      setDialogOpen(true)
    }
  }, [openFile])

  const toggleColumn = useCallback((col: string, checked: boolean) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(col)
      } else {
        next.delete(col)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedColumns(new Set(columns))
  }, [columns])

  const deselectAll = useCallback(() => {
    setSelectedColumns(new Set())
  }, [])

  const handleImport = useCallback(async () => {
    const result = await importData()
    if (result && !result.error) {
      setImportResult({ imported: result.imported })
      setDialogOpen(false)
    }
  }, [importData])

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet size={20} /> Import from Excel
          </CardTitle>
          <CardDescription>
            Import multiple intern records from an Excel file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Button onClick={handleOpenFile} disabled={isLoading}>
              <FileSpreadsheet />
              {isLoading ? 'Opening...' : 'Select Excel File'}
            </Button>
          </div>

          {importError && (
            <p className="mt-4 text-sm text-destructive">{importError}</p>
          )}

          {importResult && (
            <p className="mt-4 text-sm text-green-600">
              Successfully imported {importResult.imported} intern{importResult.imported !== 1 ? 's' : ''}.
            </p>
          )}

          {filePath && !dialogOpen && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{filePath}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setDialogOpen(true)}
              >
                Change column selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Columns</DialogTitle>
            <DialogDescription>
              Choose which columns to import from {filePath?.split(/[\\/]/).pop()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedColumns.size} of {columns.length} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            <FieldGroup data-slot="checkbox-group">
              {columns.map((col) => (
                <Field orientation="horizontal" key={col}>
                  <Checkbox
                    id={`col-${col}`}
                    checked={selectedColumns.has(col)}
                    onCheckedChange={(checked) =>
                      toggleColumn(col, checked === true)
                    }
                  />
                  <FieldLabel htmlFor={`col-${col}`} className="font-normal">
                    <Item variant="muted" size="sm">
                      <ItemMedia variant="icon">
                        <Columns3 />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{col}</ItemTitle>
                      </ItemContent>
                    </Item>
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleImport} disabled={isLoading}>
              Import Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
