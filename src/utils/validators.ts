const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValido(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function camposPreenchidos(...campos: string[]): boolean {
  return campos.every((c) => c.trim().length > 0);
}
