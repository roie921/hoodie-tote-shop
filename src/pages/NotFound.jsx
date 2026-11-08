import { Link } from 'react-router-dom'
import { primaryButton } from '../utils/styles'

function NotFound() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Хуудас олдсонгүй</h1>
      <p className="mt-2 text-stone">Таны хайсан хуудас байхгүй эсвэл устгагдсан байна.</p>
      <Link to="/" className={`mt-8 inline-block ${primaryButton}`}>
        Нүүр хуудас руу буцах
      </Link>
    </main>
  )
}

export default NotFound
