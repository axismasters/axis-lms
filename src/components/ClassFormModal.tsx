// AXIS LMS v1.2 - 반 생성/수정 모달
// Design: Structured Authority
// 탭: 기본정보 / 시간표 / 정원·수강료

import { useState, useEffect } from 'react';
import { useClasses } from '@/contexts/ClassContext';
import {
  ClassRoom, ClassStatus, SubjectType, DayOfWeek,
  TEACHERS, ROOMS, LEVEL_OPTIONS, TIME_OPTIONS, DAY_ORDER
} from '@/lib/classData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';

type TabKey = 'basic' | 'schedule' | 'capacity';

interface Props {
  open: boolean;
  editId?: string;
  onClose: () => void;
}

const SUBJECT_OPTIONS: SubjectType[] = ['국어', '수학', '영어', '과학', '사회', '한국사', '탐구', '기타'];
const STATUS_OPTIONS: ClassStatus[] = ['운영중', '개설예정', '종강'];

const EMPTY_FORM = {
  name: '',
  subject: '수학' as SubjectType,
  teacher: '',
  level: '고3',
  description: '',
  status: '운영중' as ClassStatus,
  startDate: '',
  endDate: '',
  room: '',
  capacity: 20,
  fee: 0,
  timeSlots: [] as ClassRoom['timeSlots'],
};

export default function ClassFormModal({ open, editId, onClose }: Props) {
  const { classes, addClass, updateClass, getClass } = useClasses();
  const isEdit = !!editId;
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (open) {
      setActiveTab('basic');
      if (editId) {
        const cls = getClass(editId);
        if (cls) {
          setForm({
            name: cls.name,
            subject: cls.subject,
            teacher: cls.teacher,
            level: cls.level,
            description: cls.description || '',
            status: cls.status,
            startDate: cls.startDate,
            endDate: cls.endDate || '',
            room: cls.room || '',
            capacity: cls.capacity,
            fee: cls.fee || 0,
            timeSlots: cls.timeSlots.map(ts => ({ ...ts })),
          });
        }
      } else {
        setForm({ ...EMPTY_FORM });
      }
    }
  }, [open, editId]);

  const set = (key: keyof typeof EMPTY_FORM, val: any) =>
    setForm(p => ({ ...p, [key]: val }));

  // 시간표 관리
  const addTimeSlot = () => {
    setForm(p => ({
      ...p,
      timeSlots: [...p.timeSlots, { id: nanoid(6), day: '월', startTime: '18:00', endTime: '20:00' }],
    }));
  };

  const updateTimeSlot = (id: string, key: keyof ClassRoom['timeSlots'][0], val: string) => {
    setForm(p => ({
      ...p,
      timeSlots: p.timeSlots.map(ts => ts.id === id ? { ...ts, [key]: val } : ts),
    }));
  };

  const removeTimeSlot = (id: string) => {
    setForm(p => ({ ...p, timeSlots: p.timeSlots.filter(ts => ts.id !== id) }));
  };

  // 시간 충돌 감지 (같은 요일, 시간 겹침)
  const hasConflict = (slots: ClassRoom['timeSlots']) => {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i], b = slots[j];
        if (a.day !== b.day) continue;
        if (a.startTime < b.endTime && b.startTime < a.endTime) return true;
      }
    }
    return false;
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('반 이름을 입력해주세요.'); setActiveTab('basic'); return; }
    if (!form.teacher) { toast.error('담당 강사를 선택해주세요.'); setActiveTab('basic'); return; }
    if (!form.startDate) { toast.error('개강일을 입력해주세요.'); setActiveTab('basic'); return; }
    if (form.timeSlots.length === 0) { toast.error('시간표를 1개 이상 추가해주세요.'); setActiveTab('schedule'); return; }
    if (hasConflict(form.timeSlots)) { toast.error('같은 요일에 시간이 겹치는 슬롯이 있습니다.'); setActiveTab('schedule'); return; }
    if (form.capacity < 1) { toast.error('정원은 1명 이상이어야 합니다.'); setActiveTab('capacity'); return; }

    const payload = {
      name: form.name.trim(),
      subject: form.subject,
      teacher: form.teacher,
      level: form.level,
      description: form.description,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      room: form.room || undefined,
      capacity: Number(form.capacity),
      fee: Number(form.fee),
      timeSlots: form.timeSlots,
    };

    if (isEdit && editId) {
      updateClass(editId, payload);
      toast.success(`'${form.name}' 반 정보가 수정되었습니다.`);
    } else {
      addClass(payload);
      toast.success(`'${form.name}' 반이 개설되었습니다.`);
    }
    onClose();
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'basic', label: '기본 정보' },
    { key: 'schedule', label: '시간표 설정' },
    { key: 'capacity', label: '정원 · 수강료' },
  ];

  // 시간표 정렬
  const sortedSlots = [...form.timeSlots].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl modal-enter">
        <DialogHeader>
          <DialogTitle className="text-base">{isEdit ? '반 정보 수정' : '반 개설'}</DialogTitle>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex border-b -mx-6 px-6" style={{ borderColor: 'oklch(0.92 0.005 250)' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key ? 'border-[#040D1E]' : 'border-transparent'
              )}
              style={{ color: activeTab === tab.key ? '#040D1E' : 'oklch(0.55 0.015 250)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {/* ── 탭 1: 기본 정보 ── */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">반 이름 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span></Label>
                <Input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="예: 고3 수학 심화반"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">과목 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span></Label>
                  <Select value={form.subject} onValueChange={v => set('subject', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBJECT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">수준</Label>
                  <Select value={form.level} onValueChange={v => set('level', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVEL_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">담당 강사 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span></Label>
                  <Select value={form.teacher} onValueChange={v => set('teacher', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>{TEACHERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">강의실</Label>
                  <Select value={form.room} onValueChange={v => set('room', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>{ROOMS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">개강일 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span></Label>
                  <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">종강일 <span className="text-xs font-normal" style={{ color: 'oklch(0.6 0.01 250)' }}>(선택)</span></Label>
                  <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className="h-9 text-sm" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">운영 상태</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">반 설명 <span className="text-xs font-normal" style={{ color: 'oklch(0.6 0.01 250)' }}>(선택)</span></Label>
                <Textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="반 소개, 학습 목표 등을 입력하세요"
                  className="text-sm min-h-16 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── 탭 2: 시간표 설정 ── */}
          {activeTab === 'schedule' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'oklch(0.3 0.015 250)' }}>수업 시간표</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.6 0.015 250)' }}>요일과 시작·종료 시간을 설정하세요. 복수 추가 가능합니다.</div>
                </div>
                <Button variant="outline" size="sm" onClick={addTimeSlot} className="h-7 text-xs gap-1">
                  <Plus size={11} /> 시간 추가
                </Button>
              </div>

              {form.timeSlots.length === 0 ? (
                <div className="text-center py-10 rounded-lg" style={{ background: 'oklch(0.985 0.003 250)', border: '2px dashed oklch(0.88 0.005 250)' }}>
                  <Clock size={24} style={{ color: 'oklch(0.75 0.01 250)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>시간표를 추가해주세요.</p>
                  <Button variant="outline" size="sm" onClick={addTimeSlot} className="mt-3 h-7 text-xs gap-1">
                    <Plus size={11} /> 시간 추가
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedSlots.map((ts, idx) => (
                    <div key={ts.id} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'oklch(0.985 0.003 250)', border: '1px solid oklch(0.92 0.005 250)' }}>
                      <span className="text-xs font-medium w-4 text-center" style={{ color: 'oklch(0.6 0.015 250)' }}>{idx + 1}</span>

                      {/* 요일 */}
                      <Select value={ts.day} onValueChange={v => updateTimeSlot(ts.id, 'day', v)}>
                        <SelectTrigger className="h-8 text-xs w-16 flex-shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_ORDER.map(d => <SelectItem key={d} value={d}>{d}요일</SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* 시작 시간 */}
                      <Select value={ts.startTime} onValueChange={v => updateTimeSlot(ts.id, 'startTime', v)}>
                        <SelectTrigger className="h-8 text-xs w-24 flex-shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <span className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>~</span>

                      {/* 종료 시간 */}
                      <Select value={ts.endTime} onValueChange={v => updateTimeSlot(ts.id, 'endTime', v)}>
                        <SelectTrigger className="h-8 text-xs w-24 flex-shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {TIME_OPTIONS.filter(t => t > ts.startTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* 수업 시간 계산 */}
                      <span className="text-xs flex-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        {(() => {
                          const [sh, sm] = ts.startTime.split(':').map(Number);
                          const [eh, em] = ts.endTime.split(':').map(Number);
                          const mins = (eh * 60 + em) - (sh * 60 + sm);
                          return mins > 0 ? `${Math.floor(mins / 60)}시간${mins % 60 > 0 ? ` ${mins % 60}분` : ''}` : '';
                        })()}
                      </span>

                      <button onClick={() => removeTimeSlot(ts.id)} className="p-1.5 rounded hover:bg-rose-50 transition-colors flex-shrink-0">
                        <Trash2 size={12} style={{ color: 'oklch(0.577 0.245 27.325)' }} />
                      </button>
                    </div>
                  ))}

                  {hasConflict(form.timeSlots) && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs" style={{ background: 'oklch(0.97 0.06 27)', color: 'oklch(0.45 0.15 27)', border: '1px solid oklch(0.88 0.1 27)' }}>
                      <Info size={12} />
                      같은 요일에 시간이 겹치는 슬롯이 있습니다. 저장 전에 수정해주세요.
                    </div>
                  )}
                </div>
              )}

              {/* 시간표 미리보기 */}
              {form.timeSlots.length > 0 && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: 'oklch(0.97 0.04 250)', border: '1px solid oklch(0.9 0.06 250)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.4 0.12 250)' }}>시간표 미리보기</div>
                  <div className="flex flex-wrap gap-2">
                    {sortedSlots.map(ts => (
                      <span key={ts.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'oklch(0.95 0.04 250)', color: 'oklch(0.35 0.18 250)', border: '1px solid oklch(0.85 0.08 250)' }}>
                        {ts.day} {ts.startTime}~{ts.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 탭 3: 정원 · 수강료 ── */}
          {activeTab === 'capacity' && (
            <div className="space-y-5">
              {/* 정원 설정 */}
              <div>
                <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.3 0.015 250)' }}>정원 설정</div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">최대 정원 <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span></Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={form.capacity}
                      onChange={e => set('capacity', Number(e.target.value))}
                      className="h-9 text-sm w-28"
                    />
                    <span className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>명</span>
                  </div>

                  {/* 정원 시각화 */}
                  <div className="mt-3 flex gap-1 flex-wrap">
                    {Array.from({ length: Math.min(form.capacity, 30) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-sm"
                        style={{ background: 'oklch(0.92 0.04 250)' }}
                        title={`${i + 1}번 자리`}
                      />
                    ))}
                    {form.capacity > 30 && (
                      <span className="text-xs self-center" style={{ color: 'oklch(0.6 0.015 250)' }}>
                        +{form.capacity - 30}명
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1.5" style={{ color: 'oklch(0.6 0.015 250)' }}>
                    총 {form.capacity}명 정원
                  </div>
                </div>
              </div>

              {/* 수강료 설정 */}
              <div>
                <div className="text-xs font-semibold mb-3" style={{ color: 'oklch(0.3 0.015 250)' }}>수강료</div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">월 수강료 <span className="text-xs font-normal" style={{ color: 'oklch(0.6 0.01 250)' }}>(선택)</span></Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      value={form.fee}
                      onChange={e => set('fee', Number(e.target.value))}
                      className="h-9 text-sm w-40"
                      placeholder="0"
                    />
                    <span className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>원</span>
                    {form.fee > 0 && (
                      <span className="text-sm font-semibold" style={{ color: '#040D1E' }}>
                        {form.fee.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 요약 */}
              {(form.capacity > 0 || form.fee > 0) && (
                <div className="p-3 rounded-lg" style={{ background: 'oklch(0.97 0.04 250)', border: '1px solid oklch(0.9 0.06 250)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.4 0.12 250)' }}>정원 요약</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div style={{ color: 'oklch(0.5 0.015 250)' }}>최대 정원</div>
                    <div className="font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{form.capacity}명</div>
                    {form.fee > 0 && (
                      <>
                        <div style={{ color: 'oklch(0.5 0.015 250)' }}>월 수강료</div>
                        <div className="font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>{form.fee.toLocaleString()}원</div>
                        <div style={{ color: 'oklch(0.5 0.015 250)' }}>정원 마감 시 월 매출</div>
                        <div className="font-semibold" style={{ color: '#040D1E' }}>
                          {(form.capacity * form.fee).toLocaleString()}원
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {/* 탭 이동 버튼 */}
          <div className="flex gap-2 mr-auto">
            {activeTab !== 'basic' && (
              <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === 'capacity' ? 'schedule' : 'basic')} className="h-8 text-xs">
                ← 이전
              </Button>
            )}
            {activeTab !== 'capacity' && (
              <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === 'basic' ? 'schedule' : 'capacity')} className="h-8 text-xs">
                다음 →
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">취소</Button>
          <Button size="sm" onClick={handleSubmit} className="h-8 text-xs" style={{ background: '#040D1E' }}>
            {isEdit ? '수정 저장' : '반 개설'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
