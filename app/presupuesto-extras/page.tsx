'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import type { Extra, ExtraWithProgress } from '../lib/types'

export default function ExtrasPage() {
  const [extras, setExtras] = useState<ExtraWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [concepto, setConcepto] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError('Supabase no está configurado. Configura las variables de entorno.')
      setLoading(false)
      return
    }
    loadExtras()
  }, [])

  async function loadExtras() {
    if (!supabase) return
    try {
      const { data, error: err } = await supabase
        .from('extras')
        .select('*')
        .order('concepto')

      if (err) throw err

      const { data: certExtras } = await supabase
        .from('certificacion_extras')
        .select('*')

      const groupedByExtra = (certExtras || []).reduce((acc, ce) => {
        if (!acc[ce.extra_id]) {
          acc[ce.extra_id] = 0
        }
        acc[ce.extra_id] += ce.importe
        return acc
      }, {} as Record<string, number>)

      const extrasWithProgress: ExtraWithProgress[] = (data || []).map((e: Extra) => ({
        ...e,
        importe_certificado: groupedByExtra[e.id] || 0,
      }))

      setExtras(extrasWithProgress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: err } = await supabase.from('extras').insert({
        concepto,
        precio_total: parseFloat(precioTotal),
      })

      if (err) throw err

      setConcepto('')
      setPrecioTotal('')
      setShowForm(false)
      setSuccess('Extra añadido correctamente')
      loadExtras()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    if (!confirm('¿Estás seguro de que quieres eliminar este extra?')) return

    try {
      const { error: err } = await supabase.from('extras').delete().eq('id', id)
      if (err) throw err
      loadExtras()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting')
    }
  }

  const total = extras.reduce((sum, e) => sum + e.precio_total, 0)
  const totalCertificado = extras.reduce((sum, e) => sum + e.importe_certificado, 0)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Presupuesto de Extras</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Añadir Extra'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Nuevo Extra</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Concepto
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
                className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                placeholder="Ej: Instalar aire acondicionado adicional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Importe (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioTotal}
                onChange={(e) => setPrecioTotal(e.target.value)}
                required
                className="w-full p-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                placeholder="Ej: 2500.00"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Extra'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Extras</p>
          <p className="text-2xl font-bold">{total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 mb-1">Total Certificado</p>
          <p className="text-2xl font-bold">{totalCertificado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
      </div>

      {extras.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>No hay extras configurados.</p>
          <p className="text-sm mt-2">Añade los extras de la obra.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left p-4 font-medium text-zinc-600">Concepto</th>
                <th className="text-right p-4 font-medium text-zinc-600">Importe</th>
                <th className="text-right p-4 font-medium text-zinc-600">Certificado</th>
                <th className="text-center p-4 font-medium text-zinc-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((extra, index) => (
                <tr key={extra.id} className={`border-b border-zinc-100 ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}`}>
                  <td className="p-4">
                    <Link href={`/presupuesto-extras/${extra.id}`} className="text-blue-600 hover:underline">
                      {extra.concepto}
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    {extra.precio_total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="p-4 text-right">
                    {extra.importe_certificado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(extra.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 font-medium">
              <tr>
                <td className="p-4">TOTAL</td>
                <td className="p-4 text-right">{total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                <td className="p-4 text-right">{totalCertificado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                <td className="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
