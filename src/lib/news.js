export function localizeNewsItem(item, lang) {
  const document = item.document
    ? {
        href: item.document.href,
        label: item.document.label?.[lang] || item.document.label?.en || '',
      }
    : null

  if (item.title?.en || item.title?.ko) {
    return {
      id: item.id,
      category: item.category?.[lang] || item.category?.en || '',
      title: item.title?.[lang] || item.title?.en || '',
      content: item.content?.[lang] || item.content?.en || '',
      date: item.date,
      document,
    }
  }

  return {
    id: item.id,
    category: item.category,
    title: item.title,
    content: item.content || '',
    date: item.date,
    document,
  }
}
