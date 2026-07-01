// AXIS LMS v1.2 - 404 Not Found
// 최소 형태로 생성 — 실제 원본 파일을 받지 못해 빌드 가능한 최소 페이지로 작성.

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'oklch(0.2 0.02 250)' }}>404</h1>
      <p style={{ fontSize: 14, color: 'oklch(0.5 0.015 250)' }}>페이지를 찾을 수 없습니다.</p>
      <a href="/admin/students" style={{ fontSize: 13, color: 'oklch(0.254 0.090 262.09)' }}>학생 목록으로 이동</a>
    </div>
  );
}
