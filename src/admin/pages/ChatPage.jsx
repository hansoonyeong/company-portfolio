import AiChatPanel from '../office/AiChatPanel'
import '../office/office.css'

export default function ChatPage() {
  return (
    <div className="office-page">
      <p className="office-page__eyebrow">워크스페이스</p>
      <h2 className="office-page__title">AI 채팅</h2>
      <p className="office-page__lead">프로젝트와 에이전트를 선택해 실제 AI 작업을 요청하세요.</p>
      <AiChatPanel />
    </div>
  )
}
