// AXIS LMS v1.2 - LoginPage (Phase 3D v3-r7-r1)
// 첫 화면 = 로그인 페이지. AXIS 밝은 프리미엄 브랜드 톤(Ivory/Warm White 배경 +
// Navy #081F4D 제한적 사용 + Gold #C8A15A 포인트) — 전체 다크 로그인 화면 금지.
//
// 정책:
//   - 휴대폰번호 + 비밀번호 입력만 존재. 이메일 로그인/회원가입/계정생성 버튼 없음.
//   - 계정은 내부 등록 시 자동 생성된다(이 화면에서 새로 만들 수 없음).
//   - 로그인 상태 유지 체크박스 — 체크 시 localStorage, 미체크 시 sessionStorage에 세션 저장(AuthContext).
//   - DevRoleSwitcher 미노출(운영 첫 화면 원칙).
//   - 로그인 성공 시 별도 네비게이션 불필요 — isAuthenticated가 true가 되면 RootRedirect가
//     자동으로 역할별 홈으로 보낸다.
//
// TODO(auth): 실제 인증 서버 연동 시 이 화면의 폼 자체는 그대로 두고 AuthContext.login()의
//             검증 로직만 서버 호출로 교체하면 된다. 데모 비밀번호 안내 블록은 실 배포 전 제거할 것.

import { useState, FormEvent } from 'react';
import { Lock, Phone, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AxisMark } from '@/components/brand/AxisMark';
import { AxisWordmark } from '@/components/brand/AxisWordmark';

const NAVY = '#081F4D';
const GOLD = '#C8A15A';

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError('휴대폰번호와 비밀번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    const ok = login(phone.trim(), password.trim(), remember);
    setSubmitting(false);
    if (!ok) {
      setError('휴대폰번호 또는 비밀번호가 올바르지 않습니다.');
    }
    // 성공 시: isAuthenticated가 true로 바뀌면서 RootRedirect가 자동으로 역할별 홈으로 이동한다.
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'oklch(0.968 0.009 84.57)' }}
    >
      {/* [Phase 3D v3-r7-r1] Gold 사선 포인트 — 화면 전체를 다크로 만들지 않고, 우상단에
          은은한 대각선 골드 액센트만 배치해 프리미엄 톤을 낸다. */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: -120, right: -160, width: 520, height: 520,
          background: `linear-gradient(135deg, ${GOLD}22 0%, ${GOLD}00 60%)`,
          transform: 'rotate(12deg)',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: -140, left: -160, width: 420, height: 420,
          background: `linear-gradient(135deg, ${NAVY}10 0%, ${NAVY}00 60%)`,
          transform: 'rotate(-8deg)',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* 브랜드 워드마크 */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: NAVY, boxShadow: `0 8px 24px ${NAVY}33` }}
          >
            <AxisMark size={30} letterColor="#F7F4EE" slashColor={GOLD} />
          </div>
          <AxisWordmark height={40} letterColor={NAVY} accentColor={GOLD} />
          <div className="text-xs mt-2 tracking-wide font-medium" style={{ color: GOLD }}>
            ANALYSIS · PRECISION · TARGET · RESULT
          </div>
        </div>

        {/* 로그인 카드 */}
        <div
          className="rounded-2xl p-7"
          style={{ background: 'white', boxShadow: '0 20px 50px oklch(0.2 0.03 255 / 0.12)', border: '1px solid oklch(0.93 0.01 80)' }}
        >
          <div className="mb-5">
            <h1 className="font-bold text-lg" style={{ color: NAVY }}>로그인</h1>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.015 250)' }}>
              등록된 휴대폰번호로 로그인하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.4 0.015 250)' }}>
                휴대폰번호
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01000000000 (하이픈 없이 입력 가능)"
                  className="w-full h-11 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors"
                  style={{ border: '1px solid oklch(0.88 0.006 250)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.88 0.006 250)')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'oklch(0.4 0.015 250)' }}>
                비밀번호
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full h-11 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors"
                  style={{ border: '1px solid oklch(0.88 0.006 250)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.88 0.006 250)')}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'oklch(0.96 0.05 25)', color: 'oklch(0.5 0.18 25)' }}>
                {error}
              </div>
            )}

            <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'oklch(0.45 0.015 250)' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: NAVY }}
              />
              로그인 상태 유지
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              style={{ background: NAVY, color: GOLD }}
            >
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: 'oklch(0.6 0.01 250)' }}>
            계정은 학원 내부 등록 시 자동으로 생성됩니다.
          </p>
        </div>

        {/* TODO(auth): 데모 계정 안내 — 실제 인증 서버 연동 후 이 블록은 제거할 것 */}
        <div
          className="mt-4 rounded-xl px-4 py-3 text-xs flex items-start gap-2"
          style={{ background: `${GOLD}14`, color: 'oklch(0.4 0.04 80)', border: `1px solid ${GOLD}44` }}
        >
          <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
          <span>
            데모 환경: 등록된 휴대폰번호(하이픈 있어도, 없어도 됩니다) + 비밀번호(번호 뒤 4자리)로
            로그인할 수 있습니다.
            예) 01000000002 또는 010-0000-0002 / 0002(원장), 01000000007 / 0007(부원장),
            01000000004 / 0004(강사).
          </span>
        </div>
      </div>
    </div>
  );
}
