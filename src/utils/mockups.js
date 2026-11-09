export const CANVAS_WIDTH = 600
export const CANVAS_HEIGHT = 700

const PRINT_AREAS = {
  hoodie: {
    front: { x: 215, y: 265, width: 170, height: 180 },
    back: { x: 205, y: 210, width: 190, height: 270 },
  },
  tote: {
    front: { x: 190, y: 315, width: 220, height: 260 },
    back: { x: 190, y: 315, width: 220, height: 260 },
  },
}

export function getPrintArea(category, side) {
  return PRINT_AREAS[category][side]
}

function shade(hex, amount) {
  const number = parseInt(hex.slice(1), 16)
  const clamp = (value) => Math.max(0, Math.min(255, value))
  const r = clamp((number >> 16) + amount)
  const g = clamp(((number >> 8) & 255) + amount)
  const b = clamp((number & 255) + amount)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function hoodieSvg(side, color) {
  const dark = shade(color, -30)
  const frontDetails = `
    <path d="M205 150 Q200 40 300 40 Q400 40 395 150 Q300 192 205 150 Z" fill="${color}"/>
    <path d="M240 152 Q238 84 300 84 Q362 84 360 152 Q300 180 240 152 Z" fill="${dark}"/>
    <path d="M272 184 L268 250" stroke="${dark}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M328 184 L332 250" stroke="${dark}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M205 480 L395 480 L418 575 L182 575 Z" fill="none"/>`
  const backDetails = `
    <path d="M205 150 Q200 40 300 40 Q400 40 395 150 Q300 188 205 150 Z" fill="${color}"/>
    <path d="M300 54 L300 168" fill="none" stroke-dasharray="5 5"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
  <g stroke="rgba(0,0,0,0.2)" stroke-width="3" stroke-linejoin="round">
    <path d="M175 150 L62 262 L92 520 L152 508 L168 340 Z" fill="${color}"/>
    <path d="M425 150 L538 262 L508 520 L448 508 L432 340 Z" fill="${color}"/>
    <path d="M170 150 Q300 118 430 150 L442 640 Q300 662 158 640 Z" fill="${color}"/>
    <path d="M160 612 Q300 634 440 612 L442 640 Q300 662 158 640 Z" fill="${dark}"/>
    ${side === 'front' ? frontDetails : backDetails}
  </g>
</svg>`
}

function toteSvg(color) {
  const dark = shade(color, -24)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
  <g stroke="rgba(0,0,0,0.2)" stroke-width="3" stroke-linejoin="round">
    <path d="M220 255 C215 70 385 70 380 255" fill="none" stroke="${dark}" stroke-width="16" stroke-linecap="round"/>
    <path d="M140 240 L460 240 L476 640 L124 640 Z" fill="${color}"/>
    <path d="M140 240 L460 240 L462 280 L138 280 Z" fill="${dark}"/>
    <path d="M142 300 L458 300" fill="none" stroke="rgba(0,0,0,0.25)" stroke-dasharray="6 6"/>
  </g>
</svg>`
}

export function getMockupImage(category, side, colorHex) {
  const svg = category === 'hoodie' ? hoodieSvg(side, colorHex) : toteSvg(colorHex)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
