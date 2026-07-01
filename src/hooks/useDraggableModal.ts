// AXIS LMS v1.2 - Phase 3D: 팝업(모달) 드래그 이동 훅
//
// 정책:
// - 팝업은 기본적으로 화면 중앙(transform 없음)에서 시작한다.
// - 제목 영역(드래그 핸들)을 눌러 이동할 수 있다(Pointer Capture 사용 — 포인터가
//   핸들 밖으로 나가도 이동/해제 이벤트를 계속 받는다).
// - 이동 범위는 clampPosition()으로 제한해 팝업이 화면 밖으로 완전히 나가지 않게
//   한다(각 변에 최소 margin px는 항상 화면 안에 남는다).
// - 모바일(뷰포트 폭 768px 미만)에서는 드래그를 비활성화하고 항상 중앙 정렬을
//   우선한다 — 드래그 이벤트 자체를 무시한다.
// - 팝업이 다시 열릴 때(open: false → true)마다 위치를 중앙으로 리셋한다.

import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

const MOBILE_BREAKPOINT = 768;
const VIEWPORT_MARGIN = 32; // 화면 밖으로 나가지 않게 보장할 최소 여백(px)

function clampPosition(x: number, y: number, panel: HTMLElement): Position {
  const rect = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // rect는 현재 transform이 반영된 값이므로, transform이 없는 "원래" 좌표를 역산한다.
  const naturalLeft = rect.left - x;
  const naturalTop = rect.top - y;

  const minX = VIEWPORT_MARGIN - rect.width - naturalLeft;
  const maxX = vw - VIEWPORT_MARGIN - naturalLeft;
  const minY = VIEWPORT_MARGIN - rect.height - naturalTop;
  const maxY = vh - VIEWPORT_MARGIN - naturalTop;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

export function useDraggableModal(open: boolean) {
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 열릴 때마다 중앙으로 리셋(항상 "기본적으로 화면 중앙" 정책 보장)
  useEffect(() => {
    if (open) setPos({ x: 0, y: 0 });
  }, [open]);

  const onDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return; // 모바일은 드래그 비활성 — 중앙 정렬 우선
    if (e.button !== undefined && e.button !== 0) return; // 좌클릭만
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragOrigin.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
    setIsDragging(true);
  }, [isMobile, pos.x, pos.y]);

  const onDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragOrigin.current || isMobile) return;
    const dx = e.clientX - dragOrigin.current.startX;
    const dy = e.clientY - dragOrigin.current.startY;
    const rawX = dragOrigin.current.baseX + dx;
    const rawY = dragOrigin.current.baseY + dy;
    const panel = panelRef.current;
    setPos(panel ? clampPosition(rawX, rawY, panel) : { x: rawX, y: rawY });
  }, [isMobile]);

  const onDragPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragOrigin.current) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    }
    dragOrigin.current = null;
    setIsDragging(false);
  }, []);

  return {
    panelRef,
    isMobile,
    isDragging,
    // 모바일에서는 transform을 아예 적용하지 않아 중앙 정렬만 남긴다.
    style: isMobile || (pos.x === 0 && pos.y === 0)
      ? undefined
      : { transform: `translate(${pos.x}px, ${pos.y}px)` },
    dragHandleProps: isMobile
      ? {}
      : {
          onPointerDown: onDragPointerDown,
          onPointerMove: onDragPointerMove,
          onPointerUp: onDragPointerUp,
          onPointerCancel: onDragPointerUp,
        },
  };
}
