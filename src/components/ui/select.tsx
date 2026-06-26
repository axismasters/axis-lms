// shadcn/ui 스타일 Select — 최소 구현. Radix 의존성 없이 네이티브 <select>를 기반으로
// 호출부(Select/SelectTrigger/SelectValue/SelectContent/SelectItem)와 동일한 외부 인터페이스만 재현한다.
//
// 옵션 추출 방식: 이전 구현은 SelectItem이 렌더될 때 registerOption()으로 옵션을 등록했는데,
// SelectTrigger가 SelectContent보다 먼저 렌더되는 JSX 순서상 그 시점엔 옵션이 비어 있었고
// (등록은 그 다음에야 일어남), 등록 자체도 useState가 아니라 일반 배열 push라 리렌더를 트리거하지
// 않아 <select>의 <option> 목록이 갱실히 비어 보일 수 있었다.
//
// 이번 구현은 Select가 렌더링되는 시점에 자신의 children을 직접 순회해 SelectContent > SelectItem
// 트리에서 옵션 목록을 "먼저" 추출한 뒤 Context로 내려준다. 따라서 SelectTrigger가 그려질 때는
// 이미 완성된 옵션 목록을 갖고 있으며, 별도의 등록 콜백이나 추가 상태 업데이트가 필요 없다.
import { createContext, useContext, useMemo, Children, isValidElement, ReactNode, ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
}

const SelectContext = createContext<SelectContextType | null>(null);

/** Select의 children(보통 SelectTrigger + SelectContent)에서 SelectContent > SelectItem들을 찾아 옵션 목록을 추출한다. */
function extractOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ children?: ReactNode; value?: string }>;
    if (el.type === SelectContent) {
      Children.forEach(el.props.children, (item) => {
        if (!isValidElement(item)) return;
        const itemEl = item as ReactElement<{ value: string; children?: ReactNode }>;
        if (itemEl.type === SelectItem && itemEl.props.value !== undefined) {
          options.push({ value: itemEl.props.value, label: itemEl.props.children });
        }
      });
    }
  });
  return options;
}

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) {
  // children(특히 SelectContent 안의 SelectItem 목록)이 바뀔 때만 다시 추출한다.
  const options = useMemo(() => extractOptions(children), [children]);
  return (
    <SelectContext.Provider value={{ value, onValueChange, options }}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  );
}

function useSelectCtx() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select 하위 컴포넌트는 <Select> 내부에서만 사용할 수 있습니다.');
  return ctx;
}

export function SelectTrigger({ className, children }: { className?: string; children?: ReactNode }) {
  const { value, onValueChange, options } = useSelectCtx();
  return (
    <select
      className={cn('rounded-md border border-slate-200 bg-white px-2 text-sm outline-none', className)}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {typeof o.label === 'string' ? o.label : o.value}
        </option>
      ))}
      {children /* SelectValue placeholder는 네이티브 select에서는 표시용 children으로 평가되지 않음 — 안전하게 무시 */}
    </select>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  // 네이티브 select 구조에서는 placeholder를 직접 렌더링하지 않는다(옵션 목록이 항상 보임).
  return null;
}

export function SelectContent({ className, children }: { className?: string; children: ReactNode }) {
  // Select가 렌더 전에 이미 extractOptions()로 옵션을 추출했으므로, 여기서는 아무것도 렌더링하지 않는다
  // (SelectTrigger의 네이티브 <select>가 <option> 목록을 그린다). className은 호출부 호환을 위해 타입만 받아준다.
  return null;
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  // extractOptions()가 Select 렌더링 시점에 이 엘리먼트의 props(value/children)를 직접 읽어 옵션을 만들므로,
  // SelectItem 자신은 실제로 렌더링되지 않는다(등록 콜백 불필요).
  return null;
}
