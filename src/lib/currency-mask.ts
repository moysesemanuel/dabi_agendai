export function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function applyCurrencyMask(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "");
  const cents = digits ? Number(digits) : 0;
  return formatCentsToBRL(cents);
}
