import { LoadingScreen } from '@components/ui/LoadingScreen';
import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';

const InventoryProductForm = lazy(() =>
  import('./InventoryProductForm').then((module) => ({
    default: module.InventoryProductForm,
  })),
);

export type { InventoryFormSubmitMode } from './InventoryProductForm';

type LazyInventoryProductFormProps = ComponentProps<typeof InventoryProductForm>;

export function LazyInventoryProductForm(props: LazyInventoryProductFormProps) {
  return (
    <Suspense fallback={<LoadingScreen message="Loading form…" />}>
      <InventoryProductForm {...props} />
    </Suspense>
  );
}
