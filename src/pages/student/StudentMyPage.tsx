// AXIS LMS v1.2 — Phase 2F: StudentMyPage (Student Portal Core Rebuild v1)
// 학생 마이페이지 — 닉네임, 대표 엠블럼, SP, 티어, Rival 공개 프로필
//
// Phase 2F 정책:
//   - 닉네임 없으면 Rival 화면 진입 불가 (설정 안내 표시)
//   - 학생 실명은 Rival 화면에서 절대 노출하지 않음
//   - 전화번호는 마스킹 처리
//   - 닉네임 localStorage mock 저장
//
// ⚠ 금지:
//   - 합격률 / 합격 가능성 / 합격 보장 / 불합격 표현 금지
//   - 수납/재무/청구 표현 금지

import { useState, useEffect } from 'react';
import { User, Edit3, Check, X, Trophy, Zap, Award, Swords, Shield, BookOpen, CalendarCheck } from 'lucide-react';
import StudentLayout from '@/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useGrowth } from '@/contexts/GrowthContext';
import {
  loadStudentProfile,
  validateNickname,
  canUseRival,
  canChangeNicknameNow,
  setStudentNickname,
  NICKNAME_MAX_LEN,
} from '@/lib/studentProfile';
import { detectStudentGradeLevel } from '@/lib/universityMenuLabel';
import { TIER_LABELS, TIER_COLORS, MATERIAL_BADGE } from '@/lib/growthData';
import { Link } from 'wouter';

export default function StudentMyPage() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { getProfile, getStudentEmblems, emblems } = useGrowth();

  const myStudentId = currentUser.assignedStudentIds[0] ?? '';
  const student = students.find(s => s.id === myStudentId);

  const gradeLevel = detectStudentGradeLevel(student);
  const profile = myStudentId ? getProfile(myStudentId) : undefined;
  const myEmblems = myStudentId ? getStudentEmblems(myStudentId).filter(e => e.achieved) : [];
  const myEmblemDefs = myEmblems
    .map(e => ({ se: e, def: emblems.find(d => d.id === e.emblemId) }))
    .filter((x): x is { se: typeof x.se; def: NonNullable<typeof x.def> } => !!x.def);

  // 닉네임 state
  const [storedProfile, setStoredProfile] = useState(loadStudentProfile(myStudentId));
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState('');

  useEffect(() => {
    setStoredProfile(loadStudentProfile(myStudentId));
  }, [myStudentId]);

  function handleEditNick() {
    const gate = canChangeNicknameNow(myStudentId);
    if (!gate.allowed) {
      setNickError(`닉네임은 ${gate.daysRemaining}일 후에 다시 변경할 수 있습니다.`);
      return;
    }
    setNickInput(storedProfile.nickname ?? '');
    setNickError('');
    setEditingNick(true);
  }

  function handleSaveNick() {
    const result = validateNickname(nickInput);
    if (!result.valid) { setNickError(result.reason ?? ''); return; }
    const saveResult = setStudentNickname(myStudentId, nickInput);
    if (!saveResult.ok) { setNickError(saveResult.reason ?? '지금은 닉네임을 변경할 수 없습니다.'); return; }
    setStoredProfile(loadStudentProfile(myStudentId));
    setEditingNick(false);
  }

  function handleCancelNick() {
    setNickInput('');
    setNickError('');
    setEditingNick(false);
  }

  const tierColor = profile ? TIER_COLORS[profile.tier] : 'oklch(0.7 0.01 250)';
  const tierLabel = profile ? TIER_LABELS[profile.tier] : '-';
  const hasNickname = canUseRival(myStudentId);
  const nickGate = canChangeNicknameNow(myStudentId);

  // 전화번호 마스킹
  const maskedPhone = student?.phone
    ? student.phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
    : '미등록';

  // 수강 반 목록
  const enrolledClasses = student?.classes.filter(c => c.status === '수강중') ?? [];

  return (
    <StudentLayout title="마이페이지">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 프로필 카드 */}
        <div className="axis-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
              style={{ background: tierColor }}>
              {(storedProfile.nickname ?? currentUser.name).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base" style={{ color: 'oklch(0.15 0.02 250)' }}>
                {currentUser.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {gradeLevel && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    {gradeLevel}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tierColor + '18', color: tierColor, border: `1px solid ${tierColor}44` }}>
                  {tierLabel}
                </span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                📱 {maskedPhone}
              </div>
            </div>
          </div>

          {/* 소속 반 */}
          {enrolledClasses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {enrolledClasses.map(cls => (
                <span key={cls.id} className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: 'oklch(0.94 0.04 250)', color: 'oklch(0.4 0.1 250)' }}>
                  {cls.name}
                </span>
              ))}
            </div>
          )}

          {/* SP + 엠블럼 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
              <Zap size={16} className="mx-auto mb-1" style={{ color: 'oklch(0.7 0.18 80)' }} />
              <div className="font-black text-base tabular-nums" style={{ color: 'oklch(0.4 0.1 80)' }}>
                {profile?.totalSP.toLocaleString() ?? 0}
              </div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>누적 SP</div>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.96 0.004 250)' }}>
              <Award size={16} className="mx-auto mb-1" style={{ color: tierColor }} />
              <div className="font-black text-base" style={{ color: tierColor }}>{tierLabel}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>현재 티어</div>
            </div>
          </div>
        </div>

        {/* 닉네임 설정 */}
        <div className="axis-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Swords size={16} style={{ color: '#081F4D' }} />
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
              Rival 닉네임
            </span>
            {hasNickname && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'oklch(0.92 0.08 145)', color: 'oklch(0.3 0.15 145)' }}>
                설정 완료
              </span>
            )}
            {!hasNickname && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'oklch(0.93 0.1 25)', color: 'oklch(0.45 0.15 25)' }}>
                미설정
              </span>
            )}
          </div>

          {!editingNick ? (
            <div className="flex items-center justify-between">
              <div>
                {storedProfile.nickname ? (
                  <div className="font-bold text-lg" style={{ color: 'oklch(0.2 0.02 250)' }}>
                    @{storedProfile.nickname}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
                    닉네임을 설정하면 Rival 기능을 사용할 수 있습니다.
                  </div>
                )}
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.65 0.015 250)' }}>
                  닉네임은 Rival, Emblem, 성적 진열장에서 사용됩니다. 닉네임은 2주에 한 번만 변경할 수 있습니다.
                </div>
                {!nickGate.allowed && (
                  <div className="text-xs mt-1 font-medium" style={{ color: 'oklch(0.55 0.15 60)' }}>
                    다음 변경까지 {nickGate.daysRemaining}일 남았습니다.
                  </div>
                )}
              </div>
              <button type="button" onClick={handleEditNick} disabled={!nickGate.allowed}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={nickGate.allowed
                  ? { background: 'oklch(0.95 0.04 250)', color: 'oklch(0.4 0.1 250)', cursor: 'pointer' }
                  : { background: 'oklch(0.96 0.005 250)', color: 'oklch(0.75 0.01 250)', cursor: 'not-allowed' }}>
                <Edit3 size={12} />
                {storedProfile.nickname ? '수정' : '설정'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={nickInput}
                onChange={e => { setNickInput(e.target.value); setNickError(''); }}
                maxLength={NICKNAME_MAX_LEN}
                placeholder="닉네임 입력 (2-12자)"
                className="w-full text-sm font-medium rounded-lg px-3 py-2 outline-none"
                style={{ border: `1px solid ${nickError ? 'oklch(0.577 0.245 27.325)' : '#081F4D'}`, color: 'oklch(0.2 0.02 250)' }}
              />
              {nickError && (
                <div className="text-xs" style={{ color: 'oklch(0.577 0.245 27.325)' }}>{nickError}</div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveNick}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold"
                  style={{ background: '#081F4D', color: 'white' }}>
                  <Check size={13} /> 저장
                </button>
                <button type="button" onClick={handleCancelNick}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold"
                  style={{ background: 'oklch(0.95 0.004 250)', color: 'oklch(0.5 0.015 250)' }}>
                  <X size={13} /> 취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rival 공개 프로필 미리보기 */}
        <div className="axis-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={15} style={{ color: '#081F4D' }} />
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
              Rival 공개 프로필 미리보기
            </span>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: 'oklch(0.95 0.04 260)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white mx-auto mb-2"
              style={{ background: tierColor }}>
              {storedProfile.nickname ? storedProfile.nickname.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="font-bold text-base" style={{ color: 'oklch(0.2 0.02 250)' }}>
              {storedProfile.nickname ? `@${storedProfile.nickname}` : '닉네임 미설정'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>
              {tierLabel} · SP {profile?.totalSP.toLocaleString() ?? 0}
            </div>
            <div className="text-xs mt-2" style={{ color: 'oklch(0.6 0.015 250)' }}>
              ※ 실명은 상대방에게 공개되지 않습니다
            </div>
          </div>
        </div>

        {/* 획득 엠블럼 */}
        <div className="axis-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={15} style={{ color: '#081F4D' }} />
            <span className="font-semibold text-sm" style={{ color: 'oklch(0.25 0.02 250)' }}>
              보유 엠블럼
            </span>
            <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
              {myEmblemDefs.length}개
            </span>
          </div>
          {myEmblemDefs.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>
              아직 획득한 엠블럼이 없습니다.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {myEmblemDefs.slice(0, 9).map(({ se, def }) => {
                const badge = MATERIAL_BADGE[def.material];
                return (
                  <div key={se.id} className="flex flex-col items-center gap-1 w-16">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
                      style={{ background: badge.bg, border: `2px solid ${badge.border}` }}>
                      🏅
                    </div>
                    <div className="text-xs text-center truncate w-full" style={{ color: 'oklch(0.5 0.015 250)', fontSize: 10 }}>
                      {def.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 빠른 이동 */}
        <div className="axis-card p-4">
          <div className="text-xs font-semibold mb-3 px-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
            빠른 이동
          </div>
          <div className="space-y-2">
            {[
              { icon: BookOpen, label: '내 반 / 수업', path: '/student/classes', color: 'oklch(0.45 0.15 160)' },
              { icon: CalendarCheck, label: '출결 확인', path: '/student/attendance', color: 'oklch(0.55 0.15 80)' },
              { icon: Trophy, label: '성장 진열장', path: '/student/growth', color: '#081F4D' },
              { icon: Swords, label: 'Rival', path: '/student/rival', color: '#7C3AED' },
            ].map(({ icon: Icon, label, path, color }) => (
              <Link key={path} href={path} style={{ display: 'block' }}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                  style={{ background: 'oklch(0.97 0.003 250)' }}>
                  <Icon size={16} style={{ color }} />
                  <span className="text-sm font-medium" style={{ color: 'oklch(0.25 0.02 250)' }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
