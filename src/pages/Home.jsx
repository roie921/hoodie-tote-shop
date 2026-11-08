import { Link } from 'react-router-dom'
import ProductMockup from '../components/ProductMockup'
import { primaryButton, secondaryButton } from '../utils/styles'

const steps = [
  { number: '01', title: 'Бүтээгдэхүүнээ сонгоно', text: 'Өөрт тохирсон худи эсвэл даавуун цүнхээ сонгоно.' },
  { number: '02', title: 'Загвараа оруулна', text: 'Лого, зургаа оруулаад хүссэн байрлал, хэмжээгээр нь тохируулна.' },
  { number: '03', title: 'Бид үйлдвэрлэж хүргэнэ', text: 'Манай цех таны захиалгыг хийж гүйцэтгэнэ.' },
]

const categories = [
  { id: 'hoodie', name: 'Худи', category: 'hoodie', colorHex: '#e2d6c2' },
  { id: 'tote', name: 'Даавуун цүнх', category: 'tote', colorHex: '#eadfca' },
]

function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-beige">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone">
              Захиалгат хувцас, даавуун бүтээгдэхүүн
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              Санаагаа өмс.
              <br />
              Брэндээ авч яв.
            </h1>
            <p className="mt-6 max-w-md text-lg text-stone">
              Өөрийн лого, зургаар хийсэн өндөр чанартай худи болон даавуун цүнхийг
              манай цехэд бүтээнэ.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className={primaryButton}>
                Худалдаж авах
              </Link>
              <Link to="/products" className={secondaryButton}>
                Загвараа бүтээх
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <ProductMockup category="hoodie" colorHex="#1c1c1c" alt="Хар худи" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-2xl font-semibold md:text-3xl">Ангилалаар үзэх</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {categories.map((item) => (
            <Link
              key={item.id}
              to={`/products?category=${item.id}`}
              className="group rounded-2xl bg-sand p-8 transition hover:bg-beige"
            >
              <div className="mx-auto w-full max-w-xs">
                <ProductMockup category={item.category} colorHex={item.colorHex} alt={item.name} />
              </div>
              <h3 className="mt-4 text-2xl font-semibold">{item.name}</h3>
              <span className="mt-1 inline-block text-sm text-stone transition group-hover:translate-x-1">
                Үзэх →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-2xl font-semibold md:text-3xl">Хэрхэн захиалах вэ</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <p className="text-sm text-white/50">{step.number}</p>
                <h3 className="mt-2 text-xl font-medium">{step.title}</h3>
                <p className="mt-2 text-white/70">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
