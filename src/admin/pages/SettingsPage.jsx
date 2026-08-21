import { useEffect, useState } from 'react'
import { getAiStatus } from '../../lib/officeApi'
import '../office/office.css'

export default function SettingsPage() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAiStatus()
      .then(setStatus)
      .catch((err) => setError(err.message || '상태를 불러오지 못했습니다.'))
  }, [])

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">시스템</p>
      <h2 className="office-page__title">설정</h2>
      <p className="office-page__lead">AI Office 환경과 인증 설정입니다.</p>
      <div className="office-card-grid">
        <section className="office-card">
          <h3>OpenAI Status</h3>
          {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
          {status ? (
            <>
              <p>
                {status.configured ? (
                  <span className="office-badge">Connected</span>
                ) : (
                  <span className="office-badge">Not configured</span>
                )}
              </p>
              <p style={{ marginTop: 8 }}>Model: {status.model}</p>
              {!status.configured ? (
                <p style={{ marginTop: 10 }}>
                  OpenAI is not configured yet.
                  <br />
                  Add OPENAI_API_KEY to the server environment.
                </p>
              ) : null}
            </>
          ) : (
            !error && <p>불러오는 중…</p>
          )}
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
