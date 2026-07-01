// AXIS LMS v1.2 — Phase 3A-2 Final Cleanup v2: universityMenuLabel.ts
// 학년 감지 / 대학추천 메뉴 라벨 전용 헬퍼.
//
// 이 파일은 과거 studentGradeInput.ts에서 이름을 바꿔 옮긴 것이다. 원래 그 이름 아래에는
// 학생이 직접 성적을 입력하는 로직이 있었으나, AXIS LMS 헌법("학생은 성적을 조회하고,
// 그래프와 추천 결과를 보는 역할이다. 학생 화면에는 성적 입력 기능을 두지 않는다")과
// 맞지 않아 전량 삭제되었다. 이후에는 학년 감지·메뉴 라벨 헬퍼 두 함수만 남았는데
// "학생 입력"을 연상시키는 옛 파일명이 계속 혼란을 줘, 실제 역할에 맞게 파일명을
// 바꾸고 옛 파일은 제거했다.

// ─── 학년 감지 헬퍼 ──────────────────────────────────────────────────
// classData.ClassRoom.level 또는 ClassInfo.name, mockExamScores.grade에서 감지
export type GradeLevel = '고1' | '고2' | '고3';

export function detectStudentGradeLevel(
  student: { classes?: { name: string; status: string }[]; mockExamScores?: { grade?: string }[] } | undefined
): GradeLevel | null {
  if (!student) return null;

  // 1. mockExamScores.grade 우선 ('고3', '고2', '고1')
  const mockGrade = student.mockExamScores?.[0]?.grade;
  if (mockGrade === '고1' || mockGrade === '고2' || mockGrade === '고3') {
    return mockGrade as GradeLevel;
  }

  // 2. 수강중인 반 이름에서 감지
  for (const cls of student.classes ?? []) {
    if (cls.status === '수강중') {
      if (cls.name.includes('고3')) return '고3';
      if (cls.name.includes('고2')) return '고2';
      if (cls.name.includes('고1')) return '고1';
    }
  }

  return null;
}

// ─── 학년별 대학 메뉴 명칭 ──────────────────────────────────────────
// 고1, 고2: "목표대학 추천"
// 고3:     "대학추천"
// 미확인:  "목표대학 추천" (기본값)
export function getUniversityMenuLabel(gradeLevel: GradeLevel | null): string {
  return gradeLevel === '고3' ? '대학추천' : '목표대학 추천';
}
