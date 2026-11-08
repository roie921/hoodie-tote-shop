// Formats a number as a price, for example 89000 -> "89,000₮"
export function formatPrice(value) {
  return `${value.toLocaleString('en-US')}₮`
}
