import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import siteInfo from '../data/siteInfo'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const navLinks = [
  { to: '/', label: 'Нүүр' },
  { to: '/products', label: 'Бүтээгдэхүүн' },
  { to: '/cart', label: 'Сагс' },
]
export default function Navbar() {
  const [menuOpen,setMenuOpen] = useState(false)
  const { totalCount } = useCart()
  const { user,isAdmin,profile } = useAuth()
  const navigate = useNavigate()
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) { window.alert('Гарахад алдаа гарлаа: ' + error.message); return }
    setMenuOpen(false)
    navigate('/')
  }
  const linkClass = ({isActive}) => `text-sm transition hover:text-ink ${isActive ? 'font-medium text-ink' : 'text-stone'}`
  const links = <>
    {navLinks.map(link=><NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass} onClick={()=>setMenuOpen(false)}>{link.label}{link.to === '/cart' && totalCount > 0 && ` (${totalCount})`}</NavLink>)}
    {isAdmin && <NavLink to="/admin/products" className={linkClass} onClick={()=>setMenuOpen(false)}>Удирдлага</NavLink>}
    {user ? <><span className="text-sm text-stone">{profile?.full_name || user.email}</span><button type="button" onClick={logout} className="text-left text-sm underline">Гарах</button></> : <><NavLink to="/login" className={linkClass} onClick={()=>setMenuOpen(false)}>Нэвтрэх</NavLink><NavLink to="/register" className="rounded-lg bg-ink px-4 py-2 text-sm text-white" onClick={()=>setMenuOpen(false)}>Бүртгүүлэх</NavLink></>}
  </>
  return <header className="sticky top-0 z-30 border-b border-sand bg-white">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
      <Link to="/" className="text-lg font-semibold tracking-wide">{siteInfo.name}</Link>
      <nav className="hidden items-center gap-7 md:flex">{links}</nav>
      <button type="button" aria-label={menuOpen?'Цэс хаах':'Цэс нээх'} className="md:hidden" onClick={()=>setMenuOpen(!menuOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={menuOpen?'M6 6l12 12M18 6L6 18':'M4 7h16M4 12h16M4 17h16'} /></svg>
      </button>
    </div>
    {menuOpen && <nav className="flex flex-col gap-4 border-t border-sand px-6 py-4 md:hidden">{links}</nav>}
  </header>
}
