import { createCartItem } from './pricingCart'

function AddButton({ added, onClick, label, addedLabel }) {
  return (
    <button
      type="button"
      className={`pricing__add-btn ${added ? 'pricing__add-btn--added' : ''}`}
      onClick={onClick}
      disabled={added}
    >
      {added ? addedLabel : label}
    </button>
  )
}

export default function PricingAddButton({
  section,
  category,
  itemKey,
  name,
  price,
  labels,
  onAdd,
  hasItem,
}) {
  const item = createCartItem({ section, category, key: itemKey, name, price })

  return (
    <AddButton
      added={hasItem(item.id)}
      label={labels.add}
      addedLabel={labels.added}
      onClick={() => onAdd(item)}
    />
  )
}
