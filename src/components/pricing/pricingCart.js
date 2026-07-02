export function pricingItemId(section, category, key) {
  return `${section}::${category}::${key}`
}

export function planPriceLabel(plan) {
  return `${plan.price}${plan.unit || ''}`
}

export function createCartItem({ section, category, key, name, price }) {
  return {
    id: pricingItemId(section, category, key),
    section,
    category,
    name,
    price,
  }
}
