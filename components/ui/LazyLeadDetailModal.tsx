import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';

const LeadDetailModal = lazy(() =>
  import('./LeadDetailModal').then((module) => ({
    default: module.LeadDetailModal,
  })),
);

type LazyLeadDetailModalProps = ComponentProps<typeof LeadDetailModal>;

export function LazyLeadDetailModal(props: LazyLeadDetailModalProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LeadDetailModal {...props} />
    </Suspense>
  );
}
