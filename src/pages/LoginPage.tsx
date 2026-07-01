// AXIS LMS v1.2 - LoginPage (Phase 3D v3-r9)
// 첫 화면 = 로그인 페이지. AXIS 밝은 프리미엄 브랜드 톤(Ivory/Warm White 페이지 배경 +
// Navy 제한적 사용 + Gold 포인트) — 전체 다크 로그인 화면 금지 원칙은 유지한다.
//
// [Phase 3D v3-r9] 사용자가 제공한 참고 목업 이미지 기준으로 히어로 영역만 재구성:
//   - 페이지 배경은 그대로 밝은 톤 유지(다크 전환 아님).
//   - AXIS 워드마크를 담는 히어로 카드만 짙은 네이비(#000926, 참고 이미지에서 정밀
//     샘플링한 값 — 브랜드보드의 UI 기준색 #081F4D보다 더 짙은 "히어로 전용" 톤)로
//     감싸 대비를 강하게 준다. 이 짙은 톤은 이 카드 안에서만 쓰고, 앱의 다른 UI
//     요소(버튼/사이드바 등)의 기준 Navy(#081F4D)는 그대로 둔다.
//   - 우상단 "MATH ACADEMY" 라벨, 카드 안 태그라인 색상 강조(분석/적중=Gold),
//     "로그인 상태 유지(자동 로그인)" 문구, 골드 버튼 흰 글씨 등 참고 이미지의
//     디테일을 반영했다.
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
import { AxisWordmark } from '@/components/brand/AxisWordmark';

const NAVY = '#081F4D';       // 앱 전역 기준 브랜드 Navy(버튼/사이드바 등)
const HERO_NAVY = '#000926';  // 로그인 히어로 카드 전용 짙은 톤(참고 이미지 정밀 샘플값)
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
        {/* 우상단 브랜드 라벨 */}
        <div className="flex justify-end mb-2">
          <span className="text-xs font-bold tracking-[0.15em]" style={{ color: GOLD }}>
            MATH ACADEMY
          </span>
        </div>

        {/* 히어로 카드 — 짙은 네이비, AXIS 워드마크 + 태그라인 */}
        <div
          className="rounded-3xl px-6 py-10 flex flex-col items-center text-center"
          style={{ background: HERO_NAVY, boxShadow: `0 24px 60px ${HERO_NAVY}55` }}
        >
          <AxisWordmark height={56} letterColor="#F7F4EE" accentColor={GOLD} />
          <p className="text-sm mt-4 leading-relaxed" style={{ color: 'oklch(0.9 0.008 250)' }}>
            날카롭게 <span style={{ color: GOLD, fontWeight: 600 }}>분석</span>하고 당신의 손으로{' '}
            <span style={{ color: GOLD, fontWeight: 600 }}>적중</span>된다
          </p>
        </div>

        {/* 카드-폼 구분 포인트 */}
        <div className="flex justify-center my-6">
          <div className="w-10 h-[3px] rounded-full" style={{ background: GOLD }} />
        </div>

        {/* 로그인 폼 — 별도 카드로 감싸지 않고 페이지 배경 위에 직접 배치 */}
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

