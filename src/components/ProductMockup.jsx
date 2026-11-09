import { getMockupImage } from '../utils/mockups'

function ProductMockup({ category, colorHex, side = 'front', overlay = null, alt }) {
  return (
    <div className="relative aspect-6/7 w-full">
      <img
        src={getMockupImage(category, side, colorHex)}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {overlay && (
        <img
          src={overlay}
          alt="Таны загвар"
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
    </div>
  )
}

export default ProductMockup
