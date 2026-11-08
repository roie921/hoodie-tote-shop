import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Canvas, FabricImage } from 'fabric'
import Notice from '../components/Notice'
import ProductMockup from '../components/ProductMockup'
import ProductOptions from '../components/ProductOptions'
import { useCart } from '../context/CartContext'
import { useDesigns } from '../context/DesignContext'
import { useProducts } from '../context/ProductContext'
import useProductOptions, { buildOptionsQuery } from '../hooks/useProductOptions'
import { CANVAS_HEIGHT, CANVAS_WIDTH, getMockupImage, getPrintArea } from '../utils/mockups'
import { primaryButton, secondaryButton } from '../utils/styles'

const SIDES = [
  { id: 'front', label: 'Урд тал' },
  { id: 'back', label: 'Ар тал' },
]

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function isAllowedFile(file) {
  if (ALLOWED_TYPES.includes(file.type)) return true
  // Some browsers leave the type empty, so check the file extension too.
  return file.type === '' && /\.(png|jpe?g|svg)$/i.test(file.name)
}

// Makes the selection handles easier to see and use.
function styleObject(object) {
  object.set({
    cornerSize: 12,
    touchCornerSize: 28,
    transparentCorners: false,
    cornerColor: '#111111',
    cornerStyle: 'circle',
    borderColor: '#111111',
    padding: 4,
  })
  // Only the corner handles are used, so the image keeps its proportions.
  object.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false })
  object.setCoords()
}

// Converts any angle to the range -180..180 for the rotation slider.
function normalizeAngle(angle) {
  const value = ((angle % 360) + 360) % 360
  return Math.round(value > 180 ? value - 360 : value)
}

// Exports only the uploaded images as a transparent PNG (no product mockup).
function exportSide(canvas, multiplier) {
  if (!canvas || canvas.getObjects().length === 0) return null
  return canvas.toDataURL({ format: 'png', multiplier })
}

// Finds the product from the URL, then shows the editor.
function DesignEditor() {
  const { productId } = useParams()
  const { getProductById, loading, error } = useProducts()
  const product = getProductById(productId)

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-24">Бүтээгдэхүүн ачаалж байна...</main>
  if (error) return <main className="mx-auto max-w-7xl px-6 py-24 text-red-700">Өгөгдөл татахад алдаа гарлаа: {error}</main>

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Бүтээгдэхүүн олдсонгүй</h1>
        <Link to="/products" className={`mt-8 inline-block ${primaryButton}`}>
          Бүтээгдэхүүн рүү буцах
        </Link>
      </main>
    )
  }

  return <DesignEditorContent key={product.id} product={product} />
}

function DesignEditorContent({ product }) {
  const [searchParams] = useSearchParams()
  const options = useProductOptions(product, {
    colorId: searchParams.get('color'),
    size: searchParams.get('size'),
    quantity: searchParams.get('quantity'),
  })
  const { designs, saveDesign } = useDesigns()
  const { addItem } = useCart()

  const [activeSide, setActiveSide] = useState('front')
  const [notice, setNotice] = useState(null)
  const [selected, setSelected] = useState(null) // { width, angle } or null
  const [previews, setPreviews] = useState({ front: null, back: null })

  const stageRef = useRef(null) // the box that is measured for responsive size
  const canvasLayerRef = useRef(null) // Fabric canvases are added in here
  const fileInputRef = useRef(null)
  const canvasesRef = useRef({}) // { front: Canvas, back: Canvas }
  const hostsRef = useRef({}) // { front: div, back: div }
  const initialDesignRef = useRef(designs[product.id]) // design saved before opening

  // Updates the live preview images from both canvases.
  const refreshPreviews = useCallback(() => {
    const { front, back } = canvasesRef.current
    if (!front || !back) return
    setPreviews({ front: exportSide(front, 0.5), back: exportSide(back, 0.5) })
  }, [])

  // Create the two Fabric canvases (front and back) once.
  useEffect(() => {
    const layer = canvasLayerRef.current
    const stage = stageRef.current
    const created = {}
    const hosts = {}
    const state = { cancelled: false }

    SIDES.forEach(({ id }) => {
      const host = document.createElement('div')
      const element = document.createElement('canvas')
      host.appendChild(element)
      layer.appendChild(host)
      hosts[id] = host

      const canvas = new Canvas(element, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        selection: false,
        preserveObjectStacking: true,
      })

      const syncSelection = () => {
        const object = canvas.getActiveObject()
        setSelected(
          object
            ? { width: Math.round(object.getScaledWidth()), angle: normalizeAngle(object.angle) }
            : null
        )
      }

      canvas.on('selection:created', syncSelection)
      canvas.on('selection:updated', syncSelection)
      canvas.on('selection:cleared', () => setSelected(null))
      canvas.on('object:scaling', syncSelection)
      canvas.on('object:rotating', syncSelection)
      canvas.on('object:modified', () => {
        syncSelection()
        refreshPreviews()
      })
      canvas.on('object:added', refreshPreviews)
      canvas.on('object:removed', refreshPreviews)

      created[id] = canvas
    })

    canvasesRef.current = created
    hostsRef.current = hosts

    // Keep the canvases the same size as the product box (CSS size only).
    const applySize = () => {
      const width = Math.min(stage.clientWidth, CANVAS_WIDTH)
      const height = (width * CANVAS_HEIGHT) / CANVAS_WIDTH
      Object.values(created).forEach((canvas) => {
        canvas.setDimensions({ width: `${width}px`, height: `${height}px` }, { cssOnly: true })
      })
    }
    applySize()
    const observer = new ResizeObserver(applySize)
    observer.observe(stage)

    // Restore a design that was saved earlier.
    const savedJson = initialDesignRef.current ? initialDesignRef.current.json : null
    if (savedJson) {
      SIDES.forEach(({ id }) => {
        if (!savedJson[id]) return
        created[id]
          .loadFromJSON(savedJson[id])
          .then(() => {
            if (state.cancelled) return
            created[id].getObjects().forEach(styleObject)
            created[id].requestRenderAll()
            refreshPreviews()
          })
          .catch(() => {
            if (!state.cancelled) {
              setNotice({ type: 'error', text: 'Хадгалсан загварыг ачаалж чадсангүй.' })
            }
          })
      })
    }

    return () => {
      state.cancelled = true
      observer.disconnect()
      Object.values(created).forEach((canvas) => {
        const result = canvas.dispose()
        if (result && result.catch) result.catch(() => {})
      })
      Object.values(hosts).forEach((host) => host.remove())
      canvasesRef.current = {}
      hostsRef.current = {}
    }
  }, [refreshPreviews])

  // Show only the canvas of the active side.
  useEffect(() => {
    Object.entries(hostsRef.current).forEach(([id, host]) => {
      host.style.display = id === activeSide ? 'block' : 'none'
    })
    Object.values(canvasesRef.current).forEach((canvas) => {
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    })
  }, [activeSide])

  const getActiveCanvas = () => canvasesRef.current[activeSide]

  // ---------- Upload ----------

  const addImageToCanvas = async (dataUrl) => {
    const canvas = getActiveCanvas()
    if (!canvas) return

    try {
      const image = await FabricImage.fromURL(dataUrl)
      if (!image.width || !image.height) {
        throw new Error('Image has no size')
      }

      // Fit the image inside the print area and place it in the center.
      const area = getPrintArea(product.category, activeSide)
      const scale = Math.min((area.width * 0.7) / image.width, (area.height * 0.7) / image.height)
      image.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: area.x + area.width / 2,
        top: area.y + area.height / 2,
      })
      styleObject(image)

      canvas.add(image)
      canvas.setActiveObject(image)
      canvas.requestRenderAll()
      setNotice({ type: 'success', text: 'Зураг амжилттай орууллаа.' })
    } catch {
      setNotice({ type: 'error', text: 'Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.' })
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0]
    event.target.value = '' // allows choosing the same file again
    if (!file) return

    if (!isAllowedFile(file)) {
      setNotice({ type: 'error', text: 'Зөвхөн PNG, JPG эсвэл SVG форматын зураг оруулна уу.' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setNotice({ type: 'error', text: 'Зургийн хэмжээ 5 МБ-аас хэтрэхгүй байх ёстой.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => addImageToCanvas(reader.result)
    reader.onerror = () => {
      setNotice({ type: 'error', text: 'Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.' })
    }
    reader.readAsDataURL(file)
  }

  // ---------- Resize, rotate, delete ----------

  const handleScaleChange = (event) => {
    const canvas = getActiveCanvas()
    const object = canvas && canvas.getActiveObject()
    if (!object) return

    const scale = Number(event.target.value) / object.width
    object.set({ scaleX: scale, scaleY: scale })
    object.setCoords()
    canvas.requestRenderAll()
    canvas.fire('object:modified', { target: object })
  }

  const handleRotateChange = (event) => {
    const canvas = getActiveCanvas()
    const object = canvas && canvas.getActiveObject()
    if (!object) return

    object.set({ angle: Number(event.target.value) })
    object.setCoords()
    canvas.requestRenderAll()
    canvas.fire('object:modified', { target: object })
  }

  const handleDelete = () => {
    const canvas = getActiveCanvas()
    if (!canvas) return
    const objects = canvas.getActiveObjects()
    if (objects.length === 0) return

    objects.forEach((object) => canvas.remove(object))
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    setNotice({ type: 'success', text: 'Зураг устгагдлаа.' })
  }

  // ---------- Reset, save, add to cart ----------

  const handleReset = () => {
    Object.values(canvasesRef.current).forEach((canvas) => {
      canvas.discardActiveObject()
      canvas.clear()
      canvas.requestRenderAll()
    })
    setSelected(null)
    refreshPreviews()
    setNotice({ type: 'success', text: 'Загвар шинэчлэгдлээ.' })
  }

  const buildDesign = () => {
    const { front, back } = canvasesRef.current
    return {
      json: { front: front.toJSON(), back: back.toJSON() },
      images: { front: exportSide(front, 1), back: exportSide(back, 1) },
    }
  }

  const handleSave = () => {
    saveDesign(product.id, buildDesign())
    setNotice({ type: 'success', text: 'Загвар амжилттай хадгалагдлаа.' })
  }

  const handleAddToCart = () => {
    const design = buildDesign()
    saveDesign(product.id, design)
    const hasDesign = design.images.front || design.images.back
    addItem(product, options, hasDesign ? design.images : null)
    setNotice({ type: 'success', text: 'Бүтээгдэхүүн сагсанд нэмэгдлээ.' })
  }

  // ---------- Layout ----------

  const area = getPrintArea(product.category, activeSide)
  const guideStyle = {
    left: `${(area.x / CANVAS_WIDTH) * 100}%`,
    top: `${(area.y / CANVAS_HEIGHT) * 100}%`,
    width: `${(area.width / CANVAS_WIDTH) * 100}%`,
    height: `${(area.height / CANVAS_HEIGHT) * 100}%`,
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link
        to={`/products/${product.id}?${buildOptionsQuery(options)}`}
        className="text-sm text-stone transition hover:text-ink"
      >
        ← Бүтээгдэхүүн рүү буцах
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Загвар засварлагч</h1>
      <p className="mt-1 text-stone">{product.name}</p>

      <div className="mt-4">
        <Notice notice={notice} />
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Editor canvas */}
        <div>
          <div className="mb-4 flex gap-3">
            {SIDES.map((side) => (
              <button
                key={side.id}
                type="button"
                onClick={() => setActiveSide(side.id)}
                className={`rounded-full border px-5 py-2 text-sm transition ${
                  activeSide === side.id ? 'border-ink bg-ink text-white' : 'border-sand hover:border-ink'
                }`}
              >
                {side.label}
              </button>
            ))}
          </div>

          <div
            ref={stageRef}
            className="relative mx-auto aspect-[6/7] w-full max-w-[600px] overflow-hidden rounded-2xl bg-beige"
          >
            <img
              src={getMockupImage(product.category, activeSide, options.color.hex)}
              alt={`${product.name}, ${activeSide === 'front' ? 'урд тал' : 'ар тал'}`}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
            <div
              className="pointer-events-none absolute border border-dashed border-stone"
              style={guideStyle}
            />
            <div ref={canvasLayerRef} className="absolute inset-0" />
          </div>
          <p className="mx-auto mt-3 max-w-[600px] text-sm text-stone">
            Тасархай шугамын дотор зургаа байрлуулбал хэвлэхэд хамгийн тохиромжтой.
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <div>
            <h2 className="font-medium">Зураг</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className={`mt-3 ${secondaryButton}`}
            >
              Зураг оруулах
            </button>
            <p className="mt-2 text-sm text-stone">PNG, JPG эсвэл SVG, 5 МБ хүртэл.</p>
          </div>

          <div>
            <h2 className="font-medium">Тохируулах</h2>
            {!selected && (
              <p className="mt-2 text-sm text-stone">Тохируулахын тулд зургаа сонгоно уу.</p>
            )}

            <label className="mt-4 block text-sm">
              Томруулах
              <input
                type="range"
                min="20"
                max={CANVAS_WIDTH}
                value={selected ? Math.min(selected.width, CANVAS_WIDTH) : 20}
                disabled={!selected}
                onChange={handleScaleChange}
                className="mt-2 w-full accent-ink disabled:opacity-40"
              />
            </label>

            <label className="mt-4 block text-sm">
              Эргүүлэх
              <input
                type="range"
                min="-180"
                max="180"
                value={selected ? selected.angle : 0}
                disabled={!selected}
                onChange={handleRotateChange}
                className="mt-2 w-full accent-ink disabled:opacity-40"
              />
            </label>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!selected}
              className={`mt-4 ${secondaryButton}`}
            >
              Устгах
            </button>
          </div>

          <div>
            <h2 className="mb-4 font-medium">Сонголт</h2>
            <ProductOptions product={product} options={options} />
          </div>

          <div>
            <h2 className="font-medium">Урьдчилан харах</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {SIDES.map((side) => (
                <div key={side.id} className="rounded-xl bg-beige p-3 text-center text-sm">
                  <ProductMockup
                    category={product.category}
                    colorHex={options.color.hex}
                    side={side.id}
                    overlay={previews[side.id]}
                    alt={side.label}
                  />
                  <span className="mt-2 block">{side.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleAddToCart} className={primaryButton}>
              Сагсанд нэмэх
            </button>
            <button type="button" onClick={handleSave} className={secondaryButton}>
              Загварыг хадгалах
            </button>
            <button type="button" onClick={handleReset} className={secondaryButton}>
              Загварыг шинэчлэх
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default DesignEditor
