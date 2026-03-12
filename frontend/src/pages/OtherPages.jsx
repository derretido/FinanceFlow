// ── Investments ──────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import MonthNav from '../components/MonthNav'
import { Card, Button, Modal, FormField, fmtBRL, Empty, Spinner } from '../components/ui'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProgressBar } from '../components/ui'

const TYPES = ['Renda Fixa','Renda Variável','Criptomoeda','Fundo Imobiliário','Poupança','Outros']
const invEmpty = { name: '', type: 'Renda Fixa', amount: '', date: new Date().toISOString().slice(0,10) }

export function Investments() {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(invEmpty)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/investments', { params: { year, month } })
      setList(r.data)
    } catch { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name || !form.amount) return toast.error('Preencha todos os campos')
    try {
      await api.post('/investments', { ...form, amount: parseFloat(form.amount) })
      toast.success('Investimento adicionado!')
      setModal(false); load()
    } catch { toast.error('Erro ao salvar') }
  }

  const del = async id => {
    if (!confirm('Remover?')) return
    await api.delete(`/investments/${id}`)
    toast.success('Removido!')
    load()
  }

  const total = list.reduce((s, i) => s + i.amount, 0)

  const typeColor = { 'Renda Fixa': '#4ade80', 'Renda Variável': '#60a5fa', 'Criptomoeda': '#fbbf24',
    'Fundo Imobiliário': '#a78bfa', 'Poupança': '#34d399', 'Outros': '#94a3b8' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MonthNav year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m) }} />
        <Button onClick={() => { setForm(invEmpty); setModal(true) }}><Plus size={15} /> Adicionar</Button>
      </div>

      <div className="bg-surface border border-border rounded-xl px-4 py-3 inline-flex gap-6 text-sm">
        <div><span className="text-gray-500">Total aportado: </span>
          <span className="font-mono text-purple-400 font-medium">{fmtBRL(total)}</span></div>
        <div><span className="text-gray-500">Aportes: </span>
          <span className="font-mono font-medium">{list.length}</span></div>
      </div>

      {loading ? <Spinner /> : list.length === 0 ? <Empty icon="📈" message="Nenhum investimento cadastrado" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(i => (
            <Card key={i.id} accent={typeColor[i.type] || '#888'} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{i.type}</div>
                </div>
                <button onClick={() => del(i.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="font-mono text-xl" style={{ color: typeColor[i.type] || '#888' }}>{fmtBRL(i.amount)}</div>
              <div className="text-xs text-gray-600 mt-1">{i.date.split('-').reverse().join('/')}</div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo investimento">
        <div className="flex flex-col gap-4">
          <FormField label="Nome"><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Tesouro Direto, CDB..." /></FormField>
          <FormField label="Tipo">
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor (R$)"><input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} /></FormField>
            <FormField label="Data"><input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} className="flex-1 justify-center">Salvar</Button>
            <Button onClick={() => setModal(false)} variant="ghost">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Goals ─────────────────────────────────────────────────────────────────────
const goalEmpty = { name: '', icon: '🎯', targetAmount: '', deadline: '' }

export function Goals() {
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [depositModal, setDepositModal] = useState(null)
  const [depositAmt, setDepositAmt] = useState('')
  const [form, setForm]     = useState(goalEmpty)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/goals'); setList(r.data) }
    catch { toast.error('Erro ao carregar metas') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.targetAmount) return toast.error('Preencha nome e valor')
    try {
      await api.post('/goals', { ...form, targetAmount: parseFloat(form.targetAmount), deadline: form.deadline || null })
      toast.success('Meta criada!'); setModal(false); load()
    } catch { toast.error('Erro ao salvar') }
  }

  const deposit = async () => {
    if (!depositAmt || isNaN(depositAmt)) return toast.error('Valor inválido')
    try {
      await api.post(`/goals/${depositModal}/deposit`, { amount: parseFloat(depositAmt) })
      toast.success('Depósito realizado!'); setDepositModal(null); setDepositAmt(''); load()
    } catch { toast.error('Erro ao depositar') }
  }

  const del = async id => {
    if (!confirm('Remover meta?')) return
    await api.delete(`/goals/${id}`); toast.success('Removida!'); load()
  }

  const ICONS = ['🎯','🏠','🚗','✈️','💍','📱','💻','🎓','🏖️','💰','🏋️','🎮']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-accent">Metas de Economia</h1>
        <Button onClick={() => { setForm(goalEmpty); setModal(true) }}><Plus size={15} /> Nova meta</Button>
      </div>

      {loading ? <Spinner /> : list.length === 0 ? <Empty icon="🎯" message="Nenhuma meta cadastrada" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {list.map(g => {
            const pct = Math.min(100, g.progressPercent)
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <div className="font-semibold">{g.name}</div>
                      {g.deadline && <div className="text-xs text-gray-500 mt-0.5">até {g.deadline.split('-').reverse().join('/')}</div>}
                      {g.isCompleted && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md">Concluída ✓</span>}
                    </div>
                  </div>
                  <button onClick={() => del(g.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
                <ProgressBar value={pct} color={pct >= 100 ? '#4ade80' : '#a78bfa'} className="mb-3" />
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span className="font-mono">{fmtBRL(g.currentAmount)}</span>
                  <span className="font-mono font-bold" style={{ color: pct >= 100 ? '#4ade80' : '#a78bfa' }}>{pct}%</span>
                  <span className="font-mono">{fmtBRL(g.targetAmount)}</span>
                </div>
                {!g.isCompleted && (
                  <Button onClick={() => setDepositModal(g.id)} variant="ghost" className="w-full justify-center text-xs py-1.5">
                    + Depositar
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nova meta">
        <div className="flex flex-col gap-4">
          <FormField label="Ícone">
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({...f, icon: ic}))}
                  className={`text-2xl p-2 rounded-lg transition-colors ${form.icon === ic ? 'bg-accent/20 ring-1 ring-accent' : 'bg-surface2 hover:bg-white/10'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Nome"><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Viagem, Carro..." /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Meta (R$)"><input type="number" value={form.targetAmount} onChange={e => setForm(f => ({...f, targetAmount: e.target.value}))} /></FormField>
            <FormField label="Prazo (opcional)"><input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} /></FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} className="flex-1 justify-center">Criar meta</Button>
            <Button onClick={() => setModal(false)} variant="ghost">Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Depositar na meta">
        <div className="flex flex-col gap-4">
          <FormField label="Valor (R$)">
            <input type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} placeholder="0,00" autoFocus />
          </FormField>
          <div className="flex gap-3">
            <Button onClick={deposit} variant="success" className="flex-1 justify-center">Depositar</Button>
            <Button onClick={() => setDepositModal(null)} variant="ghost">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function Alerts() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/alerts'); setList(r.data) }
    catch { toast.error('Erro ao carregar alertas') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async id => {
    await api.patch(`/alerts/${id}/read`); load()
  }

  const markAll = async () => {
    await api.patch('/alerts/read-all'); toast.success('Todos lidos!'); load()
  }

  const typeStyles = {
    danger:  { border: 'border-red-500/40',    bg: 'bg-red-500/5',    text: 'text-red-300',    dot: 'bg-red-500' },
    warning: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', text: 'text-yellow-300', dot: 'bg-yellow-500' },
    info:    { border: 'border-blue-500/40',   bg: 'bg-blue-500/5',   text: 'text-blue-300',   dot: 'bg-blue-500' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-accent">Alertas</h1>
        {list.some(a => !a.isRead) && (
          <Button onClick={markAll} variant="ghost" className="text-xs">Marcar todos como lidos</Button>
        )}
      </div>

      {loading ? <Spinner /> : list.length === 0 ? <Empty icon="🔔" message="Nenhum alerta por enquanto" /> : (
        <div className="flex flex-col gap-3">
          {list.map(a => {
            const s = typeStyles[a.type] || typeStyles.info
            return (
              <div key={a.id} className={`rounded-xl border p-4 flex items-start gap-4 transition-opacity ${s.border} ${s.bg} ${a.isRead ? 'opacity-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.isRead ? 'bg-gray-600' : s.dot}`} />
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${s.text}`}>{a.title}</div>
                  <div className="text-gray-400 text-sm mt-0.5">{a.message}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(a.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
                {!a.isRead && (
                  <button onClick={() => markRead(a.id)} className="text-xs text-gray-500 hover:text-white whitespace-nowrap">
                    Marcar lido
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
