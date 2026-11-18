export type Category = 'eletronicos' | 'vidro' | 'pilhas';

export const categories: { id: Category; label: string; icon: 'monitor' | 'bottle-wine-outline' | 'battery-charging-outline' }[] = [
  { id: 'eletronicos', label: 'Eletrônicos', icon: 'monitor' },
  { id: 'vidro', label: 'Vidro', icon: 'bottle-wine-outline' },
  { id: 'pilhas', label: 'Pilhas', icon: 'battery-charging-outline' },
];

export type Ecoponto = {
  id: string;
  nome: string;
  nomeCompleto: string;
  /** distância formatada, ex.: "1.2 Km" */
  distancia: string;
  distanciaKm: number;
  horarios: string;
  endereco: string;
  aceita: Category[];
  latitude: number;
  longitude: number;
};

/**
 * Modelo dos ecopontos. Quando o app tem a localização do usuário, cada ponto é
 * posicionado a `norteKm` / `lesteKm` de distância dele (assim sempre ficam por perto).
 * Sem localização, usa as coordenadas fixas de exemplo (`latitude` / `longitude`).
 */
export type EcopontoBase = Omit<Ecoponto, 'distancia' | 'distanciaKm'> & { norteKm: number; lesteKm: number };

export const ecopontosBase: EcopontoBase[] = [
  {
    id: '1',
    nome: 'Ecoponto Central',
    nomeCompleto: 'Ecoponto Central Inteligente',
    horarios: 'Seg-Sex: 8h - 18h, Sáb: 8h - 14h',
    endereco: 'Av. Brasil, 1230 - Centro',
    aceita: ['eletronicos', 'vidro', 'pilhas'],
    norteKm: 0.8,
    lesteKm: 0.9,
    latitude: -23.5489,
    longitude: -46.6388,
  },
  {
    id: '2',
    nome: 'Ecoponto Sul',
    nomeCompleto: 'Ecoponto Sul',
    horarios: 'Seg-Sex: 8h - 17h',
    endereco: 'Rua das Flores, 450 - Zona Sul',
    aceita: ['vidro', 'pilhas'],
    norteKm: -3.0,
    lesteKm: -0.6,
    latitude: -23.5768,
    longitude: -46.6412,
  },
  {
    id: '3',
    nome: 'Ecoponto Norte',
    nomeCompleto: 'Ecoponto Norte',
    horarios: 'Seg-Sáb: 7h - 19h',
    endereco: 'Av. das Nações, 88 - Zona Norte',
    aceita: ['eletronicos', 'pilhas'],
    norteKm: 4.6,
    lesteKm: 1.3,
    latitude: -23.5122,
    longitude: -46.6255,
  },
  {
    id: '4',
    nome: 'Ecoponto Leste',
    nomeCompleto: 'Ecoponto Leste Comunitário',
    horarios: 'Ter-Sáb: 9h - 17h',
    endereco: 'Rua da Paz, 72 - Zona Leste',
    aceita: ['eletronicos', 'vidro'],
    norteKm: -0.7,
    lesteKm: 2.2,
    latitude: -23.5528,
    longitude: -46.6125,
  },
];

/** Região usada enquanto a localização não chega (ou se for negada). */
export const regiaoPadrao = {
  latitude: -23.546,
  longitude: -46.634,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

export type Coords = { latitude: number; longitude: number };

/** Distância em km entre dois pontos (fórmula de Haversine). */
export function distanciaKm(a: Coords, b: Coords) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Desloca um ponto `norteKm` para o norte e `lesteKm` para o leste. */
export function deslocar(origem: Coords, norteKm: number, lesteKm: number): Coords {
  const latitude = origem.latitude + norteKm / 111.32;
  const longitude = origem.longitude + lesteKm / (111.32 * Math.cos((origem.latitude * Math.PI) / 180));
  return { latitude, longitude };
}

export const formatarKm = (km: number) => `${km.toFixed(1)} Km`;
