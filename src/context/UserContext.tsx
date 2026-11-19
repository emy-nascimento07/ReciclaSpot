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

/** Estado salvo no celular: os dados cadastrais (Usuario) + o que o app precisa lembrar. */
type Perfil = Usuario & {
  role: Role;
  historico: Descarte[];
  /** ids dos pontos de coleta salvos na aba Favoritos */
  favoritos: string[];
};

type Ctx = {
  user: Perfil;
  entrar: (role: Role, dados?: { nome?: string; email?: string }) => void;
  atualizarFotoPerfil: (tempUri: string) => Promise<void>;
  registrarDescarte: (d: Omit<Descarte, "id" | "data">) => Promise<void>;
  removerDescarte: (id: string) => void;
  ehFavorito: (pontoId: string) => boolean;
  alternarFavorito: (pontoId: string) => void;
};

const inicial: Perfil = {
  id: "u1",
  nome: "Thiago Ramos",
  email: "thiago.ramos@email.com",
  pontosReciclagem: 42,
  fotoPerfilUri: null,
  role: "cidadao",
  historico: [],
  favoritos: [],
};

const UserContext = createContext<Ctx | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Perfil>(inicial);
  const pronto = useRef(false);

  // ao abrir o app: lê o que estava salvo
  // Substitua o primeiro useEffect do UserContext.tsx por este:
  useEffect(() => {
    Promise.all([
      carregar<Partial<Perfil>>(),
      carregar<string[]>("@reciclaspot:favoritos"),
    ]).then(([salvo, favsSalvos]) => {
      if (salvo || favsSalvos) {
        setUser({
          ...inicial,
          ...salvo,
          favoritos: favsSalvos ?? salvo?.favoritos ?? [],
        });
      }
      pronto.current = true;
    });
  }, []);

  // sempre que o usuário mudar: salva (só depois de ter lido, para não sobrescrever com o valor inicial)
  useEffect(() => {
    if (pronto.current) salvar(user);
  }, [user]);

  const entrar = (role: Role, dados?: { nome?: string; email?: string }) =>
    setUser((u) => ({
      ...u,
      role,
      nome: dados?.nome?.trim() || u.nome,
      email: dados?.email?.trim() || u.email,
    }));

  const atualizarFotoPerfil = async (tempUri: string) => {
    // Apaga a foto anterior do armazenamento permanente, se existir
    if (user.fotoPerfilUri) {
      apagarFoto(user.fotoPerfilUri);
    }
    // Copia a nova foto do cache temporário da câmera para o diretório permanente do app
    const fotoUri = await guardarFoto(tempUri, `perfil_${Date.now()}`);
    setUser((u) => ({ ...u, fotoPerfilUri: fotoUri }));
  };

  const registrarDescarte = async (d: Omit<Descarte, "id" | "data">) => {
    const id = String(Date.now());
    const fotoUri = await guardarFoto(d.fotoUri, id);
    setUser((u) => ({
      ...u,
      pontosReciclagem: u.pontosReciclagem + 1,
      historico: [
        { ...d, fotoUri, id, data: new Date().toISOString() },
        ...u.historico,
      ],
    }));
  };

  const removerDescarte = (id: string) => {
    const alvo = user.historico.find((h) => h.id === id);
    if (!alvo) return;
    apagarFoto(alvo.fotoUri);
    setUser((u) => ({
      ...u,
      pontosReciclagem: Math.max(0, u.pontosReciclagem - 1),
      historico: u.historico.filter((h) => h.id !== id),
    }));
  };

  const ehFavorito = (pontoId: string) => user.favoritos.includes(pontoId);

  const alternarFavorito = (pontoId: string) =>
    setUser((u) => ({
      ...u,
      favoritos: u.favoritos.includes(pontoId)
        ? u.favoritos.filter((f) => f !== pontoId)
        : [...u.favoritos, pontoId],
    }));

  return (
    <UserContext.Provider
      value={{
        user,
        entrar,
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
