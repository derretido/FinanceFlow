import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../lib/api'
import MonthNav from '../components/MonthNav'
import { StatCard, Card, fmtBRL, ProgressBar, Spinner, Button } from '../components/ui'
import toast from 'react-hot-toast'

const COLORS = ['#60a5fa','#34d399','#f87171','#fbbf24','#a78bfa','#f472b6','#818cf8','#fb923c','#2dd4bf','#e879f9','#facc15','#94a3b8']

export default function Dashboard() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData]   = useState(null)
  const [salary, setSalary] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/dashboard/${year}/${month}`)
      setData(r.data)
      setSalary(r.data.budget.salary || '')
    } catch { toast.error('Erro ao carregar dashboard') }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const saveSalary = async () => {
    try {
      await api.put('/budgets', { year, month, salary: parseFloat(salary) || 0 })
      toast.success('Salário salvo!')
      load()
    } catch { toast.error('Erro ao salvar salário') }
  }

  if (loading) return <Spinner />

  const b = data?.budget
  const trend = data?.monthlyTrend || []
  const cats  = data?.categorySummaries || []
  const goals = data?.activeGoals || []
  const unreadAlerts = data?.unreadAlerts || []

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Salário</span>
          <input value={salary} onChange={e => setSalary(e.target.value)} type="number"
            className="w-36 text-right font-mono" placeholder="R$ 0,00" />
          <Button onClick={saveSalary} variant="ghost">Salvar</Button>
        </div>
      </div>

      {/* Alerts banner */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-2">
          {unreadAlerts.slice(0, 3).map(a => (
            <div key={a.id} className={`rounded-xl px-4 py-3 text-sm flex items-start gap-3 border
              ${a.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : a.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}>
              <span className="font-semibold">{a.title}</span>
              <span className="text-white/60">{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Salário" value={fmtBRL(b?.salary)} sub="entrada do mês" icon="💵" accent="#4ade80" />
        <StatCard label="Gastos" value={fmtBRL(b?.totalExpenses)} sub={`${b?.spendingPercent}% do salário`} icon="📤" accent="#f87171" />
        <StatCard label="Investido" value={fmtBRL(b?.totalInvestments)} sub="aporte do mês" icon="💎" accent="#a78bfa" />
        <StatCard label="Saldo livre" value={fmtBRL(b?.balance)} sub="o que sobrou" icon="🏦"
          accent={b?.balance >= 0 ? '#fbbf24' : '#f87171'} />
      </div>

      {/* Spending progress */}
      <Card className="p-5">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Distribuição do salário</div>
        <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
          {b?.salary > 0 && <>
            <div style={{ width: `${Math.min(100, b.spendingPercent)}%`, background: '#f87171' }}
              className="flex items-center justify-center text-xs font-bold text-black/70 transition-all">
              {b.spendingPercent > 8 && `${b.spendingPercent}%`}
            </div>
            <div style={{ width: `${Math.min(100 - b.spendingPercent, b.salary > 0 ? b.totalInvestments / b.salary * 100 : 0)}%`, background: '#a78bfa' }}
              className="flex items-center justify-center text-xs font-bold text-black/70 transition-all">
              {b.salary > 0 && b.totalInvestments / b.salary * 100 > 8 && `${(b.totalInvestments / b.salary * 100).toFixed(0)}%`}
            </div>
            <div className="flex-1 bg-green-500/30" />
          </>}
        </div>
        <div className="flex gap-5 mt-3 text-xs text-gray-500">
          <span><span className="inline-block w-3 h-3 rounded bg-red-400 mr-1.5 align-middle" />Gastos</span>
          <span><span className="inline-block w-3 h-3 rounded bg-purple-400 mr-1.5 align-middle" />Investimentos</span>
          <span><span className="inline-block w-3 h-3 rounded bg-green-500/40 mr-1.5 align-middle" />Saldo livre</span>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <Card className="p-5">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Tendência — 6 meses</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 11 }} />
              <YAxis tick={{ fill: '#555', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
                formatter={v => [fmtBRL(v)]} />
              <Area type="monotone" dataKey="salary"   stroke="#4ade80" fill="url(#gSal)" name="Salário" />
              <Area type="monotone" dataKey="expenses" stroke="#f87171" fill="url(#gExp)" name="Gastos" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card className="p-5">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Gastos por categoria</div>
          {cats.length === 0
            ? <div className="text-center py-16 text-gray-600 text-sm">Sem gastos este mês</div>
            : <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={cats} dataKey="total" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                      {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [fmtBRL(v)]} contentStyle={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 text-xs">
                  {cats.slice(0, 6).map((c, i) => (
                    <div key={c.category.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        {c.category.icon} {c.category.name}
                      </span>
                      <span className="font-mono text-gray-300">{fmtBRL(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card className="p-5">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Comparativo mensal</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trend} barSize={24} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 11 }} />
            <YAxis tick={{ fill: '#555', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8 }}
              formatter={v => [fmtBRL(v)]} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
            <Bar dataKey="expenses"    fill="#f87171" name="Gastos"        radius={[4,4,0,0]} />
            <Bar dataKey="investments" fill="#a78bfa" name="Investimentos" radius={[4,4,0,0]} />
            <Bar dataKey="balance"     fill="#4ade80" name="Saldo"         radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Goals preview */}
      {goals.length > 0 && (
        <Card className="p-5">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Metas ativas</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map(g => (
              <div key={g.id} className="bg-surface2 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{g.icon} {g.name}</span>
                  <span className="font-mono text-xs text-purple-400">{g.progressPercent}%</span>
                </div>
                <ProgressBar value={g.progressPercent} color="#a78bfa" />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{fmtBRL(g.currentAmount)}</span>
                  <span>{fmtBRL(g.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
