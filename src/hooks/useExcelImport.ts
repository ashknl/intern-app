import { useState } from 'react'

interface ExcelImportResult {
    filePath: string
    columns: string[]
}

interface ImportDataResult {
    imported: number
    error?: string
}

export function useExcelImport() {
    const [filePath, setFilePath] = useState<string | null>(null)
    const [columns, setColumns] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const openFile = async (): Promise<ExcelImportResult | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await window.ipcRenderer.invoke('dialog:openFile')

            if (!result) {
                setIsLoading(false)
                return null
            }

            if (result.error) {
                setError(result.error)
                setIsLoading(false)
                return null
            }

            setFilePath(result.filePath)
            setColumns(result.columns)
            setIsLoading(false)
            return result
        } catch (err) {
            setError(String(err))
            setIsLoading(false)
            return null
        }
    }

    const importData = async (fp?: string): Promise<ImportDataResult> => {
        const targetPath = fp ?? filePath
        if (!targetPath) {
            setError('No file selected')
            return { imported: 0, error: 'No file selected' }
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await window.ipcRenderer.invoke('import:excelData', { filePath: targetPath })

            if (result.error) {
                setError(result.error)
                setIsLoading(false)
                return { imported: 0, error: result.error }
            }

            setIsLoading(false)
            return { imported: result.imported }
        } catch (err) {
            const msg = String(err)
            setError(msg)
            setIsLoading(false)
            return { imported: 0, error: msg }
        }
    }

    return { openFile, importData, filePath, columns, isLoading, error }
}