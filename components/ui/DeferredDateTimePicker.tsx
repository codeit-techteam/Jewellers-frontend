import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { lazy, Suspense } from 'react';

const DateTimePicker = lazy(() => import('@react-native-community/datetimepicker'));

type DeferredDateTimePickerProps = {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
};

export function DeferredDateTimePicker({
  value,
  mode = 'date',
  display = 'default',
  onChange,
}: DeferredDateTimePickerProps) {
  return (
    <Suspense fallback={null}>
      <DateTimePicker value={value} mode={mode} display={display} onChange={onChange} />
    </Suspense>
  );
}
