export function formatPhoneDisplay(countryCode: string, phone: string): string {
  const dial = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 5) {
    return `${dial} ${digits}`;
  }
  const first = digits.slice(0, 5);
  const rest = digits.slice(5);
  return `${dial} ${first} ${rest}`;
}

export function formatTimerValue(value: number): string {
  return value.toString().padStart(2, '0');
}
