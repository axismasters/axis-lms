// AXIS LMS v1.2 - 시스템설정 > 권한설정
// HR & RBAC Stabilization v1
//
// system.permissionView 보유 시 조회 가능.
// system.permissionUpdate 보유자(기본: 최고관리자)만 체크박스 토글·저장·복사 가능.
//
// 구성:
//  - 좌측: 직급 목록 (선택 시 우측에 해당 직급 권한 매트릭스 표시)
//  - 우측: 권한 매트릭스 (카테고리별 기능명 + 조회/등록/수정/삭제/승인확정/공개발송 열)
//  - 권한 복사: 선택 직급의 권한을 다른 직급에 복사 (실제 동작)
//  - 변경 이력: 누가/언제/어떤 key를 추가·제거했는지 이력 기록 + 목록 조회
//  - 기본값 복원: 직급별 DEFAULT_PERMISSIONS_BY_POSITION으로 복원
//  - 최고관리자(SUPER_ADMIN) 권한 편집 불가 (고정)

import { useState, useMemo } from 'react';
import { ShieldCheck, Info, Lock, Copy, History, ChevronRight, RotateCcw, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/contexts/EmployeeContext';
import {
  Position, POSITIONS, PORTAL_ONLY_POSITIONS, POSITION_LABEL,
  PermissionKey, DEFAULT_PERMISSION_GROUPS, DEFAULT_PERMISSIONS_BY_POSITION,
} from '@/lib/rbac';

// ────────────────────────────────────────────────────────────
// 권한 카테고리 — 화면 표시용 (메뉴/기능명 + 열 매핑)
// ────────────────────────────────────────────────────────────
interface PermCol {
  label: string;
  key: PermissionKey | null; // null = 해당 카테고리에 없는 열
}

interface PermRow {
  feature: string;        // 기능명 (화면 표시)
  view: PermissionKey | null;
  create: PermissionKey | null;
  update: PermissionKey | null;
  remove: PermissionKey | null;    // 삭제(실제로는 퇴원/비활성 등 soft)
  approve: PermissionKey | null;   // 승인/확정
  publish: PermissionKey | null;   // 공개/발송
}

interface PermCategory {
  label: string;
  rows: PermRow[];
}

const PERM_CATEGORIES: PermCategory[] = [
  {
    label: '학생관리',
    rows: [
      { feature: '학생 조회', view: 'student.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '학생 등록', view: null, create: 'student.create', update: null, remove: null, approve: null, publish: null },
      { feature: '학생 정보 수정', view: null, create: null, update: 'student.update', remove: null, approve: null, publish: null },
      { feature: '퇴원 처리', view: null, create: null, update: null, remove: 'student.withdraw', approve: null, publish: null },
      { feature: '학생 비밀번호 초기화', view: null, create: null, update: 'student.passwordReset', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '직원관리',
    rows: [
      { feature: '직원 조회', view: 'employee.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '직원 등록', view: null, create: 'employee.create', update: null, remove: null, approve: null, publish: null },
      { feature: '직원 정보 수정', view: null, create: null, update: 'employee.update', remove: null, approve: null, publish: null },
      { feature: '퇴직 처리', view: null, create: null, update: null, remove: 'employee.resign', approve: null, publish: null },
      { feature: '직원 비밀번호 초기화', view: null, create: null, update: 'employee.passwordReset', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '반관리',
    rows: [
      { feature: '반 조회', view: 'class.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '반 등록', view: null, create: 'class.create', update: null, remove: null, approve: null, publish: null },
      { feature: '반 정보 수정', view: null, create: null, update: 'class.update', remove: null, approve: null, publish: null },
      { feature: '강사 배정', view: null, create: null, update: 'class.assignTeacher', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '수강관리',
    rows: [
      { feature: '수강 조회', view: 'enrollment.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '수강 등록', view: null, create: 'enrollment.create', update: null, remove: null, approve: null, publish: null },
      { feature: '수강 정보 수정/메모', view: null, create: null, update: 'enrollment.update', remove: null, approve: null, publish: null },
      { feature: '수강 종료', view: null, create: null, update: null, remove: 'enrollment.end', approve: null, publish: null },
      { feature: '퇴원 처리', view: null, create: null, update: null, remove: 'enrollment.withdraw', approve: null, publish: null },
    ],
  },
  {
    label: '출결관리',
    rows: [
      { feature: '출결 조회', view: 'attendance.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '출결 체크', view: null, create: 'attendance.check', update: null, remove: null, approve: null, publish: null },
      { feature: '출결 수정', view: null, create: null, update: 'attendance.update', remove: null, approve: null, publish: null },
      { feature: '전체 출결 조회', view: 'attendance.viewAll', create: null, update: null, remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '성적관리',
    rows: [
      { feature: '시험 조회', view: 'assessment.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '시험 생성', view: null, create: 'assessment.create', update: null, remove: null, approve: null, publish: null },
      { feature: '채점', view: null, create: null, update: 'assessment.grade', remove: null, approve: null, publish: null },
      { feature: '성적 공개', view: null, create: null, update: null, remove: null, approve: null, publish: 'assessment.publish' },
      { feature: '성적 조회 (결과)', view: 'assessment.resultView', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '성적 오류 수정', view: null, create: null, update: 'assessment.resultCorrect', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '재무관리',
    rows: [
      { feature: '재무 조회', view: 'finance.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '수납 등록', view: null, create: 'finance.paymentCreate', update: null, remove: null, approve: null, publish: null },
      { feature: '환불 요청', view: null, create: 'finance.refundRequest', update: null, remove: null, approve: null, publish: null },
      { feature: '환불 승인', view: null, create: null, update: null, remove: null, approve: 'finance.refundApprove', publish: null },
      { feature: '영수증 발급', view: null, create: null, update: 'finance.receiptIssue', remove: null, approve: null, publish: null },
      { feature: '정산 확정', view: null, create: null, update: null, remove: null, approve: 'finance.settlementConfirm', publish: null },
      { feature: '재무 설정 변경', view: null, create: null, update: 'finance.settingUpdate', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '알림관리',
    rows: [
      { feature: '발송이력 조회', view: 'notification.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '알림 발송', view: null, create: null, update: null, remove: null, approve: null, publish: 'notification.send' },
      { feature: '템플릿 관리', view: null, create: null, update: 'notification.templateManage', remove: null, approve: null, publish: null },
      { feature: '알림 설정 관리', view: null, create: null, update: 'notification.settingManage', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '성장관리',
    rows: [
      { feature: '성장관리 메뉴 조회', view: 'growth.view', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '학생 성장/진열장 탭 조회', view: 'growth.studentView', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: 'SP 수동 지급', view: null, create: 'growth.awardSP', update: null, remove: null, approve: null, publish: null },
      { feature: '엠블럼 수동 지급', view: null, create: 'growth.awardEmblem', update: null, remove: null, approve: null, publish: null },
      { feature: '엠블럼 정책 관리', view: null, create: null, update: 'growth.emblemManage', remove: null, approve: null, publish: null },
      { feature: '라이벌 전체 조회', view: 'growth.rivalView', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '라이벌 관계/승패 관리', view: null, create: null, update: 'growth.rivalManage', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '시스템설정',
    rows: [
      { feature: '학원정보 수정 / 로고 업로드', view: null, create: null, update: 'system.logoUpdate', remove: null, approve: null, publish: null },
      { feature: '권한설정 조회', view: 'system.permissionView', create: null, update: null, remove: null, approve: null, publish: null },
      { feature: '권한설정 편집', view: null, create: null, update: 'system.permissionUpdate', remove: null, approve: null, publish: null },
    ],
  },
  {
    label: '비밀번호 초기화',
    rows: [
      { feature: '시스템 비밀번호 초기화', view: null, create: null, update: 'system.passwordReset', remove: null, approve: null, publish: null },
    ],
  },
];

const COL_LABELS = ['조회', '등록', '수정', '삭제', '승인/확정', '공개/발송'] as const;
type ColKey = 'view' | 'create' | 'update' | 'remove' | 'approve' | 'publish';
const COL_KEYS: ColKey[] = ['view', 'create', 'update', 'remove', 'approve', 'publish'];

// ────────────────────────────────────────────────────────────
// 권한 복사 모달
// ────────────────────────────────────────────────────────────
function CopyModal({
  sourcePosition,
  matrix,
  onClose,
  onApply,
}: {
  sourcePosition: Position;
  matrix: Record<Position, Set<PermissionKey>>;
  onClose: () => void;
  onApply: (target: Position) => void;
}) {
  const [target, setTarget] = useState<Position | ''>('');
  const COPYABLE = POSITIONS.filter((p) => p !== 'SUPER_ADMIN' && p !== sourcePosition);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>권한 복사</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
            <b>{POSITION_LABEL[sourcePosition]}</b> 직급의 현재 권한 설정을 다른 직급에 복사합니다.
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs" style={{ background: 'oklch(0.97 0.05 80)', color: 'oklch(0.45 0.1 80)' }}>
            <AlertTriangle size={12} /> 대상 직급의 기존 권한이 복사한 권한으로 대체됩니다.
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.015 250)' }}>복사 대상 직급</span>
            <select className="text-sm px-2.5 py-2 rounded-md bg-white" style={{ border: '1px solid oklch(0.9 0.008 250)', color: 'oklch(0.3 0.02 250)' }}
              value={target} onChange={(e) => setTarget(e.target.value as Position)}>
              <option value="">직급 선택</option>
              {COPYABLE.map((p) => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
            style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
          <button
            disabled={!target}
            onClick={() => target && onApply(target as Position)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white disabled:opacity-40"
            style={{ background: 'oklch(0.511 0.262 276.966)' }}>
            <Copy size={12} /> 복사 실행
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 변경 이력 패널
// ────────────────────────────────────────────────────────────
function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { permissionLogs } = useEmployees();
  const sorted = [...permissionLogs].sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'oklch(0.2 0.02 250)' }}>
            <History size={14} /> 권한 변경 이력
          </h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'oklch(0.55 0.015 250)' }}>변경 이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((log) => (
                <div key={log.id} className="rounded-md p-3" style={{ border: '1px solid oklch(0.93 0.008 250)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: 'oklch(0.35 0.02 250)' }}>
                      {POSITION_LABEL[log.targetPosition]}
                      {log.sourcePosition && <span className="ml-1 font-normal" style={{ color: 'oklch(0.55 0.015 250)' }}>← {POSITION_LABEL[log.sourcePosition]} 복사</span>}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'oklch(0.55 0.015 250)' }}>
                      {new Date(log.changedAt).toLocaleString('ko-KR')} · {log.changedBy}
                    </span>
                  </div>
                  {log.addedKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.addedKeys.map((k) => (
                        <span key={k} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'oklch(0.94 0.08 160)', color: 'oklch(0.35 0.12 160)' }}>
                          + {k}
                        </span>
                      ))}
                    </div>
                  )}
                  {log.removedKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.removedKeys.map((k) => (
                        <span key={k} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'oklch(0.96 0.06 25)', color: 'oklch(0.45 0.2 25)' }}>
                          - {k}
                        </span>
                      ))}
                    </div>
                  )}
                  {log.note && <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.015 250)' }}>{log.note}</p>}
                  {log.addedKeys.length === 0 && log.removedKeys.length === 0 && (
                    <p className="text-xs" style={{ color: 'oklch(0.6 0.015 250)' }}>변경 없음 (검토 기록)</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
          <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
            <Info size={11} /> 권한 변경 이력은 삭제되지 않습니다 (append-only).
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────
export default function PermissionSettings() {
  const { can, currentUser } = useAuth();
  const { recordPermissionChange } = useEmployees();
  const canView = can('system.permissionView');
  const canEdit = can('system.permissionUpdate');

  const ALL_POSITIONS: Position[] = [...POSITIONS, ...PORTAL_ONLY_POSITIONS];

  // 로컬 권한 매트릭스 상태
  const [matrix, setMatrix] = useState<Record<Position, Set<PermissionKey>>>(() => {
    const m: Partial<Record<Position, Set<PermissionKey>>> = {};
    DEFAULT_PERMISSION_GROUPS.forEach((g) => { m[g.basePosition] = new Set(g.permissions); });
    return m as Record<Position, Set<PermissionKey>>;
  });

  // 선택된 직급 (좌측 클릭)
  const [selected, setSelected] = useState<Position>('SUPER_ADMIN');
  // 저장 전 변경 추적
  const [pendingAdded, setPendingAdded] = useState<Set<PermissionKey>>(new Set());
  const [pendingRemoved, setPendingRemoved] = useState<Set<PermissionKey>>(new Set());
  // 모달
  const [showCopy, setShowCopy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // 복원 확인
  const [showRestore, setShowRestore] = useState(false);

  const isPortalOnly = (p: Position) => PORTAL_ONLY_POSITIONS.includes(p);
  const isLocked = (p: Position) => p === 'SUPER_ADMIN' || isPortalOnly(p);

  const toggle = (key: PermissionKey) => {
    if (!canEdit) { toast.error('권한 매트릭스 편집은 최고관리자만 가능합니다.'); return; }
    if (isLocked(selected)) { toast.error(selected === 'SUPER_ADMIN' ? '최고관리자 권한은 편집할 수 없습니다.' : '포털용 직급은 현재 단계에서 편집할 수 없습니다.'); return; }

    setMatrix((prev) => {
      const next = { ...prev };
      const set = new Set(next[selected]);
      if (set.has(key)) {
        set.delete(key);
        setPendingRemoved((r) => new Set([...r, key]));
        setPendingAdded((a) => { const n = new Set(a); n.delete(key); return n; });
      } else {
        set.add(key);
        setPendingAdded((a) => new Set([...a, key]));
        setPendingRemoved((r) => { const n = new Set(r); n.delete(key); return n; });
      }
      next[selected] = set;
      return next;
    });
  };

  const save = () => {
    if (!canEdit) return;
    if (pendingAdded.size === 0 && pendingRemoved.size === 0) {
      toast.info('변경된 권한이 없습니다.'); return;
    }
    recordPermissionChange({
      targetPosition: selected,
      addedKeys: Array.from(pendingAdded),
      removedKeys: Array.from(pendingRemoved),
      changedBy: currentUser.name,
    });
    setPendingAdded(new Set());
    setPendingRemoved(new Set());
    toast.success(`${POSITION_LABEL[selected]} 권한이 저장되었습니다. (변경 이력 기록 완료)`);
  };

  // 권한 복사
  const applyCopy = (target: Position) => {
    if (!canEdit) return;
    const sourcePerms = new Set(matrix[selected]);
    const targetOld = new Set(matrix[target]);
    const added = Array.from(sourcePerms).filter((k) => !targetOld.has(k)) as PermissionKey[];
    const removed = Array.from(targetOld).filter((k) => !sourcePerms.has(k)) as PermissionKey[];

    setMatrix((prev) => ({ ...prev, [target]: new Set(sourcePerms) }));
    recordPermissionChange({
      targetPosition: target,
      addedKeys: added,
      removedKeys: removed,
      changedBy: currentUser.name,
      sourcePosition: selected,
      note: `${POSITION_LABEL[selected]} 직급 권한 복사`,
    });
    setShowCopy(false);
    toast.success(`${POSITION_LABEL[selected]} → ${POSITION_LABEL[target]} 권한 복사 완료. 변경 이력이 기록되었습니다.`);
  };

  // 기본값 복원
  const restoreDefault = () => {
    if (!canEdit) return;
    const defaults = DEFAULT_PERMISSIONS_BY_POSITION[selected];
    const old = matrix[selected];
    const added = defaults.filter((k) => !old.has(k));
    const removed = Array.from(old).filter((k) => !defaults.includes(k as PermissionKey)) as PermissionKey[];

    setMatrix((prev) => ({ ...prev, [selected]: new Set(defaults) }));
    recordPermissionChange({
      targetPosition: selected,
      addedKeys: added,
      removedKeys: removed,
      changedBy: currentUser.name,
      note: `${POSITION_LABEL[selected]} 기본값 복원`,
    });
    setPendingAdded(new Set());
    setPendingRemoved(new Set());
    setShowRestore(false);
    toast.success(`${POSITION_LABEL[selected]} 권한이 기본값으로 복원되었습니다.`);
  };

  // 직급 변경 시 pending 초기화
  const selectPosition = (p: Position) => {
    if ((pendingAdded.size > 0 || pendingRemoved.size > 0) && canEdit) {
      toast.info('미저장 변경사항이 있습니다. 저장 또는 취소 후 직급을 변경해주세요.');
      return;
    }
    setSelected(p);
    setPendingAdded(new Set());
    setPendingRemoved(new Set());
  };

  if (!canView) {
    return (
      <AdminLayout title="권한설정" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '권한설정' }]}>
        <div className="axis-card p-12 text-center">
          <p className="text-sm" style={{ color: 'oklch(0.5 0.015 250)' }}>권한설정 조회 권한이 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  const hasPending = pendingAdded.size > 0 || pendingRemoved.size > 0;

  return (
    <AdminLayout title="권한설정" breadcrumbs={[{ label: '시스템설정', path: '/settings' }, { label: '권한설정' }]}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'oklch(0.2 0.02 250)' }}>
            <ShieldCheck size={18} /> 직급별 권한설정
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.015 250)' }}>
            직급(권한그룹)별 기능 접근 권한 매트릭스입니다. 직급과 권한은 분리되어 관리됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border hover:bg-slate-50"
            style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.45 0.02 250)' }}>
            <History size={13} /> 변경 이력
          </button>
          {canEdit && !isLocked(selected) && (
            <>
              <button onClick={() => setShowCopy(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border hover:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.45 0.02 250)' }}>
                <Copy size={13} /> 권한 복사
              </button>
              <button onClick={() => setShowRestore(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border hover:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.45 0.02 250)' }}>
                <RotateCcw size={13} /> 기본값 복원
              </button>
              <button onClick={save}
                disabled={!hasPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium text-white disabled:opacity-40"
                style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                <Check size={13} /> 저장{hasPending ? ` (+${pendingAdded.size} -${pendingRemoved.size})` : ''}
              </button>
            </>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: 'oklch(0.97 0.02 250)', color: 'oklch(0.42 0.08 250)' }}>
          <Info size={13} /> 조회 전용입니다. 권한 매트릭스 편집은 system.permissionUpdate 권한(기본: 최고관리자)이 필요합니다.
        </div>
      )}

      <div className="grid lg:grid-cols-[200px_1fr] gap-3">
        {/* 좌측: 직급 목록 */}
        <div className="axis-card p-2 lg:sticky lg:top-4 self-start">
          <div className="px-2 py-1.5 text-xs font-semibold" style={{ color: 'oklch(0.45 0.02 250)' }}>직급 선택</div>
          {POSITIONS.map((p) => (
            <button
              key={p}
              onClick={() => selectPosition(p)}
              className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-md text-sm text-left transition-colors"
              style={{
                background: selected === p ? 'oklch(0.511 0.262 276.966)' : 'transparent',
                color: selected === p ? 'white' : 'oklch(0.3 0.02 250)',
              }}>
              <span className="flex items-center gap-1.5">
                {POSITION_LABEL[p]}
                {p === 'SUPER_ADMIN' && <Lock size={10} style={{ color: selected === p ? 'rgba(255,255,255,0.7)' : 'oklch(0.6 0.015 250)' }} />}
              </span>
              <ChevronRight size={12} style={{ opacity: 0.5 }} />
            </button>
          ))}
          <div className="mt-2 pt-2 px-2" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.55 0.015 250)' }}>포털용(조회 전용)</div>
            {PORTAL_ONLY_POSITIONS.map((p) => (
              <button key={p} onClick={() => selectPosition(p)}
                className="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors"
                style={{
                  color: selected === p ? 'oklch(0.45 0.2 277)' : 'oklch(0.55 0.015 250)',
                  background: selected === p ? 'oklch(0.95 0.02 277)' : 'transparent',
                }}>
                {POSITION_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {/* 우측: 권한 매트릭스 */}
        <div className="axis-card overflow-hidden">
          {/* 선택 직급 헤더 */}
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)', background: 'oklch(0.98 0.004 247)' }}>
            <ShieldCheck size={14} style={{ color: 'oklch(0.511 0.262 276.966)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.25 0.02 250)' }}>
              {POSITION_LABEL[selected]} 권한
            </span>
            {isLocked(selected) && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.94 0.01 250)', color: 'oklch(0.5 0.015 250)' }}>
                {selected === 'SUPER_ADMIN' ? '고정 (편집 불가)' : '포털용 (편집 불가)'}
              </span>
            )}
            {hasPending && !isLocked(selected) && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'oklch(0.95 0.08 80)', color: 'oklch(0.4 0.12 80)' }}>
                미저장 변경 있음
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 680 }}>
              <thead>
                <tr style={{ background: 'oklch(0.97 0.006 250)', borderBottom: '1px solid oklch(0.9 0.008 250)' }}>
                  <th className="text-left font-semibold px-4 py-2.5" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12, minWidth: 180 }}>기능</th>
                  {COL_LABELS.map((l) => (
                    <th key={l} className="text-center font-semibold px-3 py-2.5 whitespace-nowrap" style={{ color: 'oklch(0.45 0.015 250)', fontSize: 12 }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERM_CATEGORIES.map((cat) => (
                  <>
                    <tr key={cat.label} style={{ background: 'oklch(0.96 0.008 250)' }}>
                      <td colSpan={7} className="px-4 py-1.5 text-xs font-semibold" style={{ color: 'oklch(0.4 0.02 250)' }}>
                        {cat.label}
                      </td>
                    </tr>
                    {cat.rows.map((row) => (
                      <tr key={row.feature} style={{ borderBottom: '1px solid oklch(0.96 0.006 250)' }}>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: 'oklch(0.3 0.02 250)' }}>{row.feature}</td>
                        {COL_KEYS.map((ck) => {
                          const key = row[ck] as PermissionKey | null;
                          if (!key) {
                            return <td key={ck} className="text-center px-3 py-2.5">
                              <span style={{ color: 'oklch(0.88 0.008 250)' }}>—</span>
                            </td>;
                          }
                          const locked = isLocked(selected);
                          const checked = selected === 'SUPER_ADMIN' ? true : (matrix[selected]?.has(key) ?? false);
                          const isPending = pendingAdded.has(key) || pendingRemoved.has(key);
                          return (
                            <td key={ck} className="text-center px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canEdit || locked}
                                onChange={() => toggle(key)}
                                className="cursor-pointer disabled:cursor-not-allowed"
                                style={{
                                  accentColor: 'oklch(0.511 0.262 276.966)',
                                  outline: isPending ? '2px solid oklch(0.7 0.12 80)' : undefined,
                                  outlineOffset: '2px',
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
          <Lock size={11} /> 최고관리자(SUPER_ADMIN) 권한은 고정되어 편집할 수 없습니다. 학생/보호자는 포털용 권한만 적용되며 현재 단계에서는 편집할 수 없습니다.
        </p>
        <p className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.6 0.015 250)' }}>
          <Info size={11} /> 저장 버튼 클릭 시 변경 이력이 자동 기록됩니다 (삭제 불가).
        </p>
      </div>

      {/* 권한 복사 모달 */}
      {showCopy && !isLocked(selected) && (
        <CopyModal
          sourcePosition={selected}
          matrix={matrix}
          onClose={() => setShowCopy(false)}
          onApply={applyCopy}
        />
      )}

      {/* 변경 이력 패널 */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

      {/* 기본값 복원 확인 */}
      {showRestore && !isLocked(selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0 0 0 / 0.4)' }} onClick={() => setShowRestore(false)}>
          <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 20px 50px oklch(0 0 0 / 0.25)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid oklch(0.93 0.008 250)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.02 250)' }}>기본값 복원</h3>
              <button onClick={() => setShowRestore(false)}><X size={16} /></button>
            </div>
            <div className="p-4">
              <p className="text-sm" style={{ color: 'oklch(0.3 0.02 250)' }}>
                <b>{POSITION_LABEL[selected]}</b> 직급의 권한을 시스템 기본값으로 복원합니다.
              </p>
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md text-xs" style={{ background: 'oklch(0.97 0.05 80)', color: 'oklch(0.45 0.1 80)' }}>
                <AlertTriangle size={12} /> 현재 설정이 기본값으로 대체됩니다.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid oklch(0.93 0.008 250)' }}>
              <button onClick={() => setShowRestore(false)} className="px-3 py-1.5 rounded-md text-sm border hover:bg-slate-50"
                style={{ borderColor: 'oklch(0.9 0.008 250)', color: 'oklch(0.4 0.02 250)' }}>취소</button>
              <button onClick={restoreDefault} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white"
                style={{ background: 'oklch(0.511 0.262 276.966)' }}>
                <RotateCcw size={12} /> 복원 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
