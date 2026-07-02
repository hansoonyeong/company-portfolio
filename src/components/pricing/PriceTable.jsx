import PricingAddButton from './PricingAddButton'
import PricingItemName from './PricingItemName'

function rowCartProps(row, section, category, labels, onAdd, hasItem) {
  return {
    section,
    category,
    itemKey: row.name,
    name: row.name,
    price: row.price,
    labels,
    onAdd,
    hasItem,
  }
}

function MobilePriceCard({ row, cart }) {
  return (
    <li className="pricing__item-card">
      <h4 className="pricing__item-card-name">
        <PricingItemName name={row.name} badge={row.badge} />
      </h4>
      <p className="pricing__plan-price">{row.price}</p>
      <PricingAddButton {...cart} />
    </li>
  )
}

function DesktopPriceRow({ row, cart, showNote }) {
  return (
    <tr>
      <th scope="row">
        <PricingItemName name={row.name} badge={row.badge} />
      </th>
      <td>{row.price}</td>
      {showNote && <td className="pricing__table-note">{row.note || '—'}</td>}
      <td className="pricing__table-action">
        <PricingAddButton {...cart} />
      </td>
    </tr>
  )
}

export default function PriceTable({ headers, rows, section, category, onAdd, hasItem, labels }) {
  const showNote = headers.length > 2

  return (
    <>
      <ul className="pricing__item-cards">
        {rows.map((row) => (
          <MobilePriceCard
            key={row.name}
            row={row}
            cart={rowCartProps(row, section, category, labels, onAdd, hasItem)}
          />
        ))}
      </ul>

      <div className="pricing__table-wrap">
        <table className="pricing__table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
              <th scope="col" className="pricing__table-action-col">
                {labels.action}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DesktopPriceRow
                key={row.name}
                row={row}
                showNote={showNote}
                cart={rowCartProps(row, section, category, labels, onAdd, hasItem)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
