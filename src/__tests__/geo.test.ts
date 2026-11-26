/// <reference types="jest" />
import { distanciaKm, formatarKm, transladar } from '../services/geo';

describe('geo - funções geográficas', () => {
  it('calcula distância zero entre coordenadas iguais', () => {
    const ponto = { latitude: -23.546, longitude: -46.634 };
    expect(distanciaKm(ponto, ponto)).toBe(0);
  });

  it('calcula distância aproximada entre dois pontos em São Paulo', () => {
    const centro = { latitude: -23.5431, longitude: -46.6372 };
    const vilaMariana = { latitude: -23.5885, longitude: -46.637 };
    const km = distanciaKm(centro, vilaMariana);

    expect(km).toBeGreaterThan(4.5);
    expect(km).toBeLessThan(5.5);
  });

  it('translada um ponto mantendo a distância relativa para uma nova origem', () => {
    const origemAntiga = { latitude: -23.546, longitude: -46.634 };
    const ponto = { latitude: -23.556, longitude: -46.644 };
    const origemNova = { latitude: -22.9068, longitude: -43.1729 };

    const transladado = transladar(ponto, origemAntiga, origemNova);
    const distOriginal = distanciaKm(origemAntiga, ponto);
    const distNova = distanciaKm(origemNova, transladado);

    expect(Math.abs(distOriginal - distNova)).toBeLessThan(0.05);
  });

  it('formata a distância em quilômetros com uma casa decimal', () => {
    expect(formatarKm(0)).toBe('0.0 Km');
    expect(formatarKm(1.25)).toBe('1.3 Km');
    expect(formatarKm(12.34)).toBe('12.3 Km');
  });
});
