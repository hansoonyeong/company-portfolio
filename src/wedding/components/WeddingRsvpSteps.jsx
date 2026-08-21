import { weddingConfig, formatSessionTime, getSessionById } from '../config/weddingConfig.js'

function StepShell({ kicker, title, hint, children }) {
  return (
    <div className="wedding-step">
      <p className="w-eyebrow">{kicker}</p>
      <h3 className="wedding-step__title">{title}</h3>
      {hint ? <p className="wedding-hint">{hint}</p> : null}
      {children}
    </div>
  )
}

export default function WeddingRsvpSteps({
  view,
  error,
  submitting,
  sessions,
  primaryGuestName,
  attending,
  guestCount,
  companions,
  mealSession,
  afterPartyIds,
  guestList,
  saved,
  canSelectSession,
  onName,
  onAttend,
  onGuestCount,
  onCompanion,
  onUnknownName,
  onMeal,
  onAfterParty,
  onBack,
  onNext,
  onSubmit,
  onEditAgain,
}) {
  if (view === 'done' && saved) {
    const session = getSessionById(saved.mealSession)
    const afterCount = (saved.guests || []).filter((g) => g.afterPartyAttending).length
    return (
      <StepShell kicker="THANK YOU" title="SEE YOU AT MIGIUI">
        {saved.attending ? (
          <p className="wedding-prose">
            WEDDING · {saved.guestCount} PEOPLE
            {session ? `\nLUNCH · ${formatSessionTime(session)}` : ''}
            {afterCount ? `\nAFTER PARTY · ${afterCount} PEOPLE` : ''}
            {`\n${weddingConfig.dateDisplay.en}`}
          </p>
        ) : (
          <p className="wedding-prose">소중한 마음 전해주셔서 감사합니다.</p>
        )}
        <button type="button" className="wedding-btn" onClick={onEditAgain}>
          예약 내용 변경하기
        </button>
      </StepShell>
    )
  }

  return (
    <div className="wedding-rsvp">
      {view === 'name' && (
        <StepShell kicker="YOUR NAME" title="성함을 알려주세요.">
          <label className="visually-hidden" htmlFor="primaryGuestName">
            대표 예약자
          </label>
          <input
            id="primaryGuestName"
            className="wedding-input"
            value={primaryGuestName}
            onChange={(e) => onName(e.target.value)}
            placeholder="성함"
            autoComplete="name"
            autoCapitalize="words"
          />
        </StepShell>
      )}

      {view === 'attend' && (
        <StepShell kicker="WILL YOU JOIN US?" title="참석 여부">
          <div className="wedding-choice-col" role="group" aria-label="참석 여부">
            <button
              type="button"
              className={`wedding-choice${attending === true ? ' is-selected' : ''}`}
              onClick={() => onAttend(true)}
            >
              참석합니다
            </button>
            <button
              type="button"
              className={`wedding-choice${attending === false ? ' is-selected' : ''}`}
              onClick={() => onAttend(false)}
            >
              참석이 어렵습니다
            </button>
          </div>
        </StepShell>
      )}

      {view === 'count' && (
        <StepShell kicker="HOW MANY?" title="본인을 포함한 총 참석 인원">
          <div className="wedding-stepper" aria-label="총 참석 인원">
            <button type="button" onClick={() => onGuestCount(guestCount - 1)} aria-label="감소">
              −
            </button>
            <span>{guestCount}</span>
            <button type="button" onClick={() => onGuestCount(guestCount + 1)} aria-label="증가">
              +
            </button>
          </div>
        </StepShell>
      )}

      {view === 'companions' && (
        <StepShell kicker="WHO ARE YOU COMING WITH?" title="동반인 이름">
          {companions.slice(0, guestCount - 1).map((companion, index) => (
            <div key={index} className="wedding-companion">
              <label htmlFor={`companion-${index}`}>동반인 {index + 1}</label>
              <input
                id={`companion-${index}`}
                className="wedding-input"
                value={companion.name}
                disabled={companion.unknownName}
                onChange={(e) => onCompanion(index, e.target.value)}
                placeholder="이름을 입력해주세요"
                autoComplete="off"
              />
              <label className="wedding-check">
                <input
                  type="checkbox"
                  checked={companion.unknownName}
                  onChange={(e) => onUnknownName(index, e.target.checked)}
                />
                동반인 이름을 아직 모르겠어요
              </label>
            </div>
          ))}
        </StepShell>
      )}

      {view === 'meal' && (
        <StepShell kicker="CHOOSE YOUR TABLE" title={`${weddingConfig.meal.venue} 식사 시간`}>
          <div className="wedding-sessions" role="group" aria-label="식사 시간">
            {sessions.map((session) => {
              const disabled = !canSelectSession(session)
              const capacity =
                weddingConfig.meal.sessions.find((s) => s.id === session.id)?.capacity ?? 60
              return (
                <button
                  key={session.id}
                  type="button"
                  className={`wedding-session${mealSession === session.id ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
                  disabled={disabled}
                  onClick={() => onMeal(session.id)}
                >
                  <span className="wedding-session__label">{session.label}</span>
                  <span className="wedding-session__start">{session.start}</span>
                  <span className="wedding-session__time">
                    {session.start} – {session.end}
                  </span>
                  <span className="wedding-session__meta">{capacity} seats</span>
                  <span className="wedding-session__status">
                    {session.statusHint ? `${session.statusHint} · ` : ''}
                    {session.statusLabel}
                    {disabled && session.remaining !== null && session.remaining > 0
                      ? ' · 함께 이용하기에는 자리가 부족합니다.'
                      : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </StepShell>
      )}

      {view === 'after' && (
        <StepShell
          kicker="ONE MORE DRINK?"
          title="애프터파티 참석자"
          hint={`${weddingConfig.afterParty.description.ko}\n${weddingConfig.afterParty.tags}`}
        >
          <div className="wedding-checklist">
            {guestList.map((guest) => (
              <label key={guest.id} className="wedding-check">
                <input
                  type="checkbox"
                  checked={afterPartyIds.includes(guest.id)}
                  onChange={(e) => onAfterParty(guest.id, e.target.checked)}
                />
                {guest.name}
              </label>
            ))}
          </div>
          <p className="wedding-hint">{afterPartyIds.length}명이 함께합니다.</p>
        </StepShell>
      )}

      {view === 'confirm' && (
        <StepShell kicker="YOUR DAY" title="최종 확인">
          <div className="wedding-summary">
            <div className="wedding-summary__block">
              <h4>WEDDING</h4>
              {attending ? (
                <>
                  <p>{guestCount} PEOPLE</p>
                  <ul>
                    <li>{primaryGuestName}</li>
                    {companions.slice(0, guestCount - 1).map((c, i) => (
                      <li key={i}>{c.unknownName ? '미입력' : c.name || '미입력'}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>불참</p>
              )}
            </div>
            {attending && mealSession && (
              <div className="wedding-summary__block">
                <h4>LUNCH</h4>
                <p>
                  {formatSessionTime(getSessionById(mealSession))}
                  <br />
                  {guestCount} PEOPLE
                </p>
              </div>
            )}
            {attending && afterPartyIds.length > 0 && (
              <div className="wedding-summary__block">
                <h4>AFTER PARTY</h4>
                <p>{afterPartyIds.length} PEOPLE</p>
                <ul>
                  {guestList
                    .filter((g) => afterPartyIds.includes(g.id))
                    .map((g) => (
                      <li key={g.id}>{g.name}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </StepShell>
      )}

      {error ? (
        <p className="wedding-error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      <div className="wedding-step__nav">
        {view !== 'name' && (
          <button type="button" className="w-text-link" onClick={onBack}>
            ← Back
          </button>
        )}
        {view !== 'confirm' ? (
          <button type="button" className="wedding-btn wedding-btn--fill" onClick={onNext}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="wedding-btn wedding-btn--fill"
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? '전송 중…' : '참석 여부 전달하기'}
          </button>
        )}
      </div>
    </div>
  )
}
