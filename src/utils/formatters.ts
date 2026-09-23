export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
