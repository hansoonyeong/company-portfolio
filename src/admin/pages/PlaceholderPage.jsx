export default function PlaceholderPage({ title, eyebrow = 'Workspace', lead, children }) {
  return (
    <div className="office-page">
      <p className="office-page__eyebrow">{eyebrow}</p>
      <h2 className="office-page__title">{title}</h2>
      {lead ? <p className="office-page__lead">{lead}</p> : null}
      {children}
    </div>
  )
}
