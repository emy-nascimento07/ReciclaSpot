/// <reference types="jest" />
import { formatarData, formatarKm, pluralizar } from '../utils/formatters';

describe('formatters - funções de formatação', () => {
  it('formata data ISO no padrão DD/MM às HH:MM', () => {
    const dataLocal = new Date(2026, 10, 5, 9, 7); // 05/11 às 09:07
    expect(formatarData(dataLocal.toISOString())).toBe('05/11 às 09:07');
  });

  it('formata quilometragem corretamente', () => {
    expect(formatarKm(3.5)).toBe('3.5 Km');
    expect(formatarKm(0.84)).toBe('0.8 Km');
  });

  it('pluraliza corretamente no singular e plural', () => {
    expect(pluralizar(0, 'local salvo', 'locais salvos')).toBe('0 locais salvos');
    expect(pluralizar(1, 'local salvo', 'locais salvos')).toBe('1 local salvo');
    expect(pluralizar(4, 'local salvo', 'locais salvos')).toBe('4 locais salvos');
  });
});
