export function onlyDigits(value) {
  return (value || "").replace(/\D/g, "");
}

export function formatCpfInput(value) {
  const digits = onlyDigits(value).slice(0, 11);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);
  if (digits.length <= 3) return part1;
  if (digits.length <= 6) return `${part1}.${part2}`;
  if (digits.length <= 9) return `${part1}.${part2}.${part3}`;
  return `${part1}.${part2}.${part3}-${part4}`;
}

export function formatPhoneInput(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  const ddd = digits.slice(0, 2);
  const isMobile = digits.length > 10;
  const first = digits.slice(2, isMobile ? 7 : 6);
  const second = digits.slice(isMobile ? 7 : 6, isMobile ? 11 : 10);
  if (digits.length <= 2) return `(${ddd}`;
  if (digits.length <= 6) return `(${ddd}) ${first}`;
  if (digits.length <= 10) return `(${ddd}) ${first}-${second}`;
  return `(${ddd}) ${first}-${second}`;
}
