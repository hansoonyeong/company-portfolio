import { useOfficeData } from '../OfficeDataContext'
import '../office/office.css'

export default function SettingsPage() {
  const { providerStatus, isManualMode, isAiMode } = useOfficeData()

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">시스템</p>
      <h2 className="office-page__title">설정</h2>
      <p className="office-page__lead">AI Office 환경과 인증 설정입니다.</p>
      <div className="office-card-grid">
        <section className="office-card">
          <h3>AI Engine</h3>
          <p>
            Mode:{' '}
            <span className="office-badge">{isAiMode ? 'AI Mode' : 'Manual Mode'}</span>
          </p>
          <p style={{ marginTop: 8 }}>
            OpenAI:{' '}
            {providerStatus.configured ? 'Connected' : 'Not configured'}
          </p>
          <p style={{ marginTop: 8 }}>Model: {providerStatus.model || '—'}</p>
          <p style={{ marginTop: 12, color: '#666' }}>
            AI generation is optional. The Office can be used fully in Manual Mode.
          </p>
          {isManualMode ? (
            <p style={{ marginTop: 8, color: '#666', fontSize: '0.9rem' }}>
              To enable AI Mode later, add OPENAI_API_KEY to the server environment.
            </p>
          ) : null}
        </section>
        <section className="office-card">
          <h3>인증</h3>
          <p>ADMIN_PASSWORD → Bearer 토큰 → sessionStorage (기존과 동일)</p>
        </section>
        <section className="office-card">
          <h3>오피스 데이터</h3>
          <p>
            <code>server/data/office-*.json</code>에 저장되며 Render 영속 디스크 경로를 사용합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
