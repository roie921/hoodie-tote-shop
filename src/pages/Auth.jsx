import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const inputClass = 'mt-1 w-full rounded-lg border border-sand bg-white px-4 py-3 outline-none focus:border-ink'

function authError(error) {
  const text = (error?.message || '').toLowerCase()
  if (text.includes('invalid login credentials')) return 'И-мэйл эсвэл нууц үг буруу байна.'
  if (text.includes('already registered') || text.includes('already been registered')) return 'Энэ имэйлээр бүртгэл аль хэдийн байна.'
  if (text.includes('password')) return 'Нууц үг шаардлага хангахгүй байна (6-аас доошгүй тэмдэгт).'
  if (text.includes('rate limit')) return 'Олон удаа оролдлоо. Түр хугацааны дараа дахин оролдоно уу.'
  return error?.message || 'Алдаа гарлаа. Дахин оролдоно уу.'
}

export default function Auth({ mode = 'login' }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  if (user) return <Navigate to="/" replace />
  const update = e => setForm(current => ({ ...current, [e.target.name]: e.target.value }))
  const submit = async e => {
    e.preventDefault()
    setError(''); setMessage('')
    if (isRegister && form.password !== form.confirm) return setError('Нууц үгүүд хоорондоо таарахгүй байна.')
    if (form.password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгт байна.')
    setBusy(true)
    try {
      if (isRegister) {
        const { data, error: issue } = await supabase.auth.signUp({
          email: form.email.trim(), password: form.password,
          options: { data: { full_name: form.fullName.trim(), phone: form.phone.trim() } },
        })
        if (issue) throw issue
        if (!data.session) setMessage('Бүртгэл үүслээ. Имэйл баталгаажуулалт идэвхтэй байгаа бол имэйлээ шалгана уу.')
        else navigate(location.state?.from || '/', { replace: true })
      } else {
        const { error: issue } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
        if (issue) throw issue
        navigate(location.state?.from || '/', { replace: true })
      }
    } catch (issue) { setError(authError(issue)) }
    finally { setBusy(false) }
  }
  return <main className="mx-auto max-w-md px-6 py-16">
    <h1 className="text-center text-3xl font-semibold">{isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</h1>
    <p className="mt-3 text-center text-stone">AG · Худи болон даавуун цүнхний захиалга</p>
    <form className="mt-8 space-y-4" onSubmit={submit}>
      {isRegister && <><label className="block text-sm">Нэр<input required maxLength="100" name="fullName" value={form.fullName} onChange={update} className={inputClass}/></label>
        <label className="block text-sm">Утасны дугаар<input name="phone" type="tel" maxLength="20" value={form.phone} onChange={update} className={inputClass}/></label></>}
      <label className="block text-sm">И-мэйл<input required name="email" type="email" autoComplete="email" value={form.email} onChange={update} className={inputClass}/></label>
      <label className="block text-sm">Нууц үг<input required name="password" type="password" minLength="6" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={update} className={inputClass}/></label>
      {isRegister && <label className="block text-sm">Нууц үг давтах<input required name="confirm" type="password" minLength="6" value={form.confirm} onChange={update} className={inputClass}/></label>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-ink px-5 py-3 text-white disabled:opacity-50">{busy ? 'Түр хүлээнэ үү...' : isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</button>
    </form>
    <div className="mt-6 flex flex-col items-center gap-4 text-sm">
      <Link to={isRegister ? '/login' : '/register'} className="underline">{isRegister ? 'Бүртгэлтэй юу? Нэвтрэх' : 'Бүртгэлгүй юу? Бүртгүүлэх'}</Link>
      <Link to="/" className="text-stone underline">Зочноор үргэлжлүүлэх</Link>
    </div>
  </main>
}
