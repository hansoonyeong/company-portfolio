import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { useHero } from '../context/HeroContext'
import { PROJECT_TAGS, tagKeyFromProject, tagsFromKey } from '../data/projectTags'
import { isVideoSrc } from '../lib/media'
import { buildDefaultHero } from '../data/defaultHero'
import { formToHeroContent, heroToForm } from '../lib/hero'
import { adminLogin, createNews, createProject, deleteHeroImage, deleteNews, deleteProject, fetchNews, fetchProjects, fetchQuotes, updateHero, updateNews, updateProject, updateQuoteStatus, uploadHeroImage } from '../lib/api'
import './AdminPage.css'

const TOKEN_KEY = 'soono-admin-token'

const statusLabels = {
  new: '신규',
  contacted: '연락 완료',
  closed: '종료',
}

const emptyNewsForm = {
  categoryKo: '',
  categoryEn: '',
  titleKo: '',
  titleEn: '',
  contentKo: '',
  contentEn: '',
  date: '',
  documentHref: '',
  documentLabelKo: '',
  documentLabelEn: '',
}

function newsToForm(item) {
  return {
    categoryKo: item.category?.ko || '',
    categoryEn: item.category?.en || '',
    titleKo: item.title?.ko || '',
    titleEn: item.title?.en || '',
    contentKo: item.content?.ko || '',
    contentEn: item.content?.en || '',
    date: item.date || '',
    documentHref: item.document?.href || '',
    documentLabelKo: item.document?.label?.ko || '',
    documentLabelEn: item.document?.label?.en || '',
  }
}

function newsFormToPayload(form) {
  const payload = {
    category: { ko: form.categoryKo, en: form.categoryEn },
    title: { ko: form.titleKo, en: form.titleEn },
    content: { ko: form.contentKo, en: form.contentEn },
    date: form.date,
    document: form.documentHref.trim()
      ? {
          href: form.documentHref.trim(),
          label: {
            ko: form.documentLabelKo.trim(),
            en: form.documentLabelEn.trim(),
          },
        }
      : { href: '' },
  }
  return payload
}

const emptyProjectForm = {
  slug: '',
  tagKey: '',
  title: '',
  subtitle: '',
  date: '',
  location: 'Sydney',
  descriptionKo: '',
  descriptionEn: '',
  scopeKo: '',
  scopeEn: '',
}

function getProjectSlugFromItem(item) {
  if (item?.slug) return item.slug
  const imagePath = item?.thumb || item?.gallery?.[0]
  if (!imagePath) return ''
  const match = String(imagePath).match(/^\/projects\/([^/]+)\//)
  return match ? match[1] : ''
}

function projectToForm(item) {
  return {
    slug: getProjectSlugFromItem(item),
    tagKey: tagKeyFromProject(item.tag),
    title: item.title || '',
    subtitle: item.subtitle || '',
    date: item.date || '',
    location: item.location || 'Sydney',
    descriptionKo: item.description?.ko || '',
    descriptionEn: item.description?.en || '',
    scopeKo: (item.scope?.ko || []).join('\n'),
    scopeEn: (item.scope?.en || []).join('\n'),
  }
}

function moveListItem(list, index, delta) {
  const next = [...list]
  const target = index + delta
  if (target < 0 || target >= next.length) return list
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export default function AdminPage() {
  const { refreshProjects } = useProjects()
  const { rawHero, refreshHero, setRawHero } = useHero()
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('quotes')
  const [quotes, setQuotes] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newsForm, setNewsForm] = useState(emptyNewsForm)
  const [editingNewsId, setEditingNewsId] = useState(null)
  const [newsError, setNewsError] = useState('')
  const [newsSubmitting, setNewsSubmitting] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [existingThumb, setExistingThumb] = useState('')
  const [existingGallery, setExistingGallery] = useState([])
  const [removeGalleryPaths, setRemoveGalleryPaths] = useState([])
  const [projectThumb, setProjectThumb] = useState(null)
  const [projectGallery, setProjectGallery] = useState([])
  const [projectError, setProjectError] = useState('')
  const [projectSuccess, setProjectSuccess] = useState('')
  const [projectSubmitting, setProjectSubmitting] = useState(false)
  const [heroForm, setHeroForm] = useState(() => heroToForm(rawHero))
  const [heroError, setHeroError] = useState('')
  const [heroSubmitting, setHeroSubmitting] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)

  const loadQuotes = async (authToken) => {
    setLoading(true)
    try {
      const data = await fetchQuotes(authToken)
      setQuotes(data)
    } catch {
      sessionStorage.removeItem(TOKEN_KEY)
      setToken('')
    } finally {
      setLoading(false)
    }
  }

  const loadNews = async (authToken) => {
    setLoading(true)
    try {
      const data = await fetchNews()
      setNews(data)
    } catch {
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const loadProjectsAdmin = async () => {
    setLoading(true)
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    if (activeTab === 'quotes') loadQuotes(token)
    else if (activeTab === 'news') loadNews(token)
    else if (activeTab === 'hero') refreshHero()
    else loadProjectsAdmin()
  }, [token, activeTab])

  useEffect(() => {
    if (activeTab === 'hero') {
      setHeroForm(heroToForm(rawHero))
    }
  }, [activeTab, rawHero])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      const { token: newToken } = await adminLogin(password)
      sessionStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      setPassword('')
    } catch (err) {
      if (err.message === 'SERVER_UNAVAILABLE') {
        setLoginError('서버에 연결할 수 없습니다. 개발 서버를 재시작해 주세요.')
      } else {
        setLoginError('비밀번호가 올바르지 않습니다.')
      }
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setQuotes([])
    setNews([])
    setProjects([])
    setSelected(null)
    setNewsForm(emptyNewsForm)
    setEditingNewsId(null)
    setProjectForm(emptyProjectForm)
    setEditingProjectId(null)
    setExistingThumb('')
    setExistingGallery([])
    setRemoveGalleryPaths([])
    setProjectThumb(null)
    setProjectGallery([])
    setHeroForm(heroToForm(buildDefaultHero()))
    setHeroError('')
  }

  const handleHeroField = (field, value) => {
    setHeroForm((prev) => ({ ...prev, [field]: value }))
  }

  const saveHero = async (images) => {
    const updated = await updateHero(token, {
      ...formToHeroContent(heroForm),
      images,
    })
    setRawHero(updated)
    await refreshHero()
    return updated
  }

  const handleHeroContentSubmit = async (e) => {
    e.preventDefault()
    setHeroError('')
    setHeroSubmitting(true)

    try {
      await saveHero(rawHero.images)
    } catch (err) {
      setHeroError(err.message || '히어로 저장에 실패했습니다.')
    } finally {
      setHeroSubmitting(false)
    }
  }

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setHeroError('')
    setHeroUploading(true)

    try {
      const updated = await uploadHeroImage(token, file)
      setRawHero(updated)
      await refreshHero()
    } catch (err) {
      setHeroError(err.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setHeroUploading(false)
    }
  }

  const handleHeroMoveImage = async (index, delta) => {
    const images = moveListItem(rawHero.images, index, delta)
    if (images === rawHero.images) return

    setHeroError('')
    setHeroSubmitting(true)

    try {
      await saveHero(images)
    } catch (err) {
      setHeroError(err.message || '순서 변경에 실패했습니다.')
    } finally {
      setHeroSubmitting(false)
    }
  }

  const handleHeroImageDelete = async (imagePath) => {
    if (!window.confirm('이 슬라이드 이미지를 삭제할까요?')) return

    setHeroError('')
    setHeroSubmitting(true)

    try {
      const updated = await deleteHeroImage(token, imagePath)
      setRawHero(updated)
      await refreshHero()
    } catch (err) {
      setHeroError(err.message || '이미지 삭제에 실패했습니다.')
    } finally {
      setHeroSubmitting(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    const updated = await updateQuoteStatus(token, id, status)
    setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)))
    setSelected((prev) => (prev?.id === id ? updated : prev))
  }

  const resetNewsForm = () => {
    setNewsForm(emptyNewsForm)
    setEditingNewsId(null)
    setNewsError('')
  }

  const handleNewsEdit = (item) => {
    setEditingNewsId(item.id)
    setNewsForm(newsToForm(item))
    setNewsError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNewsField = (field, value) => {
    setNewsForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNewsSubmit = async (e) => {
    e.preventDefault()
    setNewsError('')
    setNewsSubmitting(true)

    try {
      const payload = newsFormToPayload(newsForm)

      if (editingNewsId) {
        const updated = await updateNews(token, editingNewsId, payload)
        setNews((prev) => prev.map((item) => (item.id === editingNewsId ? updated : item)))
        resetNewsForm()
      } else {
        const created = await createNews(token, payload)
        setNews((prev) => [created, ...prev])
        resetNewsForm()
      }
    } catch (err) {
      setNewsError(err.message || (editingNewsId ? '소식 수정에 실패했습니다.' : '소식 등록에 실패했습니다.'))
    } finally {
      setNewsSubmitting(false)
    }
  }

  const handleNewsDelete = async (id) => {
    if (!window.confirm('이 소식을 삭제할까요?')) return

    try {
      await deleteNews(token, id)
      setNews((prev) => prev.filter((item) => item.id !== id))
      if (editingNewsId === id) {
        resetNewsForm()
      }
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const resetProjectForm = () => {
    setProjectForm(emptyProjectForm)
    setEditingProjectId(null)
    setExistingThumb('')
    setExistingGallery([])
    setRemoveGalleryPaths([])
    setProjectThumb(null)
    setProjectGallery([])
    setProjectError('')
    setProjectSuccess('')
  }

  const handleProjectField = (field, value) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleProjectEdit = (item) => {
    setEditingProjectId(item.id)
    setProjectForm(projectToForm(item))
    setExistingThumb(item.thumb || '')
    setExistingGallery(item.gallery || [])
    setRemoveGalleryPaths([])
    setProjectThumb(null)
    setProjectGallery([])
    setProjectError('')
    setProjectSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleRemoveGalleryPath = (imagePath) => {
    setRemoveGalleryPaths((prev) =>
      prev.includes(imagePath) ? prev.filter((path) => path !== imagePath) : [...prev, imagePath],
    )
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    setProjectError('')
    setProjectSuccess('')

    const tags = tagsFromKey(projectForm.tagKey)
    if (!tags) {
      setProjectError('카테고리를 선택해 주세요.')
      return
    }

    setProjectSubmitting(true)

    try {
      const formData = new FormData()
      Object.entries(projectForm).forEach(([key, value]) => {
        if (key !== 'slug' && key !== 'tagKey') formData.append(key, value)
      })
      formData.append('tagKo', tags.ko)
      formData.append('tagEn', tags.en)
      if (removeGalleryPaths.length > 0) {
        formData.append('removeGalleryPaths', JSON.stringify(removeGalleryPaths))
      }
      if (projectThumb) formData.append('thumb', projectThumb)
      projectGallery.forEach((file) => formData.append('gallery', file))

      if (editingProjectId) {
        const updated = await updateProject(
          token,
          editingProjectId,
          formData,
          projectForm.slug.trim(),
        )
        setProjects((prev) => prev.map((item) => (item.id === editingProjectId ? updated : item)))
        setProjectSuccess('프로젝트가 저장되었습니다.')
        resetProjectForm()
      } else {
        const created = await createProject(token, formData, projectForm.slug.trim())
        setProjects((prev) => [created, ...prev])
        setProjectSuccess('프로젝트가 등록되었습니다.')
        resetProjectForm()
      }

      refreshProjects().catch(() => {})
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setProjectError('로그인이 만료되었습니다. 다시 로그인해 주세요.')
        sessionStorage.removeItem(TOKEN_KEY)
        setToken('')
      } else {
        setProjectError(err.message || '프로젝트 저장에 실패했습니다.')
      }
    } finally {
      setProjectSubmitting(false)
    }
  }

  const handleProjectDelete = async (id) => {
    if (!window.confirm('이 프로젝트를 삭제할까요? 이미지 폴더도 함께 삭제됩니다.')) return

    try {
      await deleteProject(token, id)
      setProjects((prev) => prev.filter((item) => item.id !== id))
      if (editingProjectId === id) resetProjectForm()
      await refreshProjects()
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const newCount = quotes.filter((q) => q.status === 'new').length

  const headerSummary =
    activeTab === 'quotes'
      ? `신규 ${newCount}건 · 전체 ${quotes.length}건`
      : activeTab === 'news'
        ? `소식 ${news.length}건`
        : activeTab === 'hero'
          ? `히어로 슬라이드 ${rawHero.images.length}장`
          : `프로젝트 ${projects.length}건`

  const refreshActiveTab = () => {
    if (activeTab === 'quotes') loadQuotes(token)
    else if (activeTab === 'news') loadNews(token)
    else if (activeTab === 'hero') refreshHero()
    else loadProjectsAdmin()
  }

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  const todayFormatted = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}.${m}.${d}`
  }

  if (!token) {
    return (
      <div className="admin admin--login">
        <form className="admin__login" onSubmit={handleLogin}>
          <h1>soono Admin</h1>
          <p>견적 요청, 소식, 히어로, 프로젝트를 관리합니다.</p>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </label>
          {loginError && <p className="admin__error">{loginError}</p>}
          <button type="submit">로그인</button>
          <Link to="/" className="admin__home-link">
            ← 홈으로
          </Link>
        </form>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <h1>soono Admin</h1>
          <p>{headerSummary}</p>
        </div>
        <div className="admin__header-actions">
          <button type="button" onClick={refreshActiveTab} disabled={loading}>
            새로고침
          </button>
          <button type="button" className="admin__logout" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <nav className="admin__tabs">
        <button
          type="button"
          className={activeTab === 'quotes' ? 'admin__tab--active' : ''}
          onClick={() => {
            setActiveTab('quotes')
            setSelected(null)
          }}
        >
          견적 요청
        </button>
        <button
          type="button"
          className={activeTab === 'news' ? 'admin__tab--active' : ''}
          onClick={() => {
            setActiveTab('news')
            setSelected(null)
          }}
        >
          소식 관리
        </button>
        <button
          type="button"
          className={activeTab === 'hero' ? 'admin__tab--active' : ''}
          onClick={() => {
            setActiveTab('hero')
            setSelected(null)
          }}
        >
          히어로 관리
        </button>
        <button
          type="button"
          className={activeTab === 'projects' ? 'admin__tab--active' : ''}
          onClick={() => {
            setActiveTab('projects')
            setSelected(null)
          }}
        >
          프로젝트 관리
        </button>
      </nav>

      {activeTab === 'quotes' ? (
        <div className="admin__layout">
          <aside className="admin__list">
            {loading && quotes.length === 0 ? (
              <p className="admin__empty">불러오는 중...</p>
            ) : quotes.length === 0 ? (
              <p className="admin__empty">아직 견적 요청이 없습니다.</p>
            ) : (
              <ul>
                {quotes.map((quote) => (
                  <li key={quote.id}>
                    <button
                      type="button"
                      className={`admin__item ${selected?.id === quote.id ? 'admin__item--active' : ''} admin__item--${quote.status}`}
                      onClick={() => setSelected(quote)}
                    >
                      <span className="admin__item-name">{quote.name}</span>
                      <span className="admin__item-meta">
                        {quote.service || '미지정'} · {formatDate(quote.createdAt)}
                      </span>
                      <span className={`admin__badge admin__badge--${quote.status}`}>
                        {statusLabels[quote.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <main className="admin__detail">
            {selected ? (
              <>
                <div className="admin__detail-header">
                  <h2>{selected.name}</h2>
                  <div className="admin__status-actions">
                    {['new', 'contacted', 'closed'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={selected.status === status ? 'admin__status-btn--active' : ''}
                        onClick={() => handleStatusChange(selected.id, status)}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>

                <dl className="admin__meta">
                  <div>
                    <dt>이메일</dt>
                    <dd>
                      <a href={`mailto:${selected.email}`}>{selected.email}</a>
                    </dd>
                  </div>
                  {selected.company && (
                    <div>
                      <dt>회사/브랜드</dt>
                      <dd>{selected.company}</dd>
                    </div>
                  )}
                  {selected.service && (
                    <div>
                      <dt>서비스</dt>
                      <dd>{selected.service}</dd>
                    </div>
                  )}
                  {selected.budget && (
                    <div>
                      <dt>예산</dt>
                      <dd>{selected.budget}</dd>
                    </div>
                  )}
                  {selected.timeline && (
                    <div>
                      <dt>일정</dt>
                      <dd>{selected.timeline}</dd>
                    </div>
                  )}
                  <div>
                    <dt>접수일</dt>
                    <dd>{formatDate(selected.createdAt)}</dd>
                  </div>
                </dl>

                {selected.items?.length > 0 && (
                  <div className="admin__items">
                    <h3>선택 품목 ({selected.items.length})</h3>
                    <ul>
                      {selected.items.map((item) => (
                        <li key={item.id}>
                          <span>{item.name}</span>
                          <span>{item.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.message && (
                  <div className="admin__message">
                    <h3>요청 내용</h3>
                    <p>{selected.message}</p>
                  </div>
                )}

                <a href={`mailto:${selected.email}`} className="admin__reply">
                  {selected.email}로 답장하기
                </a>
              </>
            ) : (
              <p className="admin__empty">왼쪽 목록에서 요청을 선택하세요.</p>
            )}
          </main>
        </div>
      ) : activeTab === 'news' ? (
        <div className="admin__news">
          <form className="admin__news-form" onSubmit={handleNewsSubmit}>
            <h2>{editingNewsId ? '소식 수정' : '소식 추가'}</h2>
            {editingNewsId && (
              <p className="admin__hint">ID: {editingNewsId}</p>
            )}
            <div className="admin__news-grid">
              <label>
                <span>카테고리 (한국어)</span>
                <input
                  type="text"
                  value={newsForm.categoryKo}
                  onChange={(e) => handleNewsField('categoryKo', e.target.value)}
                  placeholder="발표"
                  required
                />
              </label>
              <label>
                <span>카테고리 (English)</span>
                <input
                  type="text"
                  value={newsForm.categoryEn}
                  onChange={(e) => handleNewsField('categoryEn', e.target.value)}
                  placeholder="Announcement"
                  required
                />
              </label>
              <label>
                <span>제목 (한국어)</span>
                <input
                  type="text"
                  value={newsForm.titleKo}
                  onChange={(e) => handleNewsField('titleKo', e.target.value)}
                  placeholder="2026 가격 업데이트"
                  required
                />
              </label>
              <label>
                <span>제목 (English)</span>
                <input
                  type="text"
                  value={newsForm.titleEn}
                  onChange={(e) => handleNewsField('titleEn', e.target.value)}
                  placeholder="2026 Price Update"
                  required
                />
              </label>
              <label className="admin__news-field--full">
                <span>날짜</span>
                <input
                  type="text"
                  value={newsForm.date}
                  onChange={(e) => handleNewsField('date', e.target.value)}
                  placeholder={todayFormatted()}
                  required
                />
              </label>
              <label className="admin__news-field--full">
                <span>내용 (한국어)</span>
                <textarea
                  rows={5}
                  value={newsForm.contentKo}
                  onChange={(e) => handleNewsField('contentKo', e.target.value)}
                  placeholder="소식 본문을 입력하세요."
                />
              </label>
              <label className="admin__news-field--full">
                <span>내용 (English)</span>
                <textarea
                  rows={5}
                  value={newsForm.contentEn}
                  onChange={(e) => handleNewsField('contentEn', e.target.value)}
                  placeholder="News body in English."
                />
              </label>
              <label className="admin__news-field--full">
                <span>첨부 PDF 경로 (선택)</span>
                <input
                  type="text"
                  value={newsForm.documentHref}
                  onChange={(e) => handleNewsField('documentHref', e.target.value)}
                  placeholder="/downloads/kakao-channel-marketing-proposal.pdf"
                />
              </label>
              <label>
                <span>PDF 버튼 문구 (한국어)</span>
                <input
                  type="text"
                  value={newsForm.documentLabelKo}
                  onChange={(e) => handleNewsField('documentLabelKo', e.target.value)}
                  placeholder="제안서 PDF 보기"
                />
              </label>
              <label>
                <span>PDF 버튼 문구 (English)</span>
                <input
                  type="text"
                  value={newsForm.documentLabelEn}
                  onChange={(e) => handleNewsField('documentLabelEn', e.target.value)}
                  placeholder="View proposal (PDF)"
                />
              </label>
            </div>
            {newsError && <p className="admin__error">{newsError}</p>}
            <div className="admin__form-actions">
              <button type="submit" className="admin__news-submit" disabled={newsSubmitting}>
                {newsSubmitting
                  ? '저장 중...'
                  : editingNewsId
                    ? '변경사항 저장'
                    : '소식 등록'}
              </button>
              {editingNewsId && (
                <button type="button" className="admin__cancel-btn" onClick={resetNewsForm}>
                  수정 취소
                </button>
              )}
            </div>
          </form>

          <div className="admin__news-list">
            <h2>등록된 소식</h2>
            {loading && news.length === 0 ? (
              <p className="admin__empty">불러오는 중...</p>
            ) : news.length === 0 ? (
              <p className="admin__empty">등록된 소식이 없습니다.</p>
            ) : (
              <ul>
                {news.map((item) => (
                  <li key={item.id} className="admin__news-item">
                    <div>
                      <span className="admin__news-item-category">{item.category?.ko}</span>
                      <strong>{item.title?.ko}</strong>
                      <span className="admin__news-item-meta">
                        {item.date} · {item.title?.en}
                      </span>
                      {item.content?.ko && (
                        <p className="admin__news-item-preview">{item.content.ko.slice(0, 120)}</p>
                      )}
                      {item.document?.href && (
                        <p className="admin__news-item-preview">PDF: {item.document.href}</p>
                      )}
                    </div>
                    <div className="admin__item-actions">
                      <button
                        type="button"
                        className="admin__edit-btn"
                        onClick={() => handleNewsEdit(item)}
                      >
                        수정
                      </button>
                      <button type="button" className="admin__news-delete" onClick={() => handleNewsDelete(item.id)}>
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : activeTab === 'hero' ? (
        <div className="admin__news admin__hero">
          <form className="admin__news-form" onSubmit={handleHeroContentSubmit}>
            <h2>히어로 텍스트 · 링크</h2>
            <p className="admin__hint">
              제목·설명은 줄바꿈으로 여러 줄 입력할 수 있습니다. 링크는 `/about` 같은 내부 경로 또는
              `https://` 외부 URL을 입력하세요.
            </p>
            <div className="admin__news-grid">
              <label className="admin__news-field--full">
                <span>제목 (한국어, 줄바꿈)</span>
                <textarea
                  rows={3}
                  value={heroForm.headlineKo}
                  onChange={(e) => handleHeroField('headlineKo', e.target.value)}
                  required
                />
              </label>
              <label className="admin__news-field--full">
                <span>제목 (English, line breaks)</span>
                <textarea
                  rows={3}
                  value={heroForm.headlineEn}
                  onChange={(e) => handleHeroField('headlineEn', e.target.value)}
                  required
                />
              </label>
              <label className="admin__news-field--full">
                <span>설명 (한국어, 줄바꿈)</span>
                <textarea
                  rows={4}
                  value={heroForm.descKo}
                  onChange={(e) => handleHeroField('descKo', e.target.value)}
                  required
                />
              </label>
              <label className="admin__news-field--full">
                <span>설명 (English, line breaks)</span>
                <textarea
                  rows={4}
                  value={heroForm.descEn}
                  onChange={(e) => handleHeroField('descEn', e.target.value)}
                  required
                />
              </label>
              <label>
                <span>버튼 텍스트 (한국어)</span>
                <input
                  type="text"
                  value={heroForm.ctaKo}
                  onChange={(e) => handleHeroField('ctaKo', e.target.value)}
                  required
                />
              </label>
              <label>
                <span>버튼 텍스트 (English)</span>
                <input
                  type="text"
                  value={heroForm.ctaEn}
                  onChange={(e) => handleHeroField('ctaEn', e.target.value)}
                  required
                />
              </label>
              <label className="admin__news-field--full">
                <span>버튼 링크</span>
                <input
                  type="text"
                  value={heroForm.link}
                  onChange={(e) => handleHeroField('link', e.target.value)}
                  placeholder="/about"
                  required
                />
              </label>
            </div>
            {heroError && <p className="admin__error">{heroError}</p>}
            <button type="submit" className="admin__news-submit" disabled={heroSubmitting}>
              {heroSubmitting ? '저장 중...' : '텍스트 · 링크 저장'}
            </button>
          </form>

          <div className="admin__news-list">
            <h2>슬라이드 이미지</h2>
            <p className="admin__hint">JPG, PNG, WEBP (최대 100MB). 위쪽부터 슬라이드 순서입니다.</p>
            <label className="admin__hero-upload">
              <span>{heroUploading ? '업로드 중...' : '이미지 추가'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={heroUploading || heroSubmitting}
                onChange={handleHeroImageUpload}
              />
            </label>

            {rawHero.images.length === 0 ? (
              <p className="admin__empty">등록된 슬라이드 이미지가 없습니다.</p>
            ) : (
              <ul className="admin__hero-images">
                {rawHero.images.map((imagePath, imageIndex) => (
                  <li key={imagePath} className="admin__hero-image-item">
                    <img src={imagePath} alt="" className="admin__hero-image-thumb" />
                    <div className="admin__hero-image-meta">
                      <strong>{imageIndex + 1}번 슬라이드</strong>
                      <span>{imagePath}</span>
                    </div>
                    <div className="admin__hero-image-actions">
                      <button
                        type="button"
                        className="admin__edit-btn"
                        disabled={imageIndex === 0 || heroSubmitting}
                        onClick={() => handleHeroMoveImage(imageIndex, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin__edit-btn"
                        disabled={imageIndex === rawHero.images.length - 1 || heroSubmitting}
                        onClick={() => handleHeroMoveImage(imageIndex, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin__news-delete"
                        disabled={heroSubmitting || rawHero.images.length <= 1}
                        onClick={() => handleHeroImageDelete(imagePath)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="admin__news admin__projects">
          <form className="admin__news-form" onSubmit={handleProjectSubmit}>
            <h2>{editingProjectId ? `프로젝트 수정 (ID ${editingProjectId})` : '프로젝트 추가'}</h2>
            <p className="admin__hint">
              썸네일은 JPG, PNG, WEBP (최대 100MB) · 갤러리는 이미지 + MP4, WEBM, MOV 영상 (최대 100MB) 업로드 가능합니다.
              {editingProjectId ? ' 수정 시 파일을 선택하지 않으면 기존 미디어가 유지됩니다.' : ''}
            </p>
            <div className="admin__news-grid">
              <label>
                <span>{editingProjectId ? '이미지 폴더' : '폴더명 (선택)'}</span>
                <input
                  type="text"
                  value={projectForm.slug}
                  onChange={(e) => handleProjectField('slug', e.target.value)}
                  placeholder="my-project"
                  readOnly={Boolean(editingProjectId)}
                />
              </label>
              <label>
                <span>날짜</span>
                <input
                  type="text"
                  value={projectForm.date}
                  onChange={(e) => handleProjectField('date', e.target.value)}
                  placeholder="2026.03"
                  required
                />
              </label>
              <label>
                <span>카테고리</span>
                <select
                  value={projectForm.tagKey}
                  onChange={(e) => handleProjectField('tagKey', e.target.value)}
                  required
                >
                  <option value="">선택</option>
                  {PROJECT_TAGS.map((tag) => (
                    <option key={tag.key} value={tag.key}>
                      {tag.ko} / {tag.en}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>클라이언트 / 브랜드</span>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => handleProjectField('title', e.target.value)}
                  required
                />
              </label>
              <label>
                <span>프로젝트명 (부제)</span>
                <input
                  type="text"
                  value={projectForm.subtitle}
                  onChange={(e) => handleProjectField('subtitle', e.target.value)}
                  required
                />
              </label>
              <label>
                <span>지역</span>
                <input
                  type="text"
                  value={projectForm.location}
                  onChange={(e) => handleProjectField('location', e.target.value)}
                />
              </label>
              <label className="admin__news-field--full">
                <span>소개 (한국어)</span>
                <textarea
                  rows={4}
                  value={projectForm.descriptionKo}
                  onChange={(e) => handleProjectField('descriptionKo', e.target.value)}
                />
              </label>
              <label className="admin__news-field--full">
                <span>소개 (English)</span>
                <textarea
                  rows={4}
                  value={projectForm.descriptionEn}
                  onChange={(e) => handleProjectField('descriptionEn', e.target.value)}
                />
              </label>
              <label className="admin__news-field--full">
                <span>진행 범위 (한국어, 줄바꿈)</span>
                <textarea
                  rows={4}
                  value={projectForm.scopeKo}
                  onChange={(e) => handleProjectField('scopeKo', e.target.value)}
                />
              </label>
              <label className="admin__news-field--full">
                <span>진행 범위 (English, 줄바꿈)</span>
                <textarea
                  rows={4}
                  value={projectForm.scopeEn}
                  onChange={(e) => handleProjectField('scopeEn', e.target.value)}
                />
              </label>
              <label className="admin__news-field--full">
                <span>{editingProjectId ? '새 썸네일 (선택)' : '썸네일 이미지'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProjectThumb(e.target.files?.[0] || null)}
                />
              </label>
              {editingProjectId && existingThumb && (
                <div className="admin__news-field--full admin__existing-media">
                  <span>현재 썸네일</span>
                  <img src={existingThumb} alt="" className="admin__project-preview" />
                </div>
              )}
              <label className="admin__news-field--full">
                <span>{editingProjectId ? '갤러리 추가 (선택)' : '갤러리 이미지·영상 (복수 선택)'}</span>
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={(e) => setProjectGallery(Array.from(e.target.files || []))}
                />
              </label>
              {editingProjectId && existingGallery.length > 0 && (
                <div className="admin__news-field--full admin__existing-media">
                  <span>현재 갤러리 (삭제할 항목 선택)</span>
                  <div className="admin__gallery-grid">
                    {existingGallery.map((mediaPath) => (
                      <label key={mediaPath} className="admin__gallery-item">
                        <input
                          type="checkbox"
                          checked={removeGalleryPaths.includes(mediaPath)}
                          onChange={() => toggleRemoveGalleryPath(mediaPath)}
                        />
                        {isVideoSrc(mediaPath) ? (
                          <video src={mediaPath} muted playsInline preload="metadata" />
                        ) : (
                          <img src={mediaPath} alt="" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {projectError && <p className="admin__error">{projectError}</p>}
            {projectSuccess && <p className="admin__success">{projectSuccess}</p>}
            <div className="admin__form-actions">
              <button type="submit" className="admin__news-submit" disabled={projectSubmitting}>
                {projectSubmitting
                  ? '저장 중...'
                  : editingProjectId
                    ? '변경사항 저장'
                    : '프로젝트 등록'}
              </button>
              {editingProjectId && (
                <button type="button" className="admin__cancel-btn" onClick={resetProjectForm}>
                  수정 취소
                </button>
              )}
            </div>
          </form>

          <div className="admin__news-list">
            <h2>등록된 프로젝트</h2>
            {loading && projects.length === 0 ? (
              <p className="admin__empty">불러오는 중...</p>
            ) : projects.length === 0 ? (
              <p className="admin__empty">등록된 프로젝트가 없습니다.</p>
            ) : (
              <ul>
                {projects.map((item) => (
                  <li key={item.id} className="admin__news-item">
                    <div className="admin__project-item">
                      {item.thumb && (
                        <img src={item.thumb} alt="" className="admin__project-thumb" />
                      )}
                      <div>
                        <span className="admin__news-item-category">{item.tag?.ko || item.tag}</span>
                        <strong>{item.subtitle || item.title}</strong>
                        <span className="admin__news-item-meta">
                          {item.date} · {item.title} · ID {item.id}
                        </span>
                      </div>
                    </div>
                    <div className="admin__item-actions">
                      <button
                        type="button"
                        className="admin__edit-btn"
                        onClick={() => handleProjectEdit(item)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="admin__news-delete"
                        onClick={() => handleProjectDelete(item.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
