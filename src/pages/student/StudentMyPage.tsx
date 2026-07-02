// AXIS LMS v1.2 — StudentMyPage Premium Profile Board

import { useState, useEffect } from 'react';
import { Edit3, Check, X, Trophy, Award, TrendingUp, Shield, BookOpen, CalendarCheck, Compass } from 'lucide-react';
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
import { TIER_LABELS, TIER_COLORS } from '@/lib/growthData';
import { AxisEmblemBadge } from '@/components/brand/AxisEmblemBadge';
import { AxisTierMedallion } from '@/components/brand/AxisTierMedallion';
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
  const representativeEmblemDefs = [
    ...((profile?.representativeEmblemIds ?? [])
      .map(id => myEmblemDefs.find(x => x.def.id === id))
      .filter((x): x is (typeof myEmblemDefs)[number] => !!x)),
    ...myEmblemDefs,
  ].filter((item, index, arr) => arr.findIndex(x => x.def.id === item.def.id) === index).slice(0, 3);

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
  const maskedPhone = student?.phone ? student.phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3') : '미등록';
  const enrolledClasses = student?.classes.filter(c => c.status === '수강중') ?? [];

  return (
    <StudentLayout title="마이페이지">
      <div className="max-w-[1280px] mx-auto px-5 py-6 space-y-5">
        <section className="axis-card p-6 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #FFFDF8 0%, #FFFFFF 58%, #F8F0DC 100%)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-center">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${tierColor}, #0B1B33)` }}>
                {(storedProfile.nickname ?? currentUser.name).charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-wide" style={{ color: '#B88D2A' }}>AXIS STUDENT PROFILE</div>
                <h1 className="mt-1 text-3xl font-black" style={{ color: '#0B1B33' }}>{currentUser.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {gradeLevel && <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: '#F8F0DC', color: '#B88D2A' }}>{gradeLevel}</span>}
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}44` }}>{tierLabel}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#FFFDF7', color: '#5C6676', border: '1px solid #E3D8C3' }}>휴대폰 {maskedPhone}</span>
                </div>
                {enrolledClasses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {enrolledClasses.map(cls => (
                      <span key={cls.id} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: '#E7EBF3', color: '#0B1B33' }}>
                        {cls.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 text-center" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                <TrendingUp size={18} className="mx-auto mb-1" style={{ color: '#B88D2A' }} />
                <div className="font-black text-2xl tabular-nums" style={{ color: '#0B1B33' }}>{profile?.totalSP.toLocaleString() ?? 0}</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>누적 성장 활동</div>
              </div>
              <div className="rounded-2xl p-4 flex flex-col items-center justify-center" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                <AxisTierMedallion tier={profile?.tier ?? 'UNRANKED'} size={58} />
                <div className="font-black text-sm mt-1" style={{ color: tierColor }}>{tierLabel}</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>현재 성장 단계</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-5 items-start">
          <div className="space-y-5">
            <section className="axis-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award size={18} style={{ color: '#C8A15A' }} />
                    <h2 className="font-black text-lg" style={{ color: '#0B1B33' }}>대표 성장 엠블럼</h2>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#5C6676' }}>Rival 공개 프로필과 성장 진열장에 표시되는 핵심 성장 기록입니다.</p>
                </div>
                <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: '#F8F0DC', color: '#8A6D2E' }}>Growth Signature</span>
              </div>
              {representativeEmblemDefs.length === 0 ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: '#FBFAF7', border: '1px dashed #D8CFBE', color: '#6B7280' }}>
                  아직 대표 엠블럼이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {representativeEmblemDefs.map(({ se, def }, index) => (
                    <div key={se.id} className="rounded-2xl p-4 text-center" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                      <div className="text-[10px] font-black tracking-wide" style={{ color: '#B88D2A' }}>SIGNATURE {index + 1}</div>
                      <AxisEmblemBadge iconKey={def.iconKey} level={def.level} size={126} />
                      <div className="mt-1 text-sm font-black leading-tight" style={{ color: '#0B1B33' }}>{def.parentSafeLabel ?? def.name}</div>
                      <div className="text-xs mt-1" style={{ color: '#6B7280' }}>{se.acquiredAt}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="axis-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} style={{ color: '#C8A15A' }} />
                <h2 className="font-black text-lg" style={{ color: '#0B1B33' }}>보유 엠블럼 컬렉션</h2>
                <span className="text-xs" style={{ color: '#6B7280' }}>{myEmblemDefs.length}개</span>
              </div>
              {myEmblemDefs.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: '#6B7280' }}>아직 획득한 엠블럼이 없습니다.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {myEmblemDefs.slice(0, 15).map(({ se, def }) => (
                    <div key={se.id} className="rounded-xl p-3 flex flex-col items-center text-center" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                      <AxisEmblemBadge iconKey={def.iconKey} level={def.level} size={88} />
                      <div className="mt-1 text-xs font-bold leading-tight line-clamp-2" style={{ color: '#0B1B33' }}>{def.parentSafeLabel ?? def.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="axis-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} style={{ color: '#0B1B33' }} />
                <h2 className="font-black text-base" style={{ color: '#0B1B33' }}>Rival 공개 프로필</h2>
                {hasNickname ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#D1FAE5', color: '#065F46' }}>설정 완료</span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#FEE2E2', color: '#991B1B' }}>미설정</span>
                )}
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #F8F0DC 100%)', border: '1px solid #E3D8C3' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white mx-auto mb-2" style={{ background: `linear-gradient(135deg, ${tierColor}, #0B1B33)` }}>
                  {storedProfile.nickname ? storedProfile.nickname.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="font-black text-xl" style={{ color: '#0B1B33' }}>{storedProfile.nickname ? `@${storedProfile.nickname}` : '닉네임 미설정'}</div>
                <div className="text-xs mt-1" style={{ color: '#5C6676' }}>{tierLabel} · 성장 활동 {profile?.totalSP.toLocaleString() ?? 0}</div>
                <div className="text-xs mt-3" style={{ color: '#6B7280' }}>실명은 상대방에게 공개되지 않습니다.</div>
              </div>
            </section>

            <section className="axis-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: '#0B1B33' }} />
                <h2 className="font-black text-base" style={{ color: '#0B1B33' }}>Rival 닉네임</h2>
              </div>
              {!editingNick ? (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-lg" style={{ color: '#0B1B33' }}>{storedProfile.nickname ? `@${storedProfile.nickname}` : '닉네임을 설정하세요'}</div>
                    <div className="text-xs mt-1" style={{ color: '#6B7280' }}>닉네임은 Rival, 성장 진열장에서 사용됩니다. 2주에 한 번만 변경 가능합니다.</div>
                    {!nickGate.allowed && <div className="text-xs mt-1 font-bold" style={{ color: '#B88D2A' }}>다음 변경까지 {nickGate.daysRemaining}일 남았습니다.</div>}
                  </div>
                  <button type="button" onClick={handleEditNick} disabled={!nickGate.allowed}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold"
                    style={nickGate.allowed ? { background: '#0B1B33', color: '#F8E7A2', border: '1px solid #C8A15A' } : { background: '#F1F5F9', color: '#94A3B8' }}>
                    <Edit3 size={12} /> {storedProfile.nickname ? '수정' : '설정'}
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
                    style={{ border: `1px solid ${nickError ? '#DC2626' : '#0B1B33'}`, color: '#0B1B33' }}
                  />
                  {nickError && <div className="text-xs" style={{ color: '#DC2626' }}>{nickError}</div>}
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSaveNick} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold" style={{ background: '#0B1B33', color: '#F8E7A2' }}>
                      <Check size={13} /> 저장
                    </button>
                    <button type="button" onClick={handleCancelNick} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold" style={{ background: '#F1F5F9', color: '#475569' }}>
                      <X size={13} /> 취소
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="axis-card p-5">
              <div className="text-xs font-bold mb-3" style={{ color: '#6B7280' }}>빠른 이동</div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: BookOpen, label: '내 반 / 수업', path: '/student/classes', color: '#2F7F86' },
                  { icon: CalendarCheck, label: '출결 확인', path: '/student/attendance', color: '#B88D2A' },
                  { icon: Trophy, label: '성장 진열장', path: '/student/growth', color: '#0B1B33' },
                  { icon: Compass, label: 'Rival', path: '/student/rival', color: '#0B1B33' },
                ].map(({ icon: Icon, label, path, color }) => (
                  <Link key={path} href={path} style={{ display: 'block' }}>
                    <div className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer" style={{ background: '#FFFDF7', border: '1px solid #E3D8C3' }}>
                      <span className="flex items-center gap-3 text-sm font-bold" style={{ color: '#0B1B33' }}><Icon size={16} style={{ color }} /> {label}</span>
                      <span style={{ color: '#94A3B8' }}>›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </StudentLayout>
  );
}
