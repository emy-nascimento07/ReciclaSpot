/// <reference types="jest" />
import { camposPreenchidos, emailValido } from '../utils/validators';

describe('validators - validação de formulários', () => {
  it('valida e-mails corretos e rejeita inválidos', () => {
    expect(emailValido('maria@email.com')).toBe(true);
    expect(emailValido('voluntario@reciclaspot.org.br')).toBe(true);

    expect(emailValido('')).toBe(false);
    expect(emailValido('mariaemail.com')).toBe(false);
    expect(emailValido('maria@email')).toBe(false);
    expect(emailValido('@email.com')).toBe(false);
    expect(emailValido('maria@')).toBe(false);
    expect(emailValido('maria @email.com')).toBe(false);
  });

  it('verifica se todos os campos obrigatórios foram preenchidos', () => {
    expect(camposPreenchidos('Maria', 'maria@email.com', '123456')).toBe(true);
    expect(camposPreenchidos('Maria', '   ', '123456')).toBe(false);
    expect(camposPreenchidos('', 'maria@email.com')).toBe(false);
  });
});
