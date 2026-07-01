// AXIS LMS v1.2 — Phase 3A-2 Final Cleanup: teacherAcademicInput.ts DEPRECATED
// 구버전 성적 입력 데이터 계층. teacherSchoolRecordInput.ts / teacherMockExamInput.ts
// (구조화된 과목별 고정 테이블 방식)로 완전히 대체되었다.
// 이 파일을 참조하던 유일한 소비처(TeacherAcademicInput.tsx 페이지,
// universityRecommendationPayload.ts)가 모두 함께 격리/정리되어, 이제 이 파일을
// import하는 곳은 프로젝트 어디에도 없다.
//
// ⚠ 새 코드에서 이 파일을 import하지 마세요. 대신 아래를 사용하세요:
//   - 내신성적: '@/lib/teacherSchoolRecordInput'
//   - 모의고사: '@/lib/teacherMockExamInput'
//   - payload 변환: '@/lib/universityPayloadAdapter'

export {};
