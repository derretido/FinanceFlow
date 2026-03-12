import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import MonthNav from '../components/MonthNav'
import { Card, Button, Modal, FormField, Badge, fmtBRL, Empty, Spinner } from '../components/ui'
import { Plus, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = { description: '', amount: '', date: new Date().toISOString().slice(0,10), categoryId: '', isRecurring: false }

export default function Expenses() {
  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(empty)
  const [editing, setEditing] = useState(null)
  const [catFilter, setCatFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/expenses', { params: { year, month, categoryId: catFilter || undefined } }),
        api.get('/categories')
      ])
      setExpenses(eRes.data)
      setCategories(cRes.data)
    } catch { toast.error('Erro ao carregar gastos') }
    finally { setLoading(false) }
  }, [year, month, catFilter])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setEditing(null); setForm(empty); setModal(true) }
  const openEdit = e  => {
    setEditing(e.id)
    setForm({ description: e.description, amount: e.amount, date: e.date, categoryId: e.category.id, isRecurring: e.isRecurring })
    setModal(true)
  }

  const save = async () => {
    if (!form.description || !form.amount || !form.date || !form.categoryId)
      return toast.error('Preencha todos os campos')
    try {
      const payload = { ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }
      if (editing) await api.put(`/expenses/${editing}`, payload)
      else         await api.post('/expenses', payload)
      toast.success(editing ? 'Gasto atualizado!' : 'Gasto adicionado!')
      setModal(false); load()
    } catch { toast.error('Erro ao salvar gasto') }
  }

  const del = async id => {
    if (!confirm('Remover este gasto?')) return
    await api.delete(`/expenses/${id}`)
    toast.success('Removido!')
    load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MonthNav year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
        <div className="flex gap-3 items-center">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-44 text-sm">
            <option value="">Todas categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <Button onClick={openNew}><Plus size={15} /> Adicionar</Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex gap-4 text-sm">
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <span className="text-gray-500">Total: </span>
          <span className="font-mono text-red-400 font-medium">{fmtBRL(total)}</span>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <span className="text-gray-500">Lançamentos: </span>
          <span className="font-mono text-white font-medium">{expenses.length}</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? <Spinner /> : expenses.length === 0 ? <Empty icon="📭" message="Nenhum gasto lançado ainda" /> : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface2">
                {['Descrição','Categoria','Valor','Data','Recorrente',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-t border-border hover:bg-surface2/50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-sm">{e.description}</td>
                  <td className="px-4 py-3.5">
                    <Badge color={e.category.color}>{e.category.icon} {e.category.name}</Badge>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-sm text-red-400">{fmtBRL(e.amount)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                    {e.date.split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {e.isRecurring && <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">Fixo</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => del(e.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar gasto' : 'Novo gasto'}>
        <div className="flex flex-col gap-4">
          <FormField label="Descrição">
            <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Ex: Aluguel, Mercado..." />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor (R$)">
              <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0,00" min="0" step="0.01" />
            </FormField>
            <FormField label="Data">
              <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
            </FormField>
          </div>
          <FormField label="Categoria">
            <select value={form.categoryId} onChange={e => setForm(f => ({...f, categoryId: e.target.value}))}>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({...f, isRecurring: e.target.checked}))} className="w-4 h-4" />
            Gasto recorrente (mensal)
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} className="flex-1 justify-center">Salvar</Button>
            <Button onClick={() => setModal(false)} variant="ghost">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
