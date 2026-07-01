// AXIS LMS v1.2 — Phase 3D v3-r4: ObservationPanel
//
// "확인 필요한 학생" 강조 패널. 관리자 홈(전체 학생)·선생님 홈(담당 학생)에서 공유한다.
// 일반 카드처럼 묻히지 않도록 상단 강조 헤더 + 좌측 액센트 바로 구성한다.
//
// 표시: 학생명 · 상태 배지 · 감지 이유 · 최근 변화 · [상세 보기] 버튼.
// 모든 신호는 observationSignals에서 자동 산출되며, 이 컴포넌트는 표시만 한다(입력 없음).

import { Link } from 'wouter';
import { Eye, ChevronRight } from 'lucide-react';
import type { StudentObservation } from '@/lib/observationSignals';
import { OBSERVATION_LEVEL_STYLE } from '@/lib/observationSignals';

interface ObservationPanelProps {
  observations: StudentObservation[];
  title?: string;
  scopeNote?: string; // 예: "전체 학생 기준" / "담당 학생 기준"
  detailHref: (studentId: string) => string;
  maxVisible?: number; // 기본 6명까지 표시하고 나머지는 안내
}

export default function ObservationPanel({
  observations,
  title = '확인 필요한 학생',
  scopeNote,
  detailHref,
  maxVisible = 6,
}: ObservationPanelProps) {
  const shown = observations.slice(0, maxVisible);
  const hiddenCount = observations.length - shown.length;

  return (
    <section
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid oklch(0.88 0.06 60)',
        background: 'white',
        boxShadow: '0 1px 3px oklch(0 0 0 / 0.06)',
      }}
    >
      {/* 강조 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'oklch(0.97 0.04 60)', borderBottom: '1px solid oklch(0.9 0.06 60)' }}
      >
        <div className="flex items-center gap-2">
          <Eye size={15} style={{ color: 'oklch(0.4 0.14 60)' }} />
          <span className="text-sm font-bold" style={{ color: 'oklch(0.4 0.12 60)' }}>
            {title}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: 'oklch(0.9 0.08 60)', color: 'oklch(0.42 0.13 60)' }}
          >
            {observations.length}
          </span>
        </div>
        {scopeNote && (
          <span className="text-xs" style={{ color: 'oklch(0.42 0.06 60)' }}>
            {scopeNote}
          </span>
        )}
      </div>

      {/* 목록 */}
      {shown.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.4 0.015 250)' }}>
            지금은 특별히 확인이 필요한 학생이 없습니다.
          </p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.49 0.01 250)' }}>
            테스트·출결·IF 흐름에서 신호가 감지되면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'oklch(0.93 0.006 250)' }}>
          {shown.map((o) => {
            const style = OBSERVATION_LEVEL_STYLE[o.level];
            return (
              <li key={o.studentId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold truncate" style={{ color: 'oklch(0.2 0.02 250)' }}>
                        {o.studentName}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                        style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
                      >
                        {o.level}
                      </span>
                    </div>
                    {/* 감지 이유 칩 */}
                    <div className="flex flex-wrap gap-1 mb-1">
                      {o.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'oklch(0.96 0.004 250)', color: 'oklch(0.35 0.015 250)' }}
                          title={r.detail}
                        >
                          {r.detail}
                        </span>
                      ))}
                    </div>
                    {/* 최근 변화 */}
                    <div className="text-xs" style={{ color: 'oklch(0.42 0.015 250)' }}>
                      최근 변화 · {o.recentChange}
                    </div>
                  </div>

                  {/* 상세 보기 — 버튼처럼 보이는 액션 */}
                  <Link href={detailHref(o.studentId)}>
                    <button
                      className="flex items-center gap-0.5 text-xs font-medium px-2.5 py-1.5 rounded-md flex-shrink-0 transition-colors"
                      style={{ background: '#040D1E', color: 'white' }}
                    >
                      상세 보기 <ChevronRight size={12} />
                    </button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hiddenCount > 0 && (
        <div
          className="px-4 py-2 text-xs text-center"
          style={{ color: 'oklch(0.42 0.015 250)', borderTop: '1px solid oklch(0.93 0.006 250)' }}
        >
          외 {hiddenCount}명 더 · 목록에서 전체 확인
        </div>
      )}
    </section>
  );
}
