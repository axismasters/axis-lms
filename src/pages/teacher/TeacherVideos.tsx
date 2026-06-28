// AXIS LMS v1.2 - TeacherVideos (강사 포털 Foundation v1)
// 강사 전용 수업영상 화면 — 콘텐츠 엔진 v1 이전 Foundation 구조 확인용.

import { Link } from 'wouter';
import { Play, Upload } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';

export default function TeacherVideos() {
  const { currentUser } = useAuth();
  const { classes } = useClasses();
  const activeClasses = classes.filter(
    (c) => currentUser.assignedClassIds.includes(c.id) && c.status === '운영중'
  );

  return (
    <TeacherLayout title="수업영상">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 수업영상 / 수업노트 탭 전환 */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg" style={{ background: 'oklch(0.93 0.006 250)' }}>
          <div
            className="py-2 rounded-md text-center text-sm font-medium"
            style={{ background: 'white', color: 'oklch(0.511 0.262 276.966)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)' }}
          >
            수업영상
          </div>
          <Link href="/teacher/notes">
            <div
              className="py-2 rounded-md text-center text-sm font-medium cursor-pointer w-full"
              style={{ color: 'oklch(0.5 0.015 250)' }}
            >
              수업노트
            </div>
          </Link>
        </div>

        {/* 안내 */}
        <div
          className="axis-card px-4 py-3 text-xs"
          style={{ borderLeft: '3px solid oklch(0.511 0.262 276.966)', color: 'oklch(0.5 0.015 250)' }}
        >
          내 수업영상을 반별로 업로드하고 관리하는 화면입니다.<br />
          콘텐츠 엔진 v1 구현 이후 실제 업로드 기능이 활성화됩니다.
        </div>

        {/* 반별 영상 섹션 */}
        {activeClasses.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <Play size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>운영중인 담당 반이 없습니다</div>
          </div>
        ) : (
          activeClasses.map((cls) => (
            <div key={cls.id} className="axis-card p-4">
              <div className="mb-3">
                <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{cls.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  {cls.subject} · {cls.level}
                </div>
              </div>
              <div
                className="rounded-lg border-2 border-dashed p-6 text-center"
                style={{ borderColor: 'oklch(0.87 0.01 250)' }}
              >
                <Upload size={22} className="mx-auto mb-2" style={{ color: 'oklch(0.75 0.01 250)' }} />
                <div className="text-xs font-medium" style={{ color: 'oklch(0.55 0.015 250)' }}>
                  수업영상 업로드
                </div>
                <div className="text-xs mt-1" style={{ color: 'oklch(0.75 0.01 250)' }}>
                  콘텐츠 엔진 v1 구현 예정
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </TeacherLayout>
  );
}
