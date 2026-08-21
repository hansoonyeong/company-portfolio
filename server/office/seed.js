const now = () => new Date().toISOString()

export const AGENT_DEFS = [
  {
    id: 'chief-of-staff',
    name: '총괄 매니저',
    role: '기획 · 조율',
    description: '우선순위와 일정을 정리하고 팀을 조율합니다.',
    homeZone: 'executive',
    accent: '#c4a574',
    hair: '#2c2c2c',
    clothing: '#3a3a3a',
  },
  {
    id: 'marketing',
    name: '마케팅',
    role: '캠페인 · 콘텐츠 기획',
    description: '캠페인과 주간 콘텐츠를 기획합니다.',
    homeZone: 'marketing',
    accent: '#d4a574',
    hair: '#4a3728',
    clothing: '#5c6b5a',
  },
  {
    id: 'copywriter',
    name: '카피라이터',
    role: '카피 · 커뮤니케이션',
    description: '고객 메시지와 카피를 작성합니다.',
    homeZone: 'marketing',
    accent: '#b8956a',
    hair: '#1f1f1f',
    clothing: '#6b5c52',
  },
  {
    id: 'design-director',
    name: '디자인 디렉터',
    role: '크리에이티브 디렉션',
    description: '비주얼과 브랜드 방향을 잡습니다.',
    homeZone: 'creative',
    accent: '#9a8b7a',
    hair: '#3d2e24',
    clothing: '#4a5560',
  },
  {
    id: 'research',
    name: '리서치',
    role: '조사 · 분석',
    description: '시장과 경쟁을 조사합니다.',
    homeZone: 'research',
    accent: '#8a9a8e',
    hair: '#2a2a2a',
    clothing: '#5a5560',
  },
  {
    id: 'sales-cs',
    name: '세일즈 · CS',
    role: '고객 · 영업 지원',
    description: '견적과 고객 응대를 돕습니다.',
    homeZone: 'sales',
    accent: '#c9a88a',
    hair: '#3c2f28',
    clothing: '#6a5a4e',
  },
  {
    id: 'web-developer',
    name: '웹 개발',
    role: '웹 · 기술',
    description: '웹사이트와 기술 이슈를 담당합니다.',
    homeZone: 'development',
    accent: '#7a8a94',
    hair: '#222222',
    clothing: '#3e4850',
  },
  {
    id: 'operations',
    name: '운영',
    role: '운영 · 공급',
    description: '프로세스와 공급망을 관리합니다.',
    homeZone: 'operations',
    accent: '#a09080',
    hair: '#2e2e2e',
    clothing: '#55504a',
  },
]

export function seedProjects() {
  const t = now()
  return [
    {
      id: 'proj-soono',
      name: 'soono',
      description: '사진, 디자인, 웹사이트, 마케팅을 아우르는 크리에이티브 스튜디오.',
      status: 'active',
      currentGoal: '스튜디오 운영과 클라이언트 프로젝트 조율',
      icon: '◎',
      color: '#1a1a1a',
      archived: false,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'proj-dos',
      name: 'DOS Taekwondo',
      description: '키즈 태권도 학원 마케팅과 운영.',
      status: 'active',
      currentGoal: '주간 콘텐츠와 학부모 소통 강화',
      icon: '◆',
      color: '#5c6b5a',
      archived: false,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'proj-kimchi',
      name: 'Kimchi House AU',
      description: '시드니 한식 프리오더 · 딜리버리 비즈니스.',
      status: 'active',
      currentGoal: '주문 여정과 고객 안내 개선',
      icon: '◇',
      color: '#6b5c52',
      archived: false,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'proj-hangeul',
      name: 'Hangeul Snack',
      description: '한글 스낵 시드니 유통 프로젝트.',
      status: 'active',
      currentGoal: '시드니 시장 조사와 입점 채널 탐색',
      icon: '▣',
      color: '#8a9a8e',
      archived: false,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'proj-dog',
      name: 'Dog Treats',
      description: '호주 펫 트릿 OEM 사업 개발.',
      status: 'planning',
      currentGoal: '공급망 · 브랜드 포지셔닝 정리',
      icon: '○',
      color: '#a09080',
      archived: false,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'proj-wedding',
      name: 'Wedding',
      description: '웨딩 준비와 벤더 조율.',
      status: 'active',
      currentGoal: '청첩장 · RSVP · 일정 관리',
      icon: '✦',
      color: '#c4a574',
      archived: false,
      createdAt: t,
      updatedAt: t,
    },
  ]
}

export function seedAgents() {
  const t = now()
  return AGENT_DEFS.map((def) => ({
    ...def,
    responsibilities: [],
    systemPromptKey: def.id,
    currentZone: def.homeZone,
    state: 'idle',
    currentTaskId: null,
    currentProjectId: null,
    statusMessage: '대기 중',
    previousState: null,
    createdAt: t,
    updatedAt: t,
  }))
}

export function seedTasks() {
  return []
}

export function seedNotes() {
  return []
}

export function seedMemory() {
  return []
}

export function seedActivity() {
  return []
}

export function seedMeetings() {
  return []
}

export function seedConversations() {
  return []
}
