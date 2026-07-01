// AXIS LMS v1.2 - LoginPage (Phase 3D v2)
// 첫 화면 = 로그인 페이지. AXIS 브랜드형 중앙 로그인 카드(Deep Navy + Champagne Gold).
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
import { GraduationCap, Lock, Phone, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, oklch(0.19 0.03 255) 0%, oklch(0.11 0.02 250) 55%, oklch(0.08 0.015 250) 100%)',
      }}
    >
      <div className="w-full max-w-sm">
        {/* 브랜드 워드마크 */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'oklch(0.15 0.02 250)', border: '1px solid #C9A84C55' }}
          >
            <GraduationCap size={26} style={{ color: '#C9A84C' }} />
          </div>
          <div className="font-bold text-2xl tracking-[0.2em]" style={{ color: 'white' }}>AXIS</div>
          <div className="text-xs mt-1 tracking-wide" style={{ color: 'oklch(0.65 0.02 250)' }}>
            ANALYSIS · PRECISION · TARGET · RESULT
          </div>
        </div>

        {/* 로그인 카드 */}
        <div
          className="rounded-2xl p-7"
          style={{ background: 'white', boxShadow: '0 24px 60px oklch(0 0 0 / 0.35)' }}
        >
          <div className="mb-5">
            <h1 className="font-bold text-lg" style={{ color: 'oklch(0.15 0.02 250)' }}>로그인</h1>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.015 250)' }}>
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
                  placeholder="010-0000-0000"
                  className="w-full h-11 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors"
                  style={{ border: '1px solid oklch(0.88 0.006 250)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.15 0.02 250)')}
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
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.15 0.02 250)')}
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
                style={{ accentColor: 'oklch(0.15 0.02 250)' }}
              />
              로그인 상태 유지
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              style={{ background: 'oklch(0.15 0.02 250)', color: '#C9A84C' }}
            >
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: 'oklch(0.65 0.01 250)' }}>
            계정은 학원 내부 등록 시 자동으로 생성됩니다.
          </p>
        </div>

        {/* TODO(auth): 데모 계정 안내 — 실제 인증 서버 연동 후 이 블록은 제거할 것 */}
        <div
          className="mt-4 rounded-xl px-4 py-3 text-xs flex items-start gap-2"
          style={{ background: 'oklch(0.18 0.02 255 / 0.6)', color: 'oklch(0.7 0.02 250)', border: '1px solid oklch(1 0 0 / 0.08)' }}
        >
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            데모 환경: 등록된 휴대폰번호 + 비밀번호(번호 뒤 4자리)로 로그인할 수 있습니다.
            예) 010-0000-0002 / 0002(원장), 010-0000-0007 / 0007(부원장), 010-0000-0004 / 0004(강사).
          </span>
        </div>
      </div>
    </div>
  );
}
