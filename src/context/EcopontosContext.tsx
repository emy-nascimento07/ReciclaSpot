import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Location from "expo-location";
import { Coords, PontoColeta, PontoColetaComDistancia, Regiao } from "../types";
import { mockPontos, regiaoPadrao } from "../services/mockPontos";
import { distanciaKm, formatarKm, transladar } from "../services/geo";
import { carregar, CHAVE_ECOPONTOS, salvar } from "../storage";

export type StatusLocalizacao =
  | "parado"
  | "carregando"
  | "ok"
  | "negado"
  | "erro";

type CacheEcopontos = {
  pontos: PontoColeta[];
  usuario: Coords | null;
  cidade: string | null;
};

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
function formatarEndereco(
  a: Location.LocationGeocodedAddress,
  numeroPadrao: string,
) {
  const rua = a.street ?? a.name;
  if (!rua) return null;
  return {
    endereco: `${rua}, ${a.streetNumber ?? numeroPadrao}`,
    bairro: a.district ?? a.subregion ?? a.city ?? null,
  };
}

export function EcopontosProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusLocalizacao>("parado");
  const [usuario, setUsuario] = useState<Coords | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);
  const [pontos, setPontos] = useState<PontoColeta[]>(mockPontos);
  const iniciado = useRef(false);

  // Carrega o cache offline assim que o aplicativo abre (garante funcionamento em Modo Avião)
  useEffect(() => {
    carregar<CacheEcopontos>(CHAVE_ECOPONTOS).then((cache) => {
      if (!cache) return;
      if (cache.pontos?.length) setPontos(cache.pontos);
      if (cache.usuario) setUsuario(cache.usuario);
      if (cache.cidade) setCidade(cache.cidade);
    });
  }, []);

  const iniciar = useCallback(async () => {
    if (iniciado.current) return;
    iniciado.current = true;
    setStatus("carregando");

    // Função auxiliar para atualizar mapa, ecopontos, nomes das ruas e salvar no cache offline
    const aplicarPosicao = async (eu: Coords) => {
      setUsuario(eu);

      // ecopontos de exemplo reposicionados ao redor do usuário
      const perto = mockPontos.map((p) => ({
        ...p,
        ...transladar(p, regiaoPadrao, eu),
      }));
      setPontos(perto);
      setStatus("ok");

      let cidadeAtual: string | null = null;
      let pontosFinais: PontoColeta[] = perto;

      // nomes reais das ruas e da cidade (se falhar por estar sem internet, mantém os endereços anteriores)
      try {
        const [minha] = await Location.reverseGeocodeAsync(eu);
        if (minha) {
          cidadeAtual = minha.city ?? minha.subregion ?? null;
          setCidade(cidadeAtual);
        }
        const enderecos = await Promise.all(
          perto.map((p) =>
            Location.reverseGeocodeAsync(p)
              .then(([a]) =>
                a
                  ? formatarEndereco(a, p.endereco.match(/\d+/)?.[0] ?? "100")
                  : null,
              )
              .catch(() => null),
          ),
        );
        pontosFinais = perto.map((p, i) => {
          const e = enderecos[i];
          return e
            ? { ...p, endereco: e.endereco, bairro: e.bairro ?? p.bairro }
            : p;
        });
        setPontos(pontosFinais);
      } catch {
        // geocodificação indisponível (ex: Modo Avião)
      }

      // Persiste os dados atualizados localmente para futuras aberturas offline
      await salvar(
        { pontos: pontosFinais, usuario: eu, cidade: cidadeAtual },
        CHAVE_ECOPONTOS,
      );
    };

    try {
      const { status: perm } =
        await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("negado");
        return;
      }

      // 1ª etapa: se houver posição em cache, exibe imediatamente sem fazer o usuário esperar
      const ultima = await Location.getLastKnownPositionAsync();
      const coordsUltima = ultima
        ? {
            latitude: ultima.coords.latitude,
            longitude: ultima.coords.longitude,
          }
        : null;

      if (coordsUltima) {
        await aplicarPosicao(coordsUltima);
      }

      // 2ª etapa: captura sempre as coordenadas exatas atuais
      const posAtual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coordsAtuais = {
        latitude: posAtual.coords.latitude,
        longitude: posAtual.coords.longitude,
      };

      // Atualiza novamente apenas se não havia cache ou se o usuário se moveu mais de 50 metros
      if (!coordsUltima || distanciaKm(coordsUltima, coordsAtuais) > 0.05) {
        await aplicarPosicao(coordsAtuais);
      }
    } catch {
      // Só marca como erro se nem o cache chegou a funcionar
      setStatus((atual) => (atual === "ok" ? "ok" : "erro"));
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
    () =>
      usuario
        ? { ...usuario, latitudeDelta: 0.12, longitudeDelta: 0.12 }
        : regiaoPadrao,
    [usuario],
  );

  return (
    <EcopontosContext.Provider
      value={{ status, usuario, cidade, ecopontos, regiao, iniciar }}
    >
      {children}
    </EcopontosContext.Provider>
  );
}

export function useEcopontos() {
  const ctx = useContext(EcopontosContext);
  if (!ctx)
    throw new Error("useEcopontos deve ser usado dentro de EcopontosProvider");
  return ctx;
}
