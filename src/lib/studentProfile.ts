// AXIS LMS v1.2 — Phase 2F: studentProfile.ts
// 학생 프로필 — 닉네임, 대표 엠블럼, Rival 공개 설정
//
// Phase 2F 정책:
//   - 닉네임은 Rival 기능의 필수 조건 (닉네임 없으면 Rival 진입 불가)
//   - 학생 실명은 Rival 화면에서 절대 노출하지 않음
//   - 닉네임 없이 Rival 기능 사용 불가
//   - localStorage mock 저장 (Phase 3+ API 연동 예정)
//
// ⚠ 금지:
//   - Rival 화면에서 실명(name) 노출 금지
//   - 닉네임 없이 Rival 기능 사용 금지
//   - 닉네임으로 실명 추론 가능한 정보 포함 금지

export interface StudentProfileData {
  studentId: string;
  nickname: string | null;              // null = 미설정 (Rival 사용 불가)
  representativeEmblemId: string | null;
  showRivalPublicProfile: boolean;       // Rival 공개 프로필 공개 여부
  updatedAt: string;
}

// ─── 기본값 ──────────────────────────────────────────────────────────
function defaultProfile(studentId: string): StudentProfileData {
  return {
    studentId,
    nickname: null,
    representativeEmblemId: null,
    showRivalPublicProfile: true,
    updatedAt: new Date().toISOString(),
  };
}

// ─── localStorage 키 ─────────────────────────────────────────────────
function profileKey(studentId: string): string {
  return `axis_student_profile_${studentId}`;
}

// ─── 프로필 불러오기 ─────────────────────────────────────────────────
export function loadStudentProfile(studentId: string): StudentProfileData {
  try {
    const raw = localStorage.getItem(profileKey(studentId));
    if (!raw) return defaultProfile(studentId);
    return { ...defaultProfile(studentId), ...JSON.parse(raw) };
  } catch {
    return defaultProfile(studentId);
  }
}

// ─── 프로필 저장 ─────────────────────────────────────────────────────
export function saveStudentProfile(data: StudentProfileData): void {
  try {
    localStorage.setItem(profileKey(data.studentId), JSON.stringify({
      ...data,
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    // localStorage 접근 불가 환경 무시
  }
}

// ─── 닉네임 설정 ─────────────────────────────────────────────────────
export function setStudentNickname(studentId: string, nickname: string): void {
  const profile = loadStudentProfile(studentId);
  saveStudentProfile({ ...profile, nickname: nickname.trim() || null });
}

// ─── 대표 엠블럼 설정 ────────────────────────────────────────────────
export function setRepresentativeEmblem(studentId: string, emblemId: string | null): void {
  const profile = loadStudentProfile(studentId);
  saveStudentProfile({ ...profile, representativeEmblemId: emblemId });
}

// ─── 닉네임 유효성 검사 ──────────────────────────────────────────────
export const NICKNAME_MIN_LEN = 2;
export const NICKNAME_MAX_LEN = 12;
export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_\-]+$/;

export function validateNickname(nickname: string): { valid: boolean; reason?: string } {
  const trimmed = nickname.trim();
  if (trimmed.length < NICKNAME_MIN_LEN) return { valid: false, reason: `닉네임은 ${NICKNAME_MIN_LEN}자 이상이어야 합니다.` };
  if (trimmed.length > NICKNAME_MAX_LEN) return { valid: false, reason: `닉네임은 ${NICKNAME_MAX_LEN}자 이하여야 합니다.` };
  if (!NICKNAME_PATTERN.test(trimmed)) return { valid: false, reason: '한글, 영문, 숫자, _, -만 사용 가능합니다.' };
  return { valid: true };
}

// ─── Rival 사용 가능 여부 ────────────────────────────────────────────
export function canUseRival(studentId: string): boolean {
  const profile = loadStudentProfile(studentId);
  return !!profile.nickname && profile.nickname.length >= NICKNAME_MIN_LEN;
}
