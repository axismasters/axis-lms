// shadcn/ui 관례: sonner 패키지의 Toaster를 그대로 재노출하는 wrapper.
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster {...props} />;
}
