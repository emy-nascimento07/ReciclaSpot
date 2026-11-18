import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  Coords,
  deslocar,
  distanciaKm,
  Ecoponto,
  EcopontoBase,
  ecopontosBase,
  formatarKm,
  regiaoPadrao,
} from '../data';

export type StatusLocalizacao = 'parado' | 'carregando' | 'ok' | 'negado' | 'erro';

type Ctx = {
  status: StatusLocalizacao;
  usuario: Coords | null;
  cidade: string | null;
  ecopontos: Ecoponto[];
  regiao: typeof regiaoPadrao;
  /** Pede permissão e busca a localização (chamado ao entrar no app). */
  iniciar: () => void;
};

const EcopontosContext = createContext<Ctx | null>(null);

/** Monta "Rua X, 123 - Bairro" a partir da geocodificação reversa. */
function formatarEndereco(a: Location.LocationGeocodedAddress, numeroPadrao: string) {
  const rua = a.street ?? a.name;
  if (!rua) return null;
  const bairro = a.district ?? a.subregion ?? a.city;
  return `${rua}, ${a.streetNumber ?? numeroPadrao}${bairro ? ` - ${bairro}` : ''}`;
}

export function EcopontosProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusLocalizacao>('parado');
  const [usuario, setUsuario] = useState<Coords | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);
  const [bases, setBases] = useState<EcopontoBase[]>(ecopontosBase);
  const iniciado = useRef(false);

  const iniciar = useCallback(async () => {
    if (iniciado.current) return;
    iniciado.current = true;
    setStatus('carregando');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('negado');
        return;
      }
      // posição rápida (última conhecida) e depois a atual, mais precisa
      const ultima = await Location.getLastKnownPositionAsync();
      const pos = ultima ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const eu = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUsuario(eu);

      // ecopontos posicionados ao redor do usuário
      const perto = ecopontosBase.map((b) => ({ ...b, ...deslocar(eu, b.norteKm, b.lesteKm) }));
      setBases(perto);
      setStatus('ok');

      // nomes reais das ruas e da cidade (se falhar, mantém os endereços de exemplo)
      try {
        const [minha] = await Location.reverseGeocodeAsync(eu);
        if (minha) setCidade(minha.city ?? minha.subregion ?? null);
        const enderecos = await Promise.all(
          perto.map((b) =>
            Location.reverseGeocodeAsync(b)
              .then(([a]) => (a ? formatarEndereco(a, b.endereco.match(/\d+/)?.[0] ?? '100') : null))
              .catch(() => null),
          ),
        );
        setBases(perto.map((b, i) => ({ ...b, endereco: enderecos[i] ?? b.endereco })));
      } catch {
        // geocodificação indisponível: segue com os endereços de exemplo
      }
    } catch {
      setStatus('erro');
    }
  }, []);

  const ecopontos = useMemo<Ecoponto[]>(() => {
    const ref = usuario ?? regiaoPadrao;
    return bases
      .map((b) => {
        const km = distanciaKm(ref, b);
        return { ...b, distanciaKm: km, distancia: formatarKm(km) };
      })
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [bases, usuario]);

  const regiao = useMemo(
    () => (usuario ? { ...usuario, latitudeDelta: 0.11, longitudeDelta: 0.11 } : regiaoPadrao),
    [usuario],
  );

  return (
    <EcopontosContext.Provider value={{ status, usuario, cidade, ecopontos, regiao, iniciar }}>
      {children}
    </EcopontosContext.Provider>
  );
}

export function useEcopontos() {
  const ctx = useContext(EcopontosContext);
  if (!ctx) throw new Error('useEcopontos deve ser usado dentro de EcopontosProvider');
  return ctx;
}
