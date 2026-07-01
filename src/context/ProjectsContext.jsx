import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildDefaultProjects } from '../data/defaultProjects'
import { fetchProjects } from '../lib/api'
import { localizeProject, sortProjectsByDate } from '../lib/projects'
import { useTranslation } from '../i18n/LanguageContext'

const ProjectsContext = createContext(null)

export function ProjectsProvider({ children }) {
  const { lang, t } = useTranslation()
  const [rawProjects, setRawProjects] = useState(buildDefaultProjects)
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects()
      if (Array.isArray(data) && data.length > 0) {
        setRawProjects(data)
      }
    } catch {
      setRawProjects(buildDefaultProjects())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const projects = useMemo(
    () => sortProjectsByDate(rawProjects.map((item) => localizeProject(item, lang))),
    [rawProjects, lang],
  )

  const value = useMemo(
    () => ({
      projects,
      rawProjects,
      loading,
      refreshProjects: loadProjects,
      quotePriceLabel: t.projects.quotePrice,
    }),
    [projects, rawProjects, loading, loadProjects, t.projects.quotePrice],
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
