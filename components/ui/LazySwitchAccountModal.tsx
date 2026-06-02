import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';

const SwitchAccountModal = lazy(() =>
  import('./SwitchAccountModal').then((module) => ({
    default: module.SwitchAccountModal,
  })),
);

type LazySwitchAccountModalProps = ComponentProps<typeof SwitchAccountModal>;

export function LazySwitchAccountModal(props: LazySwitchAccountModalProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SwitchAccountModal {...props} />
    </Suspense>
  );
}
