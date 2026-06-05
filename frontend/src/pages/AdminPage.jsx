import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

export default function AdminPage() {
  const [preview, setPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResult(null)
    setError(null)
    setPreview([])

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws)

        const products = rows
          .map(row => ({
            name: String(row.name || row.Name || row.NAME || '').trim(),
            description: String(row.description || row.Description || row.DESCRIPTION || '').trim(),
            price: parseFloat(row.price || row.Price || row.PRICE || 0),
            stock: parseInt(row.stock || row.Stock || row.STOCK || 0, 10),
          }))
          .filter(p => p.name && !isNaN(p.price) && p.price >= 0)

        if (products.length === 0) {
          setError('No valid rows found. Make sure the sheet has a "name" and "price" column.')
        } else {
          setPreview(products)
        }
      } catch {
        setError('Failed to parse the file. Please upload a valid Excel or CSV file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const importProducts = async () => {
    if (preview.length === 0) return
    setImporting(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: preview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(`Successfully imported ${data.count} product${data.count !== 1 ? 's' : ''}`)
      setPreview([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin — Import Products</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Upload Excel / CSV File</h2>
        <p className="text-sm text-gray-500 mb-4">
          Required columns:{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">name</code>,{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">price</code>.
          Optional:{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">description</code>,{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">stock</code>.
          Column headers are case-insensitive.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100 cursor-pointer"
        />
      </div>

      {result && (
        <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm mb-6">
          ✓ {result}
        </div>
      )}
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm mb-6">
          {error}
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-800">
              {preview.length} product{preview.length !== 1 ? 's' : ''} ready to import
            </p>
            <button
              onClick={importProducts}
              disabled={importing}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing...' : 'Import All'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Name</th>
                  <th className="px-5 py-3 text-left font-semibold">Description</th>
                  <th className="px-5 py-3 text-right font-semibold">Price</th>
                  <th className="px-5 py-3 text-right font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                      {p.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
