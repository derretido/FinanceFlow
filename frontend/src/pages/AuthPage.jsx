import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      nav('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao autenticar')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-accent">controle</h1>
          <p className="text-gray-500 text-sm mt-1 font-light">financeiro pessoal</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {/* Tab switcher */}
          <div className="flex bg-surface2 rounded-lg p-1 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
                  ${mode === m ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}>
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 bg-accent text-black font-semibold py-2.5 rounded-lg text-sm hover:opacity-85 transition-opacity disabled:opacity-50">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
