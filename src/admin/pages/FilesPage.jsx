export default function FilesPage() {
  return (
    <div className="office-page">
      <p className="office-page__eyebrow">워크스페이스</p>
      <h2 className="office-page__title">파일</h2>
      <p className="office-page__lead">스토리지 체계를 분리해 두었습니다. 오피스 업로드는 Phase 3입니다.</p>

      <div className="office-card-grid">
        <section className="office-card">
          <h3>웹사이트 미디어</h3>
          <p>
            포트폴리오 · 히어로 이미지는 기존 관리자 업로드(
            <code>server/data/uploads/</code>)를 그대로 사용합니다.
          </p>
          <p style={{ marginTop: 8 }}>
            <a href="/admin/website/portfolio">포트폴리오 관리 →</a>
            <br />
            <a href="/admin/website/hero">히어로 관리 →</a>
          </p>
        </section>
        <section className="office-card">
          <h3>오피스 파일</h3>
          <p>
            프로젝트 첨부 파일 업로드는 기존 Multer/디스크 구조를 안전하게 재사용할 수 있을 때
            Phase 3에서 추가합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
