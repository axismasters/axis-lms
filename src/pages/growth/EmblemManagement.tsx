// AXIS LMS v1.2 - 엠블럼관리 (Growth Showcase Foundation v2)
// 삭제 없음 — 비활성 처리만 제공.
// 엠블럼 추가/수정/활성토글/숨김토글: 원장급 이상(canManageEmblems).
// 강사/행정: 조회만 가능.

import { useState, useEffect } from 'react';
import { Trophy, Plus, Eye, EyeOff, Edit2, X, Check, GripVertical } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useGrowth } from '@/contexts/GrowthContext';
import { useAuth } from '@/contexts/AuthContext';
import { canManageEmblems, canAccessGrowth } from '@/lib/rbac';
import {
  Emblem, EmblemCategory, EmblemMaterial,
  CATEGORY_LABELS, MATERIAL_LABELS, MATERIAL_BADGE, CATEGORY_BADGE,
} from '@/lib/growthData';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useDraggableModal } from '@/hooks/useDraggableModal';

const CATEGORIES: EmblemCategory[] = ['LIFE', 'GROWTH', 'ASSESSMENT', 'RIVAL', 'SKILL', 'SPECIAL'];
const MATERIALS: EmblemMaterial[] = ['WOOD', 'STONE', 'BRONZE', 'IRON', 'SILVER', 'GOLD', 'DIAMOND'];

type FormData = Omit<Emblem, 'id' | 'createdAt'>;

const DEFAULT_FORM: FormData = {
  name: '', category: 'GROWTH', description: '', material: 'WOOD',
  conditionText: '', requiredCount: 1, hidden: false, active: true,
};

export default function EmblemManagement() {
  const { emblems, addEmblem, updateEmblem, toggleEmblemActive, toggleEmblemHidden } = useGrowth();
  const { currentUser } = useAuth();
  const canManage = canManageEmblems(currentUser.accountType);

  // Phase 3D v3-r1: Rules of Hooks 준수 — 아래 접근 권한 조기 return보다 반드시 앞에
  // 모든 hook을 선언해야 한다(조건부로 hook 호출 개수가 달라지면 안 됨).
  const [filterCat, setFilterCat] = useState<EmblemCategory | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Emblem | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const draggable = useDraggableModal(showModal);

  // Phase 3D v3-r1: ESC로 팝업 닫기 지원 (X 클릭/overlay 클릭과 동일하게 동작해야 함)
  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  // 페이지 진입 가드 — TEACHER 및 STUDENT/GUARDIAN 차단 (URL 직접 입력 시에도 적용)
  if (!canAccessGrowth(currentUser.accountType)) {
    return (
      <AdminLayout title="엠블럼관리" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '엠블럼관리' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>접근 권한이 없습니다.</p>
          <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>
            성장관리 메뉴는 최고관리자·원장·행정 계정만 접근할 수 있습니다.
          </p>
        </div>
      </AdminLayout>
    );
  }

  const filtered = emblems.filter(e => {
    if (filterCat !== 'ALL' && e.category !== filterCat) return false;
    if (filterActive === 'ACTIVE' && !e.active) return false;
    if (filterActive === 'INACTIVE' && e.active) return false;
    return true;
  });

  const openAdd = () => { setEditTarget(null); setForm(DEFAULT_FORM); setShowModal(true); };
  const openEdit = (e: Emblem) => {
    setEditTarget(e);
    setForm({ name: e.name, category: e.category, description: e.description, material: e.material, conditionText: e.conditionText, requiredCount: e.requiredCount, hidden: e.hidden, active: e.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('엠블럼 이름을 입력하세요.'); return; }
    if (!form.conditionText.trim()) { toast.error('획득 조건을 입력하세요.'); return; }
    if (editTarget) {
      updateEmblem(editTarget.id, form);
      toast.success('엠블럼이 수정되었습니다.');
    } else {
      addEmblem(form);
      toast.success('엠블럼이 추가되었습니다.');
    }
    setShowModal(false);
  };

  return (
    <AdminLayout title="엠블럼관리" breadcrumbs={[{ label: '성장관리', path: '/growth/overview' }, { label: '엠블럼관리' }]}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} style={{ color: '#C8A15A' }} />
            <h1 className="text-lg font-bold" style={{ color: 'oklch(0.15 0.02 250)' }}>엠블럼관리</h1>
          </div>
          <p className="text-xs" style={{ color: 'oklch(0.55 0.015 250)' }}>
            엠블럼 정책을 설정합니다. 삭제 없이 비활성 처리로만 관리됩니다.
            {!canManage && <span className="ml-2" style={{ color: '#EF4444' }}>현재 계정은 조회만 가능합니다.</span>}
          </p>
        </div>
        {canManage && (
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: '#040D1E', color: '#C8A15A' }}>
            <Plus size={14} /> 엠블럼 추가
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="axis-card p-3 mb-3 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 flex-wrap">
          {(['ALL', ...CATEGORIES] as const).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className="px-2.5 py-1 text-xs rounded-md font-medium transition-colors"
              style={{
                background: filterCat === cat ? '#040D1E' : 'oklch(0.96 0.004 250)',
                color: filterCat === cat ? '#C8A15A' : 'oklch(0.5 0.015 250)',
              }}>
              {cat === 'ALL' ? '전체' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className="px-2.5 py-1 text-xs rounded-md"
              style={{
                background: filterActive === f ? '#D1FAE5' : 'oklch(0.96 0.004 250)',
                color: filterActive === f ? '#065F46' : 'oklch(0.5 0.015 250)',
              }}>
              {f === 'ALL' ? '전체' : f === 'ACTIVE' ? '활성' : '비활성'}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="axis-card overflow-hidden">
        <div className="axis-table-scroll" style={{ maxHeight: 560 }}>
        <table className="w-full text-sm border-collapse" style={{ minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'oklch(0.97 0.004 250)' }}>
              {['엠블럼명', '카테고리', '재질 단계', '획득 조건', '필요 횟수', '숨김', '활성', '관리'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold"
                  style={{ color: 'oklch(0.4 0.015 250)', background: 'oklch(0.97 0.004 250)', boxShadow: 'inset 0 -1px 0 oklch(0.92 0.006 250)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: 'oklch(0.6 0.015 250)' }}>엠블럼이 없습니다.</td></tr>
            )}
            {filtered.map(e => {
              const catBadge = CATEGORY_BADGE[e.category];
              const matBadge = MATERIAL_BADGE[e.material];
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid oklch(0.95 0.004 250)', opacity: e.active ? 1 : 0.5 }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'oklch(0.18 0.02 250)' }}>
                    {e.name}
                    {e.hidden && <span className="ml-1.5 text-xs" style={{ color: '#040D1E' }}>🔒숨김</span>}
                    {e.ifPlaceholderKey && (
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: '#E7EBF3', color: '#040D1E' }}>IF연동</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: catBadge.bg, color: catBadge.text }}>
                      {CATEGORY_LABELS[e.category]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: matBadge.bg, color: matBadge.text, border: `1px solid ${matBadge.border}` }}>
                      {MATERIAL_LABELS[e.material]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs max-w-48" style={{ color: 'oklch(0.35 0.015 250)' }}>
                    <span className="block truncate" title={e.conditionText}>{e.conditionText}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>{e.requiredCount}회</td>
                  <td className="px-4 py-2.5 text-center">
                    {canManage ? (
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { toggleEmblemHidden(e.id); toast.success(e.hidden ? '공개 전환' : '숨김 처리'); }}
                        className="h-8 w-8"
                        aria-label={e.hidden ? '공개로 전환' : '숨김 처리'}
                      >
                        {e.hidden ? <EyeOff size={15} style={{ color: '#040D1E' }} /> : <Eye size={15} style={{ color: 'oklch(0.55 0.015 250)' }} />}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center justify-center h-8 w-8" aria-hidden>
                        {e.hidden ? <EyeOff size={15} style={{ color: '#040D1E' }} /> : <Eye size={15} style={{ color: 'oklch(0.8 0.01 250)' }} />}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {canManage ? (
                      <button onClick={() => { toggleEmblemActive(e.id); toast.success(e.active ? '비활성 처리' : '활성화'); }}
                        className="text-xs px-2.5 py-1 rounded-md font-semibold transition-colors hover:brightness-95 active:scale-95"
                        style={{ background: e.active ? '#D1FAE5' : '#FEE2E2', color: e.active ? '#065F46' : '#991B1B', cursor: 'pointer' }}>
                        {e.active ? '활성' : '비활성'}
                      </button>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-md font-semibold"
                        style={{ background: e.active ? '#D1FAE5' : '#FEE2E2', color: e.active ? '#065F46' : '#991B1B' }}>
                        {e.active ? '활성' : '비활성'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(e)} className="h-7 text-xs gap-1">
                        <Edit2 size={12} /> 수정
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowModal(false)}>
          <div ref={draggable.panelRef} onClick={(ev) => ev.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md axis-modal-drag-enter flex flex-col"
            style={{ ...draggable.style, maxHeight: 'calc(100vh - 48px)' }}>
            <div
              className="flex items-center justify-between p-5 border-b flex-shrink-0"
              style={{ borderColor: 'oklch(0.92 0.006 250)' }}
            >
              {/* Phase 3D v3-r1: 드래그 핸들을 제목 영역에만 한정해서 X 버튼 클릭이 드래그
                  포인터 캡처에 막히지 않게 했다(기존에는 헤더 행 전체가 드래그 핸들이라
                  X 버튼도 그 안에 포함되어 있었음). */}
              <h2
                {...draggable.dragHandleProps}
                className="axis-modal-drag-handle font-bold text-base flex items-center gap-1.5"
                style={{ color: 'oklch(0.15 0.02 250)' }}
              >
                {!draggable.isMobile && <GripVertical size={15} style={{ color: 'oklch(0.75 0.01 250)' }} />}
                {editTarget ? '엠블럼 수정' : '엠블럼 추가'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="h-8 w-8" aria-label="닫기">
                <X size={17} style={{ color: 'oklch(0.5 0.015 250)' }} />
              </Button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto min-h-0">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>엠블럼 이름 *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>카테고리</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as EmblemCategory }))}
                    className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>재질 단계</label>
                  <select value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value as EmblemMaterial }))}
                    className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }}>
                    {MATERIALS.map(m => <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>설명</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>획득 조건 *</label>
                <input value={form.conditionText} onChange={e => setForm(p => ({ ...p, conditionText: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'oklch(0.4 0.015 250)' }}>필요 횟수</label>
                <input type="number" min={1} value={form.requiredCount}
                  onChange={e => setForm(p => ({ ...p, requiredCount: Math.max(1, Number(e.target.value)) }))}
                  className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'oklch(0.87 0.006 250)' }} />
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.hidden} onChange={e => setForm(p => ({ ...p, hidden: e.target.checked }))} />
                  숨김 엠블럼 (조건 미공개)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                  활성
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t flex-shrink-0" style={{ borderColor: 'oklch(0.92 0.006 250)' }}>
              <Button variant="outline" size="default" onClick={() => setShowModal(false)} className="text-sm">취소</Button>
              <Button onClick={handleSave} className="gap-1.5 text-sm" style={{ background: '#040D1E', color: '#C8A15A' }}>
                <Check size={14} /> {editTarget ? '수정 완료' : '추가'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
