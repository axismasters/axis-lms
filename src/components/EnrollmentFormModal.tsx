// AXIS LMS v1.2 - 학생 상세 "반 등록" 모달
// Design: Structured Authority
// ClassFormModal.tsx/AssessmentFormModal.tsx와 동일한 Dialog 패턴을 따른다.
//
// 반 선택 드롭다운은 canAccessClass()를 통과하는 반만 보여준다(강사는 본인 담당 반만 — AXIS 확정
// 원칙 F). 이미 수강중인 반은 목록에서 제외해 중복 등록을 막는다(addEnrollment에서도 한 번 더 막는다).

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/contexts/ClassContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EnrollmentFormModal({ open, onClose, studentId }: Props) {
  const { canAccessClass } = useAuth();
  const { classes } = useClasses();
  const { addEnrollment, isStudentActivelyEnrolled } = useEnrollment();

  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState(todayStr());
  const [tuitionAmount, setTuitionAmount] = useState('');
  const [memo, setMemo] = useState('');

  // 권한 범위(canAccessClass) 내 + 종강이 아니며 + 이미 수강중이 아닌 반만 선택지로 제공한다.
  const availableClasses = classes.filter(
    (c) => canAccessClass(c.id) && c.status !== '종강' && !isStudentActivelyEnrolled(studentId, c.id)
  );

  useEffect(() => {
    if (open) {
      setClassId('');
      setStartDate(todayStr());
      setTuitionAmount('');
      setMemo('');
    }
  }, [open]);

  const selectedClass = classes.find((c) => c.id === classId);

  const handleClassChange = (id: string) => {
    setClassId(id);
    const cls = classes.find((c) => c.id === id);
    // 수강료 기본값 — 반의 표준 수강료(fee)를 그대로 채워준다. 실제 청구 계산은 하지 않는다(Finance Engine 준비용).
    if (cls?.fee) setTuitionAmount(String(cls.fee));
  };

  const handleSave = () => {
    if (!classId) { toast.error('반을 선택하세요.'); return; }
    if (!startDate) { toast.error('수강 시작일을 입력하세요.'); return; }
    const amount = tuitionAmount.trim() ? Number(tuitionAmount) : undefined;
    if (tuitionAmount.trim() && Number.isNaN(amount)) { toast.error('수강료는 숫자로 입력하세요.'); return; }

    const result = addEnrollment({ studentId, classId, startDate, tuitionAmount: amount, memo: memo.trim() || undefined });
    if (!result.ok) {
      toast.error(result.reason ?? '반 등록에 실패했습니다.');
      return;
    }
    toast.success(`${selectedClass?.name ?? '반'} 수강이 시작일 ${startDate}(으)로 등록되었습니다.`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>반 등록</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">반 선택</Label>
            {availableClasses.length === 0 ? (
              <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>등록 가능한 반이 없습니다(이미 수강중인 반은 제외됩니다).</p>
            ) : (
              <Select value={classId} onValueChange={handleClassChange}>
                <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="반 선택…" /></SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.teacher} · {c.subject})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1.5 block">수강 시작일</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-full px-2 rounded border text-sm"
              style={{ borderColor: 'oklch(0.9 0.005 250)' }}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1.5 block">수강료</Label>
            <input
              type="number"
              value={tuitionAmount}
              onChange={(e) => setTuitionAmount(e.target.value)}
              placeholder="원"
              className="h-9 w-full px-2 rounded border text-sm"
              style={{ borderColor: 'oklch(0.9 0.005 250)' }}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1.5 block">메모 (선택)</Label>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} className="text-sm resize-none" rows={2} placeholder="특이사항이 있으면 입력하세요" />
          </div>

          <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
            <Info size={11} /> 수강료는 Finance Engine 준비용 값으로만 저장되며, 이 단계에서는 실제 청구·계산에 사용되지 않습니다.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">취소</Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs" style={{ background: '#081F4D' }}>등록</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
