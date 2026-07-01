// AXIS LMS v1.2 - 학생 등록 페이지
// Design: Structured Authority
// 기능: 학생 기본정보 + 보호자 다중 등록 + 가족 자동 연결 감지 + Account Engine 자동 계정 생성 안내

import { useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { useStudents } from '@/contexts/StudentContext';
import { RELATION_OPTIONS } from '@/lib/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  UserPlus, Plus, Trash2, AlertTriangle, CheckCircle2,
  Phone, User, Users, Info, Camera, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuardianForm {
  tempId: string;
  name: string;
  relation: string;
  phone: string;
  familyMatch?: { studentId: string; studentName: string; relation: string; guardianName: string }[] | null;
  checking: boolean;
}

export default function StudentNew() {
  const [, navigate] = useLocation();
  const { addStudent, checkGuardianPhone } = useStudents();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<GuardianForm[]>([
    { tempId: 'g-temp-1', name: '', relation: '', phone: '', familyMatch: null, checking: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addGuardian = () => {
    setGuardians(prev => [...prev, {
      tempId: `g-temp-${Date.now()}`,
      name: '', relation: '', phone: '',
      familyMatch: null, checking: false,
    }]);
  };

  const removeGuardian = (tempId: string) => {
    setGuardians(prev => prev.filter(g => g.tempId !== tempId));
  };

  const updateGuardian = (tempId: string, field: keyof GuardianForm, value: string) => {
    setGuardians(prev => prev.map(g =>
      g.tempId === tempId ? { ...g, [field]: value, ...(field === 'phone' ? { familyMatch: null } : {}) } : g
    ));
  };

  const checkFamilyConnection = useCallback((tempId: string, phone: string) => {
    if (!phone || phone.length < 11) return;
    setGuardians(prev => prev.map(g =>
      g.tempId === tempId ? { ...g, checking: true } : g
    ));
    // 실제로는 API 호출, 여기서는 더미 데이터 조회
    setTimeout(() => {
      const match = checkGuardianPhone(phone);
      setGuardians(prev => prev.map(g =>
        g.tempId === tempId ? { ...g, checking: false, familyMatch: match } : g
      ));
    }, 400);
  }, [checkGuardianPhone]);

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '학생명을 입력해주세요.';
    if (!phone.trim()) newErrors.phone = '휴대폰번호를 입력해주세요.';
    else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(phone)) newErrors.phone = '올바른 휴대폰번호 형식으로 입력해주세요. (예: 010-1234-5678)';

    guardians.forEach((g, i) => {
      if (g.name || g.relation || g.phone) {
        if (!g.name) newErrors[`guardian_${i}_name`] = '보호자명을 입력해주세요.';
        if (!g.relation) newErrors[`guardian_${i}_relation`] = '관계를 선택해주세요.';
        if (!g.phone) newErrors[`guardian_${i}_phone`] = '휴대폰번호를 입력해주세요.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600)); // 등록 처리 시뮬레이션

    const validGuardians = guardians
      .filter(g => g.name && g.relation && g.phone)
      .map((g, i) => ({ id: `g-new-${i}`, name: g.name, relation: g.relation, phone: g.phone }));

    const newStudent = addStudent({
      name: name.trim(),
      phone,
      photo: photo || undefined,
      status: '재원',
      guardians: validGuardians,
      classes: [],
      recentAttendance: undefined,
      recentExam: undefined,
    });

    setSubmitting(false);
    toast.success(`${name} 학생이 등록되었습니다.`, {
      description: '계정이 자동 생성되었습니다. 로그인: 휴대폰번호 기반',
    });
    navigate(`/admin/students/${newStudent.id}`);
  };

  const hasAnyFamilyMatch = guardians.some(g => g.familyMatch && g.familyMatch.length > 0);

  return (
    <AdminLayout
      breadcrumbs={[
        { label: '학생관리', path: '/students' },
        { label: '학생 등록' },
      ]}
    >
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'oklch(0.2 0.02 250)' }}>학생 등록</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.42 0.015 250)' }}>
            새 학생의 기본 정보와 보호자 정보를 입력합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 학생 기본 정보 */}
          <div className="axis-card p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
              <User size={16} style={{ color: '#040D1E' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>학생 기본 정보</h2>
            </div>

            <div className="flex gap-6">
              {/* 사진 업로드 */}
              <div className="flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-[#040D1E] hover:bg-[#E7EBF3]"
                  style={{ borderColor: 'oklch(0.88 0.01 250)', background: 'oklch(0.97 0.003 250)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photo ? (
                    <img src={photo} alt="학생 사진" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Camera size={20} style={{ color: 'oklch(0.49 0.015 250)' }} />
                      <span className="text-xs mt-1" style={{ color: 'oklch(0.47 0.015 250)' }}>사진 등록</span>
                      <span className="text-xs" style={{ color: 'oklch(0.54 0.01 250)' }}>(선택)</span>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                {photo && (
                  <button type="button" className="text-xs mt-1 w-full text-center" style={{ color: 'oklch(0.447 0.245 27.325)' }} onClick={() => setPhoto(null)}>
                    사진 삭제
                  </button>
                )}
              </div>

              {/* 이름 + 전화번호 */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: 'oklch(0.35 0.02 250)' }}>
                    학생명 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                    placeholder="홍길동"
                    className={cn('h-9 text-sm', errors.name && 'border-rose-400 focus-visible:ring-rose-400')}
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: 'oklch(0.35 0.02 250)' }}>
                    휴대폰번호 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={phone}
                    onChange={e => { setPhone(formatPhoneInput(e.target.value)); setErrors(p => ({ ...p, phone: '' })); }}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className={cn('h-9 text-sm', errors.phone && 'border-rose-400 focus-visible:ring-rose-400')}
                  />
                  {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Account Engine 안내 */}
          <div className="rounded-lg px-4 py-3 flex items-start gap-3" style={{ background: 'oklch(0.95 0.04 250)', border: '1px solid oklch(0.85 0.08 250)' }}>
            <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#040D1E' }} />
            <div className="text-xs" style={{ color: 'oklch(0.35 0.15 250)' }}>
              <span className="font-semibold">Account Engine 자동 계정 생성</span>
              <span className="ml-1">— 학생 등록 완료 시 Account Engine에서 계정이 자동으로 생성됩니다.</span>
              <br />
              <span style={{ color: 'oklch(0.35 0.12 250)' }}>로그인 방식: <strong>휴대폰번호 기반</strong> (별도 아이디/비밀번호 설정 불필요)</span>
            </div>
          </div>

          {/* 보호자 정보 */}
          <div className="axis-card p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: '#040D1E' }} />
                <h2 className="font-semibold text-sm" style={{ color: 'oklch(0.2 0.02 250)' }}>보호자 정보</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.95 0.005 250)', color: 'oklch(0.42 0.015 250)' }}>
                  선택 · 여러 명 등록 가능
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addGuardian} className="h-8 text-xs gap-1.5">
                <Plus size={13} />
                보호자 추가
              </Button>
            </div>

            <div className="space-y-4">
              {guardians.map((guardian, index) => (
                <div key={guardian.tempId} className="rounded-lg p-4" style={{ background: 'oklch(0.98 0.003 250)', border: '1px solid oklch(0.92 0.005 250)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.015 250)' }}>
                      보호자 {index + 1}
                    </span>
                    {guardians.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuardian(guardian.tempId)}
                        className="p-1 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={13} style={{ color: 'oklch(0.447 0.245 27.325)' }} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* 관계 */}
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block" style={{ color: 'oklch(0.35 0.015 250)' }}>관계</Label>
                      <Select
                        value={guardian.relation}
                        onValueChange={v => updateGuardian(guardian.tempId, 'relation', v)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATION_OPTIONS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`guardian_${index}_relation`] && (
                        <p className="text-xs text-rose-500 mt-1">{errors[`guardian_${index}_relation`]}</p>
                      )}
                    </div>

                    {/* 보호자명 */}
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block" style={{ color: 'oklch(0.35 0.015 250)' }}>보호자명</Label>
                      <Input
                        value={guardian.name}
                        onChange={e => updateGuardian(guardian.tempId, 'name', e.target.value)}
                        placeholder="홍길순"
                        className={cn('h-9 text-sm', errors[`guardian_${index}_name`] && 'border-rose-400')}
                      />
                      {errors[`guardian_${index}_name`] && (
                        <p className="text-xs text-rose-500 mt-1">{errors[`guardian_${index}_name`]}</p>
                      )}
                    </div>

                    {/* 휴대폰번호 */}
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block" style={{ color: 'oklch(0.35 0.015 250)' }}>휴대폰번호</Label>
                      <div className="relative">
                        <Input
                          value={guardian.phone}
                          onChange={e => {
                            const formatted = formatPhoneInput(e.target.value);
                            updateGuardian(guardian.tempId, 'phone', formatted);
                          }}
                          onBlur={e => checkFamilyConnection(guardian.tempId, e.target.value)}
                          placeholder="010-0000-0000"
                          maxLength={13}
                          className={cn('h-9 text-sm pr-8', errors[`guardian_${index}_phone`] && 'border-rose-400')}
                        />
                        {guardian.checking && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <div className="w-3.5 h-3.5 border-2 border-[#040D1E] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {errors[`guardian_${index}_phone`] && (
                        <p className="text-xs text-rose-500 mt-1">{errors[`guardian_${index}_phone`]}</p>
                      )}
                    </div>
                  </div>

                  {/* 가족 자동 연결 감지 UI */}
                  {guardian.familyMatch && guardian.familyMatch.length > 0 && (
                    <div className="mt-3 rounded-lg p-3 flex items-start gap-2.5" style={{ background: 'oklch(0.97 0.05 250)', border: '1px solid oklch(0.88 0.1 250)' }}>
                      <Link2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#040D1E' }} />
                      <div className="flex-1">
                        <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.35 0.15 250)' }}>
                          가족 자동 연결 감지
                        </div>
                        <div className="text-xs" style={{ color: 'oklch(0.35 0.12 250)' }}>
                          이 번호({guardian.phone})로 등록된 학생이 있습니다. 등록 완료 시 가족으로 자동 연결됩니다.
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {guardian.familyMatch.map((m, mi) => (
                            <span key={mi} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ background: 'oklch(0.93 0.08 250)', color: 'oklch(0.35 0.18 250)' }}>
                              <User size={11} />
                              {m.studentName} ({m.relation})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 번호 확인 완료 (매칭 없음) */}
                  {guardian.familyMatch === null && guardian.phone.length === 13 && !guardian.checking && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <CheckCircle2 size={12} style={{ color: 'oklch(0.4 0.15 160)' }} />
                      <span className="text-xs" style={{ color: 'oklch(0.4 0.15 160)' }}>신규 보호자 번호입니다.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 가족 연결 요약 */}
          {hasAnyFamilyMatch && (
            <div className="rounded-lg px-4 py-3 flex items-start gap-3" style={{ background: 'oklch(0.97 0.04 160)', border: '1px solid oklch(0.88 0.08 160)' }}>
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.4 0.15 160)' }} />
              <div className="text-xs" style={{ color: 'oklch(0.35 0.12 160)' }}>
                <span className="font-semibold">가족 자동 연결 예정</span>
                <span className="ml-1">— 등록 완료 후 동일 보호자 번호를 가진 학생과 가족으로 자동 연결됩니다.</span>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/students')}
              className="h-9 px-5 text-sm"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 text-sm gap-2"
              style={{ background: '#040D1E' }}
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  학생 등록
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
