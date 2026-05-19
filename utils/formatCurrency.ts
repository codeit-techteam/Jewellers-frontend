export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatInrMonthly(amount: number): string {
  return `${formatInr(amount)} /month`;
}
