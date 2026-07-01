// AXIS LMS v1.2 - TeacherStudents (강사 포털 Foundation v1)
// 강사 전용 담당 학생 목록 화면.

import { Link } from 'wouter';
import { Users, ChevronRight } from 'lucide-react';
import TeacherLayout from '@/layouts/TeacherLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentContext';
import { useClasses } from '@/contexts/ClassContext';
import type { Student } from '@/lib/dummyData';
import type { ClassRoom } from '@/lib/classData';

function getStudentClassNames(student: Student, assignedClasses: ClassRoom[]): string {
  const enrolled = assignedClasses
    .filter((cls) => student.classes.some((c) => c.id === cls.id && c.status === '수강중'))
    .map((cls) => cls.name);
  return enrolled.length > 0 ? enrolled.join(', ') : '반 미배정';
}

export default function TeacherStudents() {
  const { currentUser } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();

  const assignedClasses = classes.filter((c) => currentUser.assignedClassIds.includes(c.id));
  const assignedStudents = students.filter((s) => currentUser.assignedStudentIds.includes(s.id));
  const activeCount = assignedStudents.filter((s) => s.status === '재원').length;
  const otherCount = assignedStudents.length - activeCount;

  return (
    <TeacherLayout title="담당 학생">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '전체', value: assignedStudents.length, color: 'oklch(0.511 0.262 276.966)' },
            { label: '재원',  value: activeCount,             color: 'oklch(0.45 0.15 160)' },
            { label: '기타',  value: otherCount,              color: 'oklch(0.55 0.015 250)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="axis-card p-3 text-center">
              <div className="font-bold text-xl tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.015 250)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 학생 목록 */}
        {assignedStudents.length === 0 ? (
          <div className="axis-card p-10 text-center">
            <Users size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.8 0.01 250)' }} />
            <div className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>담당 학생이 없습니다</div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.7 0.01 250)' }}>반 배정 시 자동으로 연결됩니다</div>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedStudents.map((student) => (
              <div key={student.id} className="axis-card p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{
                    background: student.status === '재원'
                      ? 'oklch(0.511 0.262 276.966)'
                      : 'oklch(0.7 0.01 250)',
                  }}
                >
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>{student.name}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.015 250)' }}>
                    {getStudentClassNames(student, assignedClasses)}
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: student.status === '재원' ? 'oklch(0.94 0.08 160)' : 'oklch(0.95 0.005 250)',
                    color: student.status === '재원' ? 'oklch(0.35 0.12 160)' : 'oklch(0.5 0.015 250)',
                  }}
                >
                  {student.status}
                </span>
                <Link href={`/teacher/students/${student.id}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-0.5 flex-shrink-0">
                    상세보기 <ChevronRight size={12} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </TeacherLayout>
  );
}
