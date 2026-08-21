import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getOfficeBundle } from '../lib/officeApi'
import { useAdminAuth } from './AdminAuthContext'

const OfficeDataContext = createContext(null)

const EMPTY = {
  projects: [],
  tasks: [],
  notes: [],
  memory: [],
  agents: [],
  activity: [],
  meetings: [],
  conversations: [],
}

export function OfficeDataProvider({ children }) {
  const { token, clearAuth } = useAdminAuth()
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const bundle = await getOfficeBundle()
      setData({
        projects: bundle.projects || [],
        tasks: bundle.tasks || [],
        notes: bundle.notes || [],
        memory: bundle.memory || [],
        agents: bundle.agents || [],
        activity: bundle.activity || [],
        meetings: bundle.meetings || [],
        conversations: bundle.conversations || [],
      })
    } catch (err) {
      if (err.status === 401) {
        clearAuth()
        return
      }
      setError(err.message || '오피스 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, clearAuth])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      refresh,
      setData,
      activeProjects: data.projects.filter((p) => !p.archived),
    }),
    [data, loading, error, refresh],
  )

  return <OfficeDataContext.Provider value={value}>{children}</OfficeDataContext.Provider>
}

export function useOfficeData() {
  const ctx = useContext(OfficeDataContext)
  if (!ctx) throw new Error('useOfficeData must be used within OfficeDataProvider')
  return ctx
}

export const TASK_STATUS_LABEL = {
  inbox: '수신함',
  todo: '할 일',
  in_progress: '진행 중',
  waiting: '대기',
  done: '완료',
}

export const PRIORITY_LABEL = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
}

export const AGENT_STATE_LABEL = {
  idle: '대기',
  walking: '이동 중',
  thinking: '생각 중',
  working: '작업 중',
  meeting: '미팅',
  waiting: '입력 대기',
  done: '완료',
  offline: '오프라인',
}

export const MEMORY_CATEGORY_LABEL = {
  business_info: '비즈니스 정보',
  brand_voice: '브랜드 보이스',
  products_services: '제품 · 서비스',
  pricing: '가격',
  customers: '고객',
  rules: '규칙',
  contacts: '연락처',
  important_decisions: '중요 결정',
  current_status: '현재 상태',
}

export const PROJECT_STATUS_LABEL = {
  active: '진행',
  planning: '기획',
  paused: '일시중지',
  done: '완료',
}
