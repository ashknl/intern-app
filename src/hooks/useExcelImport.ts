import { useState } from 'react'

interface ExcelImportResult {
    filePath: string
    columns: string[]
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

    return { openFile, filePath, columns, isLoading, error }
}