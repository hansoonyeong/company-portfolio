export const PROJECT_TAGS = [
  { key: 'marketing', ko: '마케팅', en: 'Marketing' },
  { key: 'design', ko: '디자인', en: 'Design' },
  { key: 'content', ko: '콘텐츠', en: 'Content' },
  { key: 'photography', ko: '촬영', en: 'Photography' },
]

export function tagKeyFromProject(tag) {
  const ko = tag?.ko ?? tag
  const en = tag?.en ?? tag
  return PROJECT_TAGS.find((item) => item.ko === ko || item.en === en)?.key ?? ''
}

export function tagsFromKey(key) {
  const found = PROJECT_TAGS.find((item) => item.key === key)
  return found ? { ko: found.ko, en: found.en } : null
}
