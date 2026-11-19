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

export function EcopontosProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusLocalizacao>("parado");
  const [usuario, setUsuario] = useState<Coords | null>(null);
  const [cidade, setCidade] = useState<string | null>(null);
  const [pontos, setPontos] = useState<PontoColeta[]>(mockPontos);
  const [pontosCriados, setPontosCriados] = useState<PontoColeta[]>([]);
  const iniciado = useRef(false);

  // Carrega cache offline e pontos criados por voluntários
  useEffect(() => {
    Promise.all([
      carregar<CacheEcopontos>(CHAVE_ECOPONTOS),
      carregar<PontoColeta[]>(CHAVE_PONTOS_CRIADOS),
    ]).then(([cache, criados]) => {
      if (cache) {
        if (cache.pontos?.length) setPontos(cache.pontos);
        if (cache.usuario) setUsuario(cache.usuario);
        if (cache.cidade) setCidade(cache.cidade);
      }
      if (criados?.length) {
        setPontosCriados(criados);
      }
    });
  }, []);

  const iniciar = useCallback(async () => {
    if (iniciado.current) return;
    iniciado.current = true;
    setStatus("carregando");

    const aplicarPosicao = async (eu: Coords) => {
      setUsuario(eu);

      const perto = mockPontos.map((p) => ({
        ...p,
        ...transladar(p, regiaoPadrao, eu),
      }));
      setPontos(perto);
      setStatus("ok");

      let cidadeAtual: string | null = null;
      let pontosFinais: PontoColeta[] = perto;

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
        // geocodificação indisponível
      }

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

  const adicionarPonto = async (dados: NovoPontoInput): Promise<PontoColeta> => {
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