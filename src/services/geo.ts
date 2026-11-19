import { Coords } from '../types';

/** Distância em km entre dois pontos (fórmula de Haversine). */
export function distanciaKm(a: Coords, b: Coords) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const KM_POR_GRAU = 111.32;

/**
 * Leva um ponto que está perto de `origemAntiga` para a mesma posição relativa perto de `origemNova`
 * (mesma distância e direção). Usado para posicionar os ecopontos de exemplo ao redor do usuário.
 */
export function transladar(ponto: Coords, origemAntiga: Coords, origemNova: Coords): Coords {
  const norteKm = (ponto.latitude - origemAntiga.latitude) * KM_POR_GRAU;
  const lesteKm =
    (ponto.longitude - origemAntiga.longitude) * KM_POR_GRAU * Math.cos((origemAntiga.latitude * Math.PI) / 180);
  return {
    latitude: origemNova.latitude + norteKm / KM_POR_GRAU,
    longitude: origemNova.longitude + lesteKm / (KM_POR_GRAU * Math.cos((origemNova.latitude * Math.PI) / 180)),
  };
}

export const formatarKm = (km: number) => `${km.toFixed(1)} Km`;
