export const weddingConfig = {
  entry: {
    welcome: 'we invite you to our little corner of the day',
    withSound: 'enter with sound ·',
    withoutSound: 'enter without sound',
    enter: 'enter ·',
  },
  couple: {
    groom: 'TAEJOO',
    bride: 'SOONYEONG',
    groomKo: '태주',
    brideKo: '순영',
  },
  date: '2027-05-15',
  dateDisplay: {
    en: '15 MAY 2027',
    ko: '2027. 05. 15',
    day: '15',
    month: 'MAY',
    year: '2027',
    weekday: 'SATURDAY',
  },
  location: {
    city: 'ULSAN',
    cityKo: '울산',
  },
  ceremonyTime: '',
  ceremonyTimeDisplay: '추후 안내',
  venue: {
    name: '미지의',
    englishName: 'MIGIUI',
    address: '울산',
    addressEn: 'Ulsan, Korea',
    caption: 'A place shaped by light, curves and landscape.',
    description: {
      ko: '미지의는 건축과 공간 자체가 이야기가 되는 장소입니다. 빛과 곡선, 풍경이 전시장처럼 겹칩니다.',
      en: 'MIGIUI is a space where architecture itself becomes the story.',
    },
  },
  meal: {
    venue: '도동산방',
    venueEn: 'DODONGSANBANG',
    sessions: [
      {
        id: 'session1',
        label: 'SESSION 01',
        start: '11:30',
        end: '13:30',
        capacity: 60,
      },
      {
        id: 'session2',
        label: 'SESSION 02',
        start: '13:50',
        end: '15:50',
        capacity: 60,
      },
    ],
  },
  maps: {
    naver: '',
    kakao: '',
  },
  seating: {
    label: 'TAKE ANY SEAT',
    description: {
      ko: '양가 구분 없이 편하신 자리에 자유롭게 앉아주세요.',
      en: 'Please take any seat — no side distinction.',
    },
  },
  invitation: {
    title: { ko: 'INVITATION', en: 'INVITATION' },
    headline: {
      ko: '서로 다른 곳에서 살아온 두 사람이\n같은 방향으로 걸어가려 합니다.',
    },
    body: {
      ko: '따뜻한 마음으로 함께해 주시면 감사하겠습니다.',
      en: 'We would be honoured to celebrate this new chapter with you.',
    },
  },
  story: {
    title: { ko: 'OUR STORY', en: 'OUR STORY' },
    subtitle: { ko: 'WHERE OUR STORY BEGAN', en: 'WHERE OUR STORY BEGAN' },
    place: 'SYDNEY, AUSTRALIA',
    body: {
      ko: '호주에서 만나, 시드니의 바람과 일상을 함께하며 집을 만들어 왔습니다.\n오페라 하우스, 하버 브릿지, 여행, 그리고 두 고양이와 함께한 시간들이 우리의 이야기입니다.',
      en: 'We met in Australia — Sydney, travel, home, and two cats became our story.',
    },
  },
  afterParty: {
    title: 'ONE MORE DRINK?',
    subtitle: 'CHAMPAGNE AFTER PARTY',
    tags: 'Champagne · Music · Friends',
    description: {
      ko: '예식과 식사가 끝난 뒤\n미지의에서 조금 더 머물러주세요.',
      en: 'After the ceremony and lunch, stay a little longer at MIGIUI.',
    },
  },
  ending: {
    line: 'SEE YOU\nIN MAY.',
    date: '15.05.2027',
    place: 'MIGIUI · ULSAN',
  },
  og: {
    title: '태주 & 순영 · 15 May 2027',
    description: '저희의 시작을 함께해주세요.',
    image: '/wedding/og/og.svg',
  },
  reserveFab: {
    label: '자리 예약',
    ariaLabel: '식당 자리 예약하기',
  },
  rsvpWidget: {
    greeting: '참석여부를 알려주세요!',
    intro: '따뜻한 마음으로 함께해 주시면 감사하겠습니다.',
    cta: '참석 알려주기',
    fabAriaOpen: '예약창 열기',
    fabAriaClose: '예약창 닫기',
  },
  /** 음원 파일: public/wedding/audio/bgm.mp3 에 넣으면 됩니다 */
  music: {
    src: '/wedding/audio/bgm.mp3',
    title: 'Wedding BGM',
    volume: 0.45,
    loop: true,
  },
  cats: {
    welssi: { name: '웰씨', description: 'tuxedo · yellow eyes' },
    caessi: { name: '캐씨', description: 'Siamese · blue eyes' },
  },
}

export function getSessionById(id) {
  return weddingConfig.meal.sessions.find((s) => s.id === id) ?? null
}

export function formatSessionTime(session) {
  if (!session) return ''
  return `${session.start} – ${session.end}`
}
