import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';

const ExitOnboardingModal = lazy(() =>
  import('./ExitOnboardingModal').then((module) => ({
    default: module.ExitOnboardingModal,
  })),
);

type LazyExitOnboardingModalProps = ComponentProps<typeof ExitOnboardingModal>;

export function LazyExitOnboardingModal(props: LazyExitOnboardingModalProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ExitOnboardingModal {...props} />
    </Suspense>
  );
}
