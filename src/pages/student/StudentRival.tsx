// AXIS LMS v1.2 - StudentRival (Phase 3D v3-r1 신규)
// 학생 전용 Rival 화면 — 조회 전용 Foundation 화면.
//
// 정책(기존 원칙 그대로 유지):
//   - 학생 실명은 이 화면 어디에도 노출하지 않는다. 표시는 항상 닉네임/티어 기준.
//   - 상대 학생의 studentId, 반, 전화번호 등 식별 정보는 노출하지 않는다(닉네임만).
//   - Rival 관계 자체는 관리자(RivalManagement.tsx)가 관리한다 — 이 화면에서 학생이
//     상대를 직접 지정/변경/종료할 수 없다(조회 전용 Foundation).
//   - 닉네임이 없으면 Rival 기능을 사용할 수 없다(마이페이지에서 먼저 설정 안내).
//   - 합격률/합격 가능성 등 표현 금지, 재무/수납 노출 금지 — 이 화면과 무관하지만 전역 원칙 재확인.

import { Link } from 'wouter';
import { Swords, Trophy, Shield, Flame, Users, ChevronRight } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { loadStudentProfile, canUseRival } from '@/lib/studentProfile';
import { TIER_LABELS, TIER_COLORS } from '@/lib/growthData';

export default function StudentRival() {
  const { currentUser } = useAuth();
  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const { getProfile, getRivalInfo } = useGrowth();

  const storedProfile = loadStudentProfile(myStudentId);
  const hasNickname = canUseRival(myStudentId);
  const profile = getProfile(myStudentId);
  const rivalInfo = hasNickname ? getRivalInfo(myStudentId) : null;

  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '미분류';

  if (!hasNickname) {
    return (
      <StudentLayout title="Rival">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
          <div className="axis-card p-8 text-center">
            <Swords size={32} className="mx-auto mb-3" style={{ color: 'oklch(0.75 0.01 250)' }} />
            <div className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.3 0.02 250)' }}>
              닉네임을 먼저 설정해주세요
            </div>
            <div className="text-xs mb-4" style={{ color: 'oklch(0.6 0.015 250)' }}>
              Rival 기능은 닉네임 설정 후 사용할 수 있습니다. 실명은 상대방에게 노출되지 않습니다.
            </div>
            <Link href="/student/my">
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#081F4D' }}>
                마이페이지에서 설정하기
              </button>
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const relation = rivalInfo?.relation;
  const rivalProfile = rivalInfo?.currentRivalProfile;
  const challengersCount = rivalInfo?.challengersCount ?? 0;

  return (
    <StudentLayout title="Rival">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 내 Rival 카드 */}
        <div className="axis-card p-5" style={{ background: `linear-gradient(135deg, ${tierColor}14, white)` }}>
          <div className="flex items-center gap-2 mb-1">
            <Swords size={16} style={{ color: '#7C3AED' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.5 0.015 250)' }}>내 Rival 전적</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black text-white" style={{ background: tierColor }}>
                {storedProfile.nickname?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>@{storedProfile.nickname}</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{tierLabel} · SP {profile?.totalSP.toLocaleString() ?? 0}</div>
              </div>
            </div>
          </div>

          {relation ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'white' }}>
                <div className="font-black text-base tabular-nums" style={{ color: 'oklch(0.45 0.15 160)' }}>{relation.wins}</div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>승</div>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'white' }}>
                <div className="font-black text-base tabular-nums" style={{ color: 'oklch(0.55 0.2 27)' }}>{relation.losses}</div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>패</div>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: 'white' }}>
                <div className="font-black text-base tabular-nums" style={{ color: '#081F4D' }}>{relation.winRate.toFixed(0)}%</div>
                <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>승률</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
              아직 진행 중인 Rival 대결이 없습니다.
            </div>
          )}

          {relation && relation.streak !== 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: relation.streak > 0 ? 'oklch(0.45 0.15 160)' : 'oklch(0.55 0.2 27)' }}>
              <Flame size={12} /> {Math.abs(relation.streak)}연{relation.streak > 0 ? '승' : '패'}
            </div>
          )}
        </div>

        {/* 상대 Rival 정보 — 닉네임/티어만, 실명·개인식별 정보 없음 */}
        {rivalProfile && (
          <div className="axis-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} style={{ color: '#081F4D' }} />
              <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>현재 Rival 상대</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black text-white"
                style={{ background: TIER_COLORS[rivalProfile.tier] }}>
                {rivalProfile.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>@{rivalProfile.nickname}</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{TIER_LABELS[rivalProfile.tier]}</div>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'oklch(0.6 0.015 250)' }}>
              ※ 상대의 실명·반·연락처는 표시되지 않습니다.
            </p>
          </div>
        )}

        {/* 나에게 도전한 학생 수 — 식별 정보 없이 건수만 */}
        <div className="axis-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} style={{ color: '#081F4D' }} />
            <span className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>나에게 도전한 학생</span>
          </div>
          <span className="font-bold text-sm tabular-nums" style={{ color: '#081F4D' }}>{challengersCount}명</span>
        </div>

        {/* 성장 진열장 바로가기 */}
        <Link href="/student/growth" style={{ display: 'block' }}>
          <div className="axis-card axis-card-clickable p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={15} style={{ color: tierColor }} />
              <span className="text-sm font-medium" style={{ color: 'oklch(0.3 0.02 250)' }}>성장 진열장에서 엠블럼 확인하기</span>
            </div>
            <ChevronRight size={14} style={{ color: 'oklch(0.7 0.01 250)' }} />
          </div>
        </Link>

      </div>
    </StudentLayout>
  );
}
