import PlanCards from './PlanCards'
import PriceTable from './PriceTable'

export default function ServiceGroupPanel({
  group,
  pillarTitle,
  includesLabel,
  onAdd,
  hasItem,
  labels,
}) {
  const section = pillarTitle
  const category = group.title
  const catalogProps = { section, category, onAdd, hasItem, labels }

  return (
    <section className="pricing__group-block">
      <h3 className="pricing__group-title">{group.title}</h3>
      {group.intro && <p className="pricing__group-intro">{group.intro}</p>}

      {group.plans && (
        <PlanCards plans={group.plans} includesLabel={includesLabel} {...catalogProps} />
      )}

      {group.items && (
        <PriceTable headers={group.tableHeaders} rows={group.items} {...catalogProps} />
      )}
    </section>
  )
}
