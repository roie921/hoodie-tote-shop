import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import siteInfo from '../data/siteInfo'
import { useCart } from '../context/CartContext'

const navLinks = [
  { to: '/', label: 'Нүүр' },
  { to: '/products', label: 'Бүтээгдэхүүн' },
  { to: '/cart', label: 'Сагс' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalCount } = useCart()

  const linkClass = ({ isActive }) =>
    `text-sm transition hover:text-ink ${isActive ? 'font-medium text-ink' : 'text-stone'}`

  return (
    <header className="sticky top-0 z-30 border-b border-sand bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold tracking-wide">
          {siteInfo.name}
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
              {link.to === '/cart' && totalCount > 0 && ` (${totalCount})`}
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={menuOpen ? 'Цэс хаах' : 'Цэс нээх'}
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile links */}
      {menuOpen && (
        <nav className="flex flex-col gap-4 border-t border-sand px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={linkClass}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              {link.to === '/cart' && totalCount > 0 && ` (${totalCount})`}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Navbar
