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
import {
  Categoria,
  Coords,
  PontoColeta,
  PontoColetaComDistancia,
  Regiao,
} from "../types";
import { mockPontos, regiaoPadrao } from "../services/mockPontos";
import { getEcopontos } from "../services/api";
import {
  inserirEcopontoDb,
  listarEcopontosDb,
  salvarEcopontosDb,
} from "../services/database";
import { distanciaKm, formatarKm, transladar } from "../services/geo";
import { carregar, CHAVE_ECOPONTOS, guardarFoto, salvar } from "../storage";

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

export type NovoPontoInput = {
  nome: string;
  categoria: Categoria;
  endereco: string;
  bairro: string;
  horarioFuncionamento: string;
  latitude: number;
  longitude: number;
  imagemUri?: string | null;
  telefoneContato: string;
  aceitaEntulho: boolean;
};

type Ctx = {
  status: StatusLocalizacao;
  usuario: Coords | null;
  cidade: string | null;
  ecopontos: PontoColetaComDistancia[];
  regiao: Regiao;
  iniciar: () => void;
  recarregar: () => Promise<void>;
  adicionarPonto: (dados: NovoPontoInput) => Promise<PontoColeta>;
};

const CHAVE_PONTOS_CRIADOS = "@reciclaspot:pontos_criados";

const EcopontosContext = createContext<Ctx | null>(null);

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

// Verifica se o aparelho realmente tem acesso à internet
async function verificarConexaoReal(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch("https://google.com", {
      method: "HEAD",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function EcopontosProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusLocalizacao>("parado");
  const [usuario, setUsuario] = useState<Coords | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);
  const [pontos, setPontos] = useState<PontoColeta[]>(mockPontos);
  const [pontosCriados, setPontosCriados] = useState<PontoColeta[]>([]);
  const iniciado = useRef(false);

  useEffect(() => {
    Promise.all([
      carregar<CacheEcopontos>(CHAVE_ECOPONTOS),
      listarEcopontosDb(false).catch(() => []),
      listarEcopontosDb(true).catch(() => []),
    ]).then(([cache, pontosDb, criadosDb]) => {
      if (pontosDb.length) {
        setPontos(pontosDb);
      } else if (cache?.pontos?.length) {
        setPontos(cache.pontos);
      }
      if (cache?.usuario) setUsuario(cache.usuario);
      if (cache?.cidade) setCidade(cache.cidade);
      if (criadosDb.length) setPontosCriados(criadosDb);
    });
  }, []);

  const iniciar = useCallback(async () => {
    if (iniciado.current) return;
    iniciado.current = true;
    setStatus("carregando");

    const aplicarPosicao = async (eu: Coords) => {
      setUsuario(eu);

      let pontosBase: PontoColeta[];
      try {
        pontosBase = await getEcopontos({
          lat: eu.latitude,
          lng: eu.longitude,
        });
      } catch {
        pontosBase = mockPontos.map((p) => ({
          ...p,
          ...transladar(p, regiaoPadrao, eu),
        }));
      }

      setPontos(pontosBase);
      setStatus("ok");

      let cidadeAtual: string | null = null;
      let pontosFinais: PontoColeta[] = pontosBase;

      try {
        const [minha] = await Location.reverseGeocodeAsync(eu);
        if (minha) {
          cidadeAtual = minha.city ?? minha.subregion ?? null;
          setCidade(cidadeAtual);
        }
        const enderecos = await Promise.all(
          pontosBase.map((p) =>
            Location.reverseGeocodeAsync(p)
              .then(([a]) =>
                a
                  ? formatarEndereco(a, p.endereco.match(/\d+/)?.[0] ?? "100")
                  : null,
              )
              .catch(() => null),
          ),
        );
        pontosFinais = pontosBase.map((p, i) => {
          const e = enderecos[i];
          return e
            ? { ...p, endereco: e.endereco, bairro: e.bairro ?? p.bairro }
            : p;
        });
        setPontos(pontosFinais);
      } catch {}

      await Promise.all([
        salvar(
          { pontos: pontosFinais, usuario: eu, cidade: cidadeAtual },
          CHAVE_ECOPONTOS,
        ),
        salvarEcopontosDb(pontosFinais).catch(() => {}),
      ]);
    };

    try {
      const { status: perm } =
        await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("negado");
        return;
      }

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

      const posAtual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coordsAtuais = {
        latitude: posAtual.coords.latitude,
        longitude: posAtual.coords.longitude,
      };

      if (!coordsUltima || distanciaKm(coordsUltima, coordsAtuais) > 0.05) {
        await aplicarPosicao(coordsAtuais);
      }
    } catch {
      setStatus((atual) => (atual === "ok" ? "ok" : "erro"));
    }
  }, []);

  const recarregar = useCallback(async () => {
    const ref = usuario ?? regiaoPadrao;

    // 1. Checa se o celular está realmente sem internet
    const temInternet = await verificarConexaoReal();
    if (!temInternet) {
      throw new Error("Sem conexão com a internet");
    }

    // 2. Tem internet: tenta buscar da API; se o servidor local estiver desligado, atualiza com os pontos locais
    try {
      const pontosBase = await getEcopontos({
        lat: ref.latitude,
        lng: ref.longitude,
      });
      setPontos(pontosBase);
      await Promise.all([
        salvar({ pontos: pontosBase, usuario, cidade }, CHAVE_ECOPONTOS),
        salvarEcopontosDb(pontosBase).catch(() => {}),
      ]);
    } catch {
      const pontosFallback = mockPontos.map((p) => ({
        ...p,
        ...transladar(p, regiaoPadrao, ref),
      }));
      setPontos(pontosFallback);
    }
  }, [usuario, cidade]);

  const adicionarPonto = async (
    dados: NovoPontoInput,
  ): Promise<PontoColeta> => {
    const id = `custom_${Date.now()}`;
    let imagemFinal = mockPontos[0]?.imagemUri ?? "";
    if (dados.imagemUri) {
      imagemFinal = await guardarFoto(dados.imagemUri, id);
    }

    const novoPonto: PontoColeta = {
      id,
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      endereco: dados.endereco.trim(),
      bairro: dados.bairro.trim(),
      horarioFuncionamento:
        dados.horarioFuncionamento.trim() || "Seg a Sex, 08h às 17h",
      latitude: dados.latitude,
      longitude: dados.longitude,
      imagemUri: imagemFinal,
      telefoneContato: dados.telefoneContato.trim() || "Não informado",
      aceitaEntulho: dados.aceitaEntulho,
    };

    await inserirEcopontoDb(novoPonto, true).catch(() => {});

    setPontosCriados((prev) => {
      const atualizados = [novoPonto, ...prev];
      salvar(atualizados, CHAVE_PONTOS_CRIADOS);
      return atualizados;
    });

    return novoPonto;
  };

  const ecopontos = useMemo<PontoColetaComDistancia[]>(() => {
    const ref = usuario ?? regiaoPadrao;
    const todos = [...pontosCriados, ...pontos];

    return todos
      .map((p) => {
        const km = distanciaKm(ref, p);
        return { ...p, distanciaKm: km, distancia: formatarKm(km) };
      })
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [pontos, pontosCriados, usuario]);

  const regiao = useMemo<Regiao>(
    () =>
      usuario
        ? { ...usuario, latitudeDelta: 0.12, longitudeDelta: 0.12 }
        : regiaoPadrao,
    [usuario],
  );

  return (
    <EcopontosContext.Provider
      value={{
        status,
        usuario,
        cidade,
        ecopontos,
        regiao,
        iniciar,
        recarregar,
        adicionarPonto,
      }}
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
