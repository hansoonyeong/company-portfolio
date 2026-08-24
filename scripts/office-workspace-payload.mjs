/** Shared Korean workspace import payload (user-facing content). */

export const DOS_ID = 'proj-dos'

export const SEED_DEFAULTS = {
  'proj-soono': {
    description: '사진, 디자인, 웹사이트, 마케팅을 아우르는 크리에이티브 스튜디오.',
    currentGoal: '스튜디오 운영과 클라이언트 프로젝트 조율',
  },
  'proj-kimchi': {
    description: '시드니 한식 프리오더 · 딜리버리 비즈니스.',
    currentGoal: '주문 여정과 고객 안내 개선',
  },
  'proj-hangeul': {
    description: '한글 스낵 시드니 유통 프로젝트.',
    currentGoal: '시드니 시장 조사와 입점 채널 탐색',
  },
  'proj-dog': {
    description: '호주 펫 트릿 OEM 사업 개발.',
    currentGoal: '공급망 · 브랜드 포지셔닝 정리',
  },
  'proj-wedding': {
    description: '웨딩 준비와 벤더 조율.',
    currentGoal: '청첩장 · RSVP · 일정 관리',
  },
}

export const PROJECTS = [
  {
    id: 'proj-soono',
    name: 'soono',
    description:
      '시드니 기반의 크리에이티브 스튜디오. 디자인, 사진·미디어, 웹사이트 제작 및 마케팅 업무를 통합하여 제공한다.',
    status: 'active',
    currentGoal:
      'soono의 크리에이티브 비즈니스를 운영하면서 내부 프로젝트와 업무를 통합 관리할 수 있는 AI Office를 구축하고 실제 업무에 활용한다.',
  },
  {
    id: 'proj-kimchi',
    name: 'Kimchi House AU',
    description:
      '기존 이킴김치(iikimchi)에서 리브랜딩한 시드니 한식 선주문·배송 브랜드. 김치 판매뿐 아니라 카카오채널, 고객 주문 및 배송 안내 시스템을 함께 운영한다.',
    status: 'active',
    currentGoal:
      '선주문 및 배송 운영을 명확하게 관리하고, 고객이 쉽고 편하게 주문할 수 있도록 Kimchi House AU의 브랜드와 주문 경험을 개선한다.',
  },
  {
    id: 'proj-hangeul',
    name: 'Hangeul Snack',
    description: 'Kalphabets 한글과자 및 관련 상품의 시드니 론칭·유통 프로젝트.',
    status: 'active',
    currentGoal:
      'Kalphabets의 시드니 첫 론칭을 준비하고 초기 주문 구성, 유통 구조, 판매처 및 마케팅 계획을 확정한다.',
  },
  {
    id: 'proj-dog',
    name: 'Dog Treats',
    description: '호주 현지 제조 기반의 반려견 간식 제품 개발 및 OEM/Private Label 제조 프로젝트.',
    status: 'planning',
    currentGoal: '적합한 호주 제조사를 찾고 샘플 제작, MOQ, 생산 방식 및 초기 상품의 가능성을 확인한다.',
  },
  {
    id: 'proj-wedding',
    name: 'Wedding',
    description:
      '결혼식, 모바일 청첩장, RSVP, 식사 예약, 애프터 참석 및 행사 운영을 통합 관리하는 프로젝트.',
    status: 'active',
    currentGoal:
      '모바일 청첩장과 RSVP 시스템을 완성하고 식사, 참석자 관리 및 남은 결혼식 운영 사항을 확정한다.',
  },
]

export const MEMORY = {
  'proj-soono': [
    {
      category: 'business_info',
      title: '사업 포지셔닝',
      content:
        'soono는 시드니 기반의 크리에이티브 스튜디오로 디자인, 사진·미디어 제작, 웹사이트 개발 및 마케팅 업무를 통합하여 제공한다. 주요 고객군은 F&B, 리테일, 라이프스타일 관련 비즈니스다.',
      importance: 'critical',
    },
    {
      category: 'products_services',
      title: '주요 서비스',
      content:
        '주요 서비스 영역은 브랜드 아이덴티티 및 전략, 그래픽 디자인, 사진·미디어 제작, 웹사이트 개발, 마케팅 및 SNS 관련 업무다.',
      importance: 'important',
    },
    {
      category: 'business_info',
      title: '공식 웹사이트',
      content:
        '공식 웹사이트는 soono.au이며 공개 웹사이트와 내부 Admin 시스템이 동일한 기존 애플리케이션 구조 안에서 운영된다.',
      importance: 'critical',
    },
    {
      category: 'business_info',
      title: 'AI Office 위치',
      content:
        'soono AI Office는 기존 soono.au Admin 시스템 안에 통합되어 있다. 주요 관리 영역은 /admin이며 Virtual Office는 /admin/office에서 운영한다.',
      importance: 'critical',
    },
    {
      category: 'business_info',
      title: '현재 AI Office 구조',
      content:
        'AI Office는 React 19, Vite 8, React Router 7, Express 5 기반이며 Office 데이터는 기존 Render persistent disk의 별도 JSON 데이터로 저장한다. 기존 공개 웹사이트 CMS 데이터와 Office 데이터는 분리하여 관리한다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '공개 웹사이트 보호 원칙',
      content:
        'AI Office 개발 및 수정으로 인해 soono.au 공개 사이트, 견적 요청, 소식 관리, 히어로 관리, 포트폴리오 CMS, 기존 업로드 파일 및 Wedding RSVP 시스템이 손상되거나 불필요하게 변경되어서는 안 된다.',
      importance: 'critical',
    },
    {
      category: 'rules',
      title: 'Manual Mode 운영',
      content:
        '현재 AI Office는 유료 AI API 없이도 사용할 수 있는 Manual Mode를 중심으로 운영한다. 기존 AI API 연동 구조는 향후 필요할 때 다시 활성화할 수 있도록 유지한다.',
      importance: 'critical',
    },
    {
      category: 'rules',
      title: 'Memory · Note · Task 구분',
      content:
        'Memory에는 앞으로 계속 참고해야 하는 확정 정보를 저장한다. Note에는 아이디어, 조사 내용, 미확정 자료를 저장한다. Task에는 아직 실행하거나 확인해야 하는 업무를 저장한다.',
      importance: 'important',
    },
  ],
  'proj-kimchi': [
    {
      category: 'business_info',
      title: '브랜드 변경',
      content: '기존 iikimchi(이킴김치) 브랜드를 Kimchi House AU로 리브랜딩하여 운영한다.',
      importance: 'important',
    },
    {
      category: 'brand_voice',
      title: '핵심 브랜드 메시지',
      content:
        '약 9년간 한국에서 정기적으로 직접 들여온 100% 한국산 포기김치를 판매해온 이력을 핵심 브랜드 신뢰 요소로 활용한다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '선주문 판매 방식',
      content:
        '기본적으로 월별 또는 차수별 선주문 방식으로 운영한다. 고객이 선주문 기간에 주문하고 이후 예정된 다음 배송 차수에 상품을 배송하는 구조다.',
      importance: 'critical',
    },
    {
      category: 'rules',
      title: '무료배송 기준',
      content: '현재 주문 정책상 총 주문금액 AUD $100 이상은 무료배송 대상이다.',
      importance: 'critical',
    },
    {
      category: 'customers',
      title: '고객 사용성 원칙',
      content:
        '디지털 주문 과정에 익숙하지 않은 고객과 고령 고객도 이용할 수 있으므로 주문 방법과 카카오 안내는 최대한 간단하고 명확하게 작성해야 한다.',
      importance: 'important',
    },
    {
      category: 'contacts',
      title: '카카오채널 운영',
      content:
        'Kimchi House AU는 카카오채널을 상품 안내, 주문 안내, 프로모션 및 고객 커뮤니케이션 채널로 활용한다. 필요할 경우 기존 전화 및 카카오 주문 방식도 병행할 수 있다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '기본 주문 안내 흐름',
      content:
        '권장 고객 흐름은 카카오채널 추가 → 상품 안내 확인 → 예약주문하기 → 이름·연락처·주소·결제방법·품목 및 수량 입력 순서다. 특히 고령 고객도 쉽게 이해할 수 있도록 안내해야 한다.',
      importance: 'important',
    },
    {
      category: 'products_services',
      title: '주요 상품군',
      content:
        '포기김치를 중심으로 총각김치, 열무김치, 파김치, 백김치, 갓김치 등의 별미김치와 장아찌 및 일부 한국 식품을 함께 판매할 수 있다. 판매 품목은 주문 차수에 따라 달라질 수 있다.',
      importance: 'normal',
    },
    {
      category: 'pricing',
      title: '가격 변동 원칙',
      content:
        '상품 가격 및 할인 가격은 주문 차수별로 변경될 수 있다. 이전 차수의 가격을 현재 확정 가격으로 사용하지 말고 최신 차수 정보를 확인해야 한다.',
      importance: 'critical',
    },
    {
      category: 'current_status',
      title: '디지털 주문 운영',
      content:
        'Kimchi House AU 프로젝트는 단순한 브랜드 변경을 넘어 카카오채널 고객 커뮤니케이션, 선주문 접수 및 디지털 주문 경험 개선까지 포함한다.',
      importance: 'important',
    },
  ],
  'proj-hangeul': [
    {
      category: 'business_info',
      title: '프로젝트 브랜드',
      content: 'Kalphabets(한글과자)의 시드니 시장 진출 및 유통을 준비하는 프로젝트다.',
      importance: 'critical',
    },
    {
      category: 'business_info',
      title: '기존 호주 유통 현황',
      content:
        '브리즈번과 멜번에서는 하나로마트 관련 채널을 통해 이미 유통되고 있으며 시드니는 이번 프로젝트의 신규 확장 지역이다.',
      importance: 'important',
    },
    {
      category: 'business_info',
      title: '시드니 파트너십 방향',
      content:
        '단순히 제품을 매입해 판매하는 바이어 역할보다는 시드니에서 Kalphabets 브랜드를 키우는 현지 파트너 방향을 지향한다. 브랜드 스토리와 교육·문화적 가치를 전달할 수 있는 판매 환경을 중요하게 본다.',
      importance: 'critical',
    },
    {
      category: 'current_status',
      title: '시드니 첫 공개 목표',
      content:
        '현재 목표는 2026년 10월 31일 시드니에서 열리는 한국 관련 행사에서 첫 공개 및 론칭하는 것이다. 실제 진행 여부는 선박 및 물류 일정에 따라 최종 확인해야 한다.',
      importance: 'critical',
    },
    {
      category: 'products_services',
      title: '초기 맛 구성',
      content:
        '현재 최신 주문 방향은 초코맛 70%, 마늘맛 30% 구성이다. 이전에 논의했던 3가지 맛 구성은 다시 변경하기 전까지 최신안으로 사용하지 않는다.',
      importance: 'critical',
    },
    {
      category: 'products_services',
      title: '혼합 주문 가능',
      content: '과자, 카드게임 및 굿즈를 함께 혼합하여 주문할 수 있다는 점을 공급사로부터 확인했다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '팔렛 구성 기준',
      content:
        '현재 확인된 물류 기준은 48카톤이 1팔렛이다. 이전에 논의했던 팔렛당 카드게임 100개 구성은 유효한 기준으로 사용하지 않는다.',
      importance: 'critical',
    },
    {
      category: 'pricing',
      title: '초기 주문금액 미확정',
      content:
        '최종 첫 주문 금액과 최소 혼합 주문금액은 아직 확정 정보가 아니다. 공급사로부터 최소 주문 구성 및 견적을 다시 확인한 뒤 확정해야 한다.',
      importance: 'critical',
    },
    {
      category: 'customers',
      title: '시드니 판매 채널 방향',
      content:
        '한인마트 및 아시안 리테일, 팝업 및 행사, 교육기관, 온라인 판매 등을 잠재 판매 채널로 검토한다. Chatswood Gold Mart는 우선 입점 후보 중 하나로 논의되었다.',
      importance: 'important',
    },
    {
      category: 'business_info',
      title: '현지 홍보 네트워크',
      content: '시드니 내 한인 비즈니스 및 커뮤니티 네트워크를 론칭 홍보 채널로 활용할 수 있다.',
      importance: 'normal',
    },
    {
      category: 'business_info',
      title: '브랜드 스토리 전달 원칙',
      content:
        '단순히 동네 마트에 제품을 넓게 배치하는 것보다 Kalphabets의 브랜드 스토리와 한글·교육·문화적 가치를 전달할 수 있는 판매 환경을 우선적으로 고려한다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '호주 라벨 방향',
      content:
        '기존 하나로마트에 사용되는 호주용 라벨 형식을 가능한 한 유지하면서 시드니 유통에 필요한 현지 회사 정보를 수정하는 방향을 검토하고 있다. 최종 적용 가능 여부와 필수 표기사항은 공급사 확인이 필요하다.',
      importance: 'important',
    },
    {
      category: 'products_services',
      title: '별도 온라인몰 운영 검토',
      content:
        '기존 Kalphabets 사이트와 별도로 호주 또는 시드니용 온라인 판매 채널을 운영할 수 있는지 공급사에 확인이 필요한 상태다.',
      importance: 'normal',
    },
  ],
  'proj-dog': [
    {
      category: 'business_info',
      title: 'OEM 제조 방향',
      content:
        '호주 현지 제조사를 통한 OEM 또는 Private Label 방식으로 반려견 간식 제품을 개발하는 방향을 검토하고 있다.',
      importance: 'critical',
    },
    {
      category: 'products_services',
      title: '육포 제품 방향',
      content:
        '육포 형태의 반려견 간식은 현재 검토 중인 제품군에 포함되어 있다. 구체적인 제품 형태와 제조 방식은 제조사 생산 가능 여부를 확인한 뒤 확정한다.',
      importance: 'important',
    },
    {
      category: 'products_services',
      title: '소고기 공급 방향',
      content:
        '현재 계획은 소고기 원재료를 직접 준비하여 제조사에 공급하는 방식이다. 실제 가능 여부는 제조사의 원재료 반입 및 생산 규정 확인이 필요하다.',
      importance: 'critical',
    },
    {
      category: 'contacts',
      title: 'NSW 제조사 탐색 현황',
      content:
        'NSW 내 적합한 제조사를 찾는 데 어려움이 있다. Connex를 검토했으나 현재 프로젝트에서 원하는 제조 방식과 명확하게 맞지 않았다.',
      importance: 'important',
    },
    {
      category: 'contacts',
      title: 'Apetite Foods',
      content:
        'Apetite Foods는 OEM/Private Label 제조 가능 여부, 샘플 비용, MOQ 및 직접 공급하는 소고기 원재료 사용 가능 여부를 문의할 후보 제조사다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '초기 제조사 문의 우선사항',
      content:
        '초기 제조사 문의 단계에서는 불필요하게 상품 세부 내용을 모두 공개하지 않는다. 가장 먼저 확인할 내용은 샘플 또는 테스트 생산 비용, MOQ 또는 최소 생산금액, Private Label 가능 여부 및 직접 공급하는 소고기 원재료 사용 가능 여부다.',
      importance: 'critical',
    },
    {
      category: 'current_status',
      title: '주요 미확정 사항',
      content:
        '현재 주요 확인사항은 샘플 비용, MOQ 또는 최소 생산금액, 제조 가능 방식, 포장 옵션, 필요한 테스트 또는 규정, 생산 리드타임이다.',
      importance: 'critical',
    },
  ],
  'proj-wedding': [
    {
      category: 'current_status',
      title: '결혼식 날짜',
      content: '현재 모바일 청첩장 제작에 사용되는 결혼식 날짜는 2027년 5월 15일이다.',
      importance: 'critical',
    },
    {
      category: 'business_info',
      title: '예식 장소',
      content: '현재 청첩장 프로젝트에서 예식 장소는 울산 MIGIUI로 관리한다.',
      importance: 'critical',
    },
    {
      category: 'business_info',
      title: '예식 장소 주소',
      content: '울산 울주군 상북면 등억알프스로 170',
      importance: 'important',
    },
    {
      category: 'business_info',
      title: '모바일 청첩장',
      content: '모바일 청첩장과 RSVP 시스템은 웹 기반으로 제작하며 soono.au 도메인 구조를 활용할 수 있다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: 'RSVP 필수 기능',
      content:
        '참석 여부뿐 아니라 식사 예약 및 애프터 참석 여부까지 하나의 RSVP 흐름에서 선택할 수 있도록 한다.',
      importance: 'critical',
    },
    {
      category: 'rules',
      title: '동반 참석자 이름',
      content: '2명 이상 참석하는 예약의 경우 함께 참석하는 사람의 이름도 입력할 수 있어야 한다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '잔여석 공개 기준',
      content: '식사 예약의 정확한 잔여 좌석 수는 남은 좌석이 15석 이하가 되었을 때부터 공개한다.',
      importance: 'critical',
    },
    {
      category: 'rules',
      title: '도동산방 식사 방향',
      content:
        '결혼식 참석자 식사는 도동산방을 중심으로 운영하는 방향이며 식사 세션과 인원 관리가 필요하다. 과거 논의된 정원과 식사 시간을 최종 확정값으로 자동 사용하지 않는다.',
      importance: 'important',
    },
    {
      category: 'rules',
      title: '예식 시간 최종 확인 필요',
      content:
        '기존 준비 과정에서 서로 다른 예식 및 식사 시간 버전이 논의되었다. 최신 최종 일정이 명확하게 확정되기 전까지 특정 시간을 확정 Memory로 저장하지 않는다.',
      importance: 'critical',
    },
    {
      category: 'business_info',
      title: '모바일 청첩장 구성',
      content:
        '모바일 청첩장은 Cover, Invitation, Our Story 또는 Australia, Venue, Wedding Information, RSVP, Map, Ending 등의 섹션으로 구성하는 방향을 사용한다.',
      importance: 'normal',
    },
  ],
}

export const TASKS = {
  'proj-soono': [
    {
      title: 'AI Office Manual Mode 실사용 테스트',
      assignedAgentId: 'web-developer',
      priority: 'high',
      status: 'todo',
      description:
        '프로젝트 선택, 업무 배정, Copy Brief, Work Result, Waiting, Done 처리 및 새로고침 후 데이터 유지까지 Manual Mode 전체 흐름을 실제로 테스트한다.',
    },
    {
      title: '실제 프로젝트 데이터 정리',
      assignedAgentId: 'chief-of-staff',
      priority: 'high',
      status: 'in_progress',
      description:
        'AI Office의 데모성 데이터를 실제 운영 프로젝트 중심으로 정리한다. soono, Kimchi House AU, Hangeul Snack, Dog Treats, Wedding을 관리하며 DOS Taekwondo는 이번 작업에서 제외한다.',
    },
    {
      title: 'AI Office 일상 업무 활용성 검토',
      assignedAgentId: 'chief-of-staff',
      priority: 'medium',
      status: 'todo',
      description:
        '실제 프로젝트 데이터를 넣고 일정 기간 사용한 뒤 Office, Dashboard, Today, Tasks, Notes, Memory 중 실제 일상 업무에서 필요한 기능과 개선할 부분을 정리한다.',
    },
  ],
  'proj-kimchi': [
    {
      title: '현재 주문 차수 정보 확인',
      assignedAgentId: 'operations',
      priority: 'high',
      status: 'todo',
      description:
        '다음 고객 안내 전 현재 판매 품목, 가격, 배송 예정 시기 및 주문 방법이 최신 차수 정보와 일치하는지 확인한다.',
    },
    {
      title: '다음 고객 안내문 준비',
      assignedAgentId: 'copywriter',
      priority: 'high',
      status: 'todo',
      description: '최신 주문 및 배송 정보를 기준으로 다음 카카오 고객 안내문을 준비한다.',
    },
    {
      title: '카카오 주문 안내 사용성 점검',
      assignedAgentId: 'sales-cs',
      priority: 'medium',
      status: 'todo',
      description:
        '고령 고객도 쉽게 이해할 수 있도록 카카오 프로필 및 아이콘 설정, 주문 과정, 품목 선택 방법 등의 안내가 충분히 쉬운지 점검한다.',
    },
  ],
  'proj-hangeul': [
    {
      title: '최소 혼합 주문금액 확인',
      assignedAgentId: 'operations',
      priority: 'urgent',
      status: 'waiting',
      waitingFor: '공급사 최종 견적 및 회신',
      description:
        '과자, 카드게임 및 굿즈 혼합 주문이 가능한 조건에서 실제 첫 주문에 필요한 최소 구성과 총 주문금액을 확인한다.',
    },
    {
      title: '라벨 및 현지 회사정보 확인',
      assignedAgentId: 'operations',
      priority: 'high',
      status: 'waiting',
      waitingFor: '공급사 확인',
      description:
        '기존 호주용 라벨을 유지하면서 현지 회사 정보만 변경할 수 있는지 확인하고 라벨에 반드시 들어가야 하는 정보를 최종 확인한다.',
    },
    {
      title: '첫 주문 및 팔렛 구성안 작성',
      assignedAgentId: 'operations',
      priority: 'high',
      status: 'todo',
      description:
        '48카톤 = 1팔렛 기준과 초코 70% / 마늘 30% 방향을 사용하여 첫 주문 구성안을 작성한다. 확정되지 않은 MOQ나 가격은 임의로 가정하지 않는다.',
    },
    {
      title: '시드니 판매처 리스트 정리',
      assignedAgentId: 'sales-cs',
      priority: 'high',
      status: 'todo',
      description:
        '리테일 매장, 교육기관, 행사·팝업 및 온라인 판매처를 포함한 시드니 판매 채널 후보 리스트를 정리하고 진행 상태를 관리한다.',
    },
    {
      title: '10월 31일 시드니 론칭 계획',
      assignedAgentId: 'marketing',
      priority: 'high',
      status: 'todo',
      description:
        '2026년 10월 31일 첫 공개를 목표로 제품 소개, 시식 또는 카드게임 체험, 브랜드 스토리 전달, 현장 홍보 및 행사 이후 구매처 안내까지 포함한 론칭 계획을 준비한다.',
    },
    {
      title: '별도 온라인몰 운영 가능 여부 확인',
      assignedAgentId: 'operations',
      priority: 'medium',
      status: 'waiting',
      waitingFor: '공급사 확인',
      description:
        '기존 Kalphabets 사이트 외에 호주 또는 시드니에서 별도 온라인몰을 운영할 수 있는지 확인한다.',
    },
    {
      title: '론칭 예산 옵션 정리',
      assignedAgentId: 'chief-of-staff',
      priority: 'medium',
      status: 'todo',
      description:
        '최소안, 중간안, 확장안으로 나누어 론칭 비용을 비교할 수 있도록 정리한다. 과거 논의된 AUD $5,000–7,000을 필수 예산으로 가정하지 않는다.',
    },
  ],
  'proj-dog': [
    {
      title: '호주 제조사 추가 탐색 및 문의',
      assignedAgentId: 'operations',
      priority: 'high',
      status: 'todo',
      description:
        '직접 공급하는 소고기 원재료를 사용할 수 있는 OEM/Private Label 반려견 간식 제조사를 중심으로 호주 내 추가 후보를 탐색하고 문의한다.',
    },
    {
      title: 'Apetite Foods 문의',
      assignedAgentId: 'sales-cs',
      priority: 'high',
      status: 'todo',
      description:
        'Apetite Foods에 Private Label 제조 가능 여부, 샘플 또는 테스트 생산 비용, MOQ 또는 최소 생산금액 및 직접 공급하는 소고기 사용 가능 여부를 중심으로 문의한다.',
    },
    {
      title: '제조사 조건 비교',
      assignedAgentId: 'research',
      priority: 'medium',
      status: 'todo',
      description:
        '제조사 회신이 확보되면 MOQ, 샘플 비용, 제조 방식, 포장, 테스트 요구사항, 생산 리드타임 및 원재료 공급 조건을 비교한다.',
    },
    {
      title: '첫 테스트 상품 확정',
      assignedAgentId: 'chief-of-staff',
      priority: 'medium',
      status: 'todo',
      description:
        '제조 가능성과 비용이 확인된 후 초기 제품군을 과도하게 늘리지 않고 가장 현실적인 첫 테스트 상품을 결정한다.',
    },
  ],
  'proj-wedding': [
    {
      title: '최종 결혼식 일정 확정',
      assignedAgentId: 'operations',
      priority: 'high',
      status: 'todo',
      description:
        '청첩장 최종 공개 전 예식, 식사 및 애프터 관련 정확한 시간을 최종 확인한다. 기존 자료의 서로 다른 시간 버전을 그대로 사용하지 않는다.',
    },
    {
      title: 'Wedding RSVP 기능 완성',
      assignedAgentId: 'web-developer',
      priority: 'high',
      status: 'in_progress',
      description:
        '참석 여부, 참석 인원 및 동반자 이름, 식사 선택, 잔여석 표시 규칙, 애프터 참석 여부까지 포함한 모바일 RSVP 흐름을 완성한다.',
    },
    {
      title: '모바일 청첩장 문구 최종 검토',
      assignedAgentId: 'copywriter',
      priority: 'medium',
      status: 'todo',
      description:
        '최종 일정과 하객 운영 방식이 확정된 후 모바일 청첩장 전체 문구와 안내 내용을 최종 검토한다.',
    },
    {
      title: '식사 세션 및 정원 최종 확인',
      assignedAgentId: 'operations',
      priority: 'high',
      status: 'todo',
      description:
        '청첩장에 식사 예약 정보를 공개하기 전 도동산방 식사 세션별 시간과 실제 정원을 최종 확인한다.',
    },
    {
      title: 'Wedding 사이트 최종 QA',
      assignedAgentId: 'web-developer',
      priority: 'high',
      status: 'todo',
      description:
        '하객에게 청첩장을 배포하기 전 한국 모바일 환경에서 사이트 접속, 모바일 레이아웃, RSVP 입력 유지, 참석 인원, 식사 잔여석 계산 및 Wedding Admin 관리 기능을 최종 테스트한다.',
    },
  ],
}
