import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';

const CountryPicker = lazy(() =>
  import('./CountryPicker').then((module) => ({
    default: module.CountryPicker,
  })),
);

type LazyCountryPickerProps = ComponentProps<typeof CountryPicker>;

export function LazyCountryPicker(props: LazyCountryPickerProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <CountryPicker {...props} />
    </Suspense>
  );
}

export { CountryPickerTrigger } from './CountryPicker';
