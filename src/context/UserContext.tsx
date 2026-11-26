import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Descarte, Role, Usuario } from "../types";
import { apagarFoto, carregar, guardarFoto, salvar } from "../storage";
import {
  inserirDescarteDb,
  listarDescartesDb,
  removerDescarteDb,
} from "../services/database";

/** Estado salvo no celular: os dados cadastrais (Usuario) + o que o app precisa lembrar. */
type Perfil = Usuario & {
  role: Role;
  historico: Descarte[];
  favoritos: string[];
};

type EstadoContas = {
  roleAtivo: Role;
  perfis: Record<Role, Perfil>;
};

type Ctx = {
  user: Perfil;
  entrar: (role: Role, dados?: { nome?: string; email?: string }) => void;
  atualizarPerfil: (dados: {
    nome: string;
    email: string;
    role: Role;
  }) => void;
  atualizarFotoPerfil: (tempUri: string) => Promise<void>;
  registrarDescarte: (d: Omit<Descarte, "id" | "data">) => Promise<void>;
  removerDescarte: (id: string) => void;
  ehFavorito: (pontoId: string) => boolean;
  alternarFavorito: (pontoId: string) => void;
};

const perfisIniciais: Record<Role, Perfil> = {
  cidadao: {
    id: "u_cidadao",
    nome: "Thiago Ramos",
    email: "thiago.ramos@email.com",
    pontosReciclagem: 42,
    fotoPerfilUri: null,
    role: "cidadao",
    historico: [],
    favoritos: [],
  },
  voluntario: {
    id: "u_voluntario",
    nome: "Voluntário Eco",
    email: "voluntario@email.com",
    pontosReciclagem: 0,
    fotoPerfilUri: null,
    role: "voluntario",
    historico: [],
    favoritos: [],
  },
};

const estadoInicial: EstadoContas = {
  roleAtivo: "cidadao",
  perfis: perfisIniciais,
};

const UserContext = createContext<Ctx | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoContas>(estadoInicial);
  const pronto = useRef(false);

  const user = estado.perfis[estado.roleAtivo];

  // Carrega os perfis salvos ao abrir o app (e histórico do SQLite)
  useEffect(() => {
    Promise.all([
      carregar<Partial<EstadoContas> & Partial<Perfil>>(),
      listarDescartesDb("cidadao").catch(() => []),
      listarDescartesDb("voluntario").catch(() => []),
    ]).then(([salvo, descCidadao, descVoluntario]) => {
      if (salvo) {
        if (salvo.perfis) {
          setEstado({
            roleAtivo: salvo.roleAtivo ?? "cidadao",
            perfis: {
              cidadao: {
                ...perfisIniciais.cidadao,
                ...salvo.perfis.cidadao,
                role: "cidadao",
                historico: descCidadao.length
                  ? descCidadao
                  : salvo.perfis.cidadao?.historico ?? [],
              },
              voluntario: {
                ...perfisIniciais.voluntario,
                ...salvo.perfis.voluntario,
                role: "voluntario",
                historico: descVoluntario.length
                  ? descVoluntario
                  : salvo.perfis.voluntario?.historico ?? [],
              },
            },
          });
        } else {
          // Migra caso exista dado antigo no formato único
          const roleAntigo: Role = salvo.role ?? "cidadao";
          setEstado({
            roleAtivo: roleAntigo,
            perfis: {
              ...perfisIniciais,
              [roleAntigo]: {
                ...perfisIniciais[roleAntigo],
                ...salvo,
                role: roleAntigo,
              },
            },
          });
        }
      }
      pronto.current = true;
    });
  }, []);

  // Salva sempre que qualquer perfil mudar
  useEffect(() => {
    if (pronto.current) salvar(estado);
  }, [estado]);

  const entrar = (role: Role, dados?: { nome?: string; email?: string }) =>
    setEstado((prev) => {
      const atual = prev.perfis[role];
      return {
        roleAtivo: role,
        perfis: {
          ...prev.perfis,
          [role]: {
            ...atual,
            role,
            nome: dados?.nome?.trim() || atual.nome,
            email: dados?.email?.trim() || atual.email,
          },
        },
      };
    });

  const atualizarPerfil = (dados: {
    nome: string;
    email: string;
    role: Role;
  }) => {
    setEstado((prev) => {
      const alvo = prev.perfis[dados.role];
      return {
        roleAtivo: dados.role,
        perfis: {
          ...prev.perfis,
          [dados.role]: {
            ...alvo,
            nome: dados.nome,
            email: dados.email,
            role: dados.role,
          },
        },
      };
    });
  };

  const atualizarFotoPerfil = async (tempUri: string) => {
    const roleAtual = estado.roleAtivo;
    const fotoAnterior = estado.perfis[roleAtual].fotoPerfilUri;

    if (fotoAnterior) {
      apagarFoto(fotoAnterior);
    }

    const fotoUri = await guardarFoto(
      tempUri,
      `perfil_${roleAtual}_${Date.now()}`,
    );

    setEstado((prev) => ({
      ...prev,
      perfis: {
        ...prev.perfis,
        [roleAtual]: {
          ...prev.perfis[roleAtual],
          fotoPerfilUri: fotoUri,
        },
      },
    }));
  };

  const registrarDescarte = async (d: Omit<Descarte, "id" | "data">) => {
    const roleAtual = estado.roleAtivo;
    const id = String(Date.now());
    const fotoUri = await guardarFoto(d.fotoUri, id);
    const novoDescarte: Descarte = {
      ...d,
      fotoUri,
      id,
      data: new Date().toISOString(),
    };

    await inserirDescarteDb(novoDescarte, roleAtual).catch(() => {});

    setEstado((prev) => {
      const atual = prev.perfis[roleAtual];
      return {
        ...prev,
        perfis: {
          ...prev.perfis,
          [roleAtual]: {
            ...atual,
            pontosReciclagem: atual.pontosReciclagem + 1,
            historico: [novoDescarte, ...atual.historico],
          },
        },
      };
    });
  };

  const removerDescarte = (id: string) => {
    const roleAtual = estado.roleAtivo;
    const atual = estado.perfis[roleAtual];
    const alvo = atual.historico.find((h) => h.id === id);
    if (!alvo) return;

    apagarFoto(alvo.fotoUri);
    removerDescarteDb(id).catch(() => {});

    setEstado((prev) => {
      const perfilAtual = prev.perfis[roleAtual];
      return {
        ...prev,
        perfis: {
          ...prev.perfis,
          [roleAtual]: {
            ...perfilAtual,
            pontosReciclagem: Math.max(0, perfilAtual.pontosReciclagem - 1),
            historico: perfilAtual.historico.filter((h) => h.id !== id),
          },
        },
      };
    });
  };

  const ehFavorito = (pontoId: string) => user.favoritos.includes(pontoId);

  const alternarFavorito = (pontoId: string) => {
    const roleAtual = estado.roleAtivo;
    setEstado((prev) => {
      const atual = prev.perfis[roleAtual];
      return {
        ...prev,
        perfis: {
          ...prev.perfis,
          [roleAtual]: {
            ...atual,
            favoritos: atual.favoritos.includes(pontoId)
              ? atual.favoritos.filter((f) => f !== pontoId)
              : [...atual.favoritos, pontoId],
          },
        },
      };
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        entrar,
        atualizarPerfil,
        atualizarFotoPerfil,
        registrarDescarte,
        removerDescarte,
        ehFavorito,
        alternarFavorito,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser deve ser usado dentro de UserProvider");
  return ctx;
}