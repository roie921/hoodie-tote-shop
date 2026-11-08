import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="mx-auto max-w-5xl px-6 py-20">Түр хүлээнэ үү...</main>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && !isAdmin) return <main className="mx-auto max-w-5xl px-6 py-20"><h1 className="text-2xl font-semibold">Хандах эрх хүрэлцэхгүй байна</h1><p className="mt-3 text-stone">Энэ хуудсанд зөвхөн админ нэвтэрнэ.</p></main>
  return children
}
