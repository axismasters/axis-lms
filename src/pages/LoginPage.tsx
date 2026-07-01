// AXIS LMS v1.2 - LoginPage (Phase 3D v3-r9-r1)
// 첫 화면 = 로그인 페이지. AXIS 밝은 프리미엄 브랜드 톤(Ivory/Warm White 페이지 배경 +
// Navy 제한적 사용 + Gold 포인트) — 전체 다크 로그인 화면 금지 원칙은 유지한다.
//
// [Phase 3D v3-r9-r1] 사용자가 제공한 실제 AXIS 브랜드 이미지 3종 중 "로그인 히어로"용
// 이미지(axis-hero-dark.png)를 재해석 없이 그대로 사용한다 — MATH ACADEMY 라벨,
// AXIS 워드마크, 대각선 골드 슬래시, 태그라인(분석/적중 골드 강조), ANALYSIS·
// PRECISION·RESULT 구성이 이미지 한 장에 전부 포함되어 있어 별도로 재조립하지 않는다.
// v3-r9의 딥 네이비 히어로 방향은 유지하되(사용자 지시), 히어로는 카드 "이미지"로
// 표시하고 그 아래 로그인 폼은 계속 밝은 페이지 배경 위에 둔다 — 전체 화면을
// 네이비로 덮지 않는다.
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
import axisHeroDark from '@/assets/brand/axis-hero-dark.png';

const NAVY = '#040D1E';       // 앱 전역 기준 브랜드 Navy(버튼/사이드바 등)
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
      className="min-h-screen w-full flex items-center justify-center px-4 py-8 relative"
      style={{ background: 'oklch(0.968 0.009 84.57)' }}
    >
      <div className="w-full max-w-sm relative">
        {/* 히어로 — 실제 AXIS 브랜드 이미지를 그대로 사용(MATH ACADEMY 라벨/워드마크/
            골드 슬래시/태그라인/ANALYSIS·PRECISION·RESULT 전부 이미지에 포함됨) */}
        <img
          src={axisHeroDark}
          alt="AXIS MATH ACADEMY — 날카롭게 분석하고 당신의 손으로 적중된다"
          className="w-full rounded-3xl"
          style={{ boxShadow: '0 24px 60px rgba(0,9,38,0.35)', display: 'block' }}
        />

        {/* 카드-폼 구분 포인트 */}
        <div className="flex justify-center my-6">
          <div className="w-10 h-[3px] rounded-full" style={{ background: GOLD }} />
        </div>

        {/* 로그인 폼 — 별도 카드로 감싸지 않고 밝은 페이지 배경 위에 직접 배치 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: NAVY }}>
              휴대폰 번호
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full h-12 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors"
                style={{ border: '1px solid oklch(0.88 0.006 250)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.88 0.006 250)')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: NAVY }}>
              비밀번호
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.65 0.01 250)' }} />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full h-12 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors"
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

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'oklch(0.4 0.015 250)' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: NAVY }}
            />
            로그인 상태 유지 (자동 로그인)
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            style={{ background: GOLD, color: 'white' }}
          >
            {submitting ? '로그인 중…' : '로그인'}
          </button>

          <p className="text-xs text-center" style={{ color: 'oklch(0.6 0.01 250)' }}>
            계정은 학원 내부 등록 시 자동으로 생성됩니다.
          </p>
        </form>

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

