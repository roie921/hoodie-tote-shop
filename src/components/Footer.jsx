import { Link } from 'react-router-dom'
import siteInfo from '../data/siteInfo'

const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="border-t border-sand bg-beige">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">{siteInfo.name}</p>
          <p className="mt-3 max-w-xs text-sm text-stone">{siteInfo.description}</p>
        </div>

        <div>
          <p className="text-sm font-medium">Цэс</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            <li><Link to="/" className="hover:text-ink">Нүүр</Link></li>
            <li><Link to="/products" className="hover:text-ink">Бүтээгдэхүүн</Link></li>
            <li><Link to="/cart" className="hover:text-ink">Сагс</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium">Холбоо барих</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            <li>Утас: {siteInfo.phone}</li>
            <li>И-мэйл: {siteInfo.email}</li>
            <li>Хаяг: {siteInfo.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sand py-5 text-center text-xs text-stone">
        © {currentYear} {siteInfo.name}. Бүх эрх хуулиар хамгаалагдсан.
      </div>
    </footer>
  )
}

export default Footer
