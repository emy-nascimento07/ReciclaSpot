import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Coords, PontoColeta, PontoColetaComDistancia, Regiao } from '../types';
import { mockPontos, regiaoPadrao } from '../services/mockPontos';
import { distanciaKm, formatarKm, transladar } from '../services/geo';

export type StatusLocalizacao = 'parado' | 'carregando' | 'ok' | 'negado' | 'erro';

type Ctx = {
  status: StatusLocalizacao;
  usuario: Coords | null;
  cidade: string | null;
  ecopontos: PontoColetaComDistancia[];
  regiao: Regiao;
  /** Pede permissão e busca a localização (chamado ao entrar no app). */
  iniciar: () => void;
};

const EcopontosContext = createContext<Ctx | null>(null);

/** Extrai rua/número e bairro da geocodificação reversa. */
function formatarEndereco(a: Location.LocationGeocodedAddress, numeroPadrao: string) {
  const rua = a.street ?? a.name;
  if (!rua) return null;
  return { endereco: `${rua}, ${a.streetNumber ?? numeroPadrao}`, bairro: a.district ?? a.subregion ?? a.city ?? null };
}

export function EcopontosProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusLocalizacao>('parado');
  const [usuario, setUsuario] = useState<Coords | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);
  const [pontos, setPontos] = useState<PontoColeta[]>(mockPontos);
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

      // ecopontos de exemplo reposicionados ao redor do usuário (mesma distância/direção do centro de SP)
      const perto = mockPontos.map((p) => ({ ...p, ...transladar(p, regiaoPadrao, eu) }));
      setPontos(perto);
      setStatus('ok');

      // nomes reais das ruas e da cidade (se falhar, mantém os endereços de exemplo)
      try {
        const [minha] = await Location.reverseGeocodeAsync(eu);
        if (minha) setCidade(minha.city ?? minha.subregion ?? null);
        const enderecos = await Promise.all(
          perto.map((p) =>
            Location.reverseGeocodeAsync(p)
              .then(([a]) => (a ? formatarEndereco(a, p.endereco.match(/\d+/)?.[0] ?? '100') : null))
              .catch(() => null),
          ),
        );
        setPontos(
          perto.map((p, i) => {
            const e = enderecos[i];
            return e ? { ...p, endereco: e.endereco, bairro: e.bairro ?? p.bairro } : p;
          }),
        );
      } catch {
        // geocodificação indisponível: segue com os endereços de exemplo
      }
    } catch {
      setStatus('erro');
    }
  }, []);

  const ecopontos = useMemo<PontoColetaComDistancia[]>(() => {
    const ref = usuario ?? regiaoPadrao;
    return pontos
      .map((p) => {
        const km = distanciaKm(ref, p);
        return { ...p, distanciaKm: km, distancia: formatarKm(km) };
      })
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [pontos, usuario]);

  const regiao = useMemo<Regiao>(
    () => (usuario ? { ...usuario, latitudeDelta: 0.12, longitudeDelta: 0.12 } : regiaoPadrao),
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
