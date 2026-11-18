import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Role } from '../theme';
import { Category } from '../data';
import { apagarFoto, carregar, guardarFoto, salvar } from '../storage';

export type Descarte = {
  id: string;
  fotoUri: string;
  categoria: Category;
  ecopontoId: string;
  ecopontoNome: string;
  /** data em formato ISO (texto), para poder salvar no celular */
  data: string;
};

type User = {
  nome: string;
  role: Role;
  descartes: number;
  historico: Descarte[];
};

type Ctx = {
  user: User;
  entrar: (role: Role, nome?: string) => void;
  registrarDescarte: (d: Omit<Descarte, 'id' | 'data'>) => Promise<void>;
  removerDescarte: (id: string) => void;
};

const inicial: User = { nome: 'Thiago Ramos', role: 'cidadao', descartes: 42, historico: [] };

const UserContext = createContext<Ctx | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(inicial);
  const pronto = useRef(false);

  // ao abrir o app: lê o que estava salvo
  useEffect(() => {
    carregar<User>().then((salvo) => {
      if (salvo) setUser({ ...inicial, ...salvo, historico: salvo.historico ?? [] });
      pronto.current = true;
    });
  }, []);

  // sempre que o usuário mudar: salva (só depois de ter lido, para não sobrescrever com o valor inicial)
  useEffect(() => {
    if (pronto.current) salvar(user);
  }, [user]);

  const entrar = (role: Role, nome?: string) =>
    setUser((u) => ({ ...u, role, nome: nome?.trim() ? nome.trim() : u.nome }));

  const registrarDescarte = async (d: Omit<Descarte, 'id' | 'data'>) => {
    const id = String(Date.now());
    const fotoUri = await guardarFoto(d.fotoUri, id);
    setUser((u) => ({
      ...u,
      descartes: u.descartes + 1,
      historico: [{ ...d, fotoUri, id, data: new Date().toISOString() }, ...u.historico],
    }));
  };

  const removerDescarte = (id: string) => {
    const alvo = user.historico.find((h) => h.id === id);
    if (!alvo) return;
    apagarFoto(alvo.fotoUri);
    setUser((u) => ({
      ...u,
      descartes: Math.max(0, u.descartes - 1),
      historico: u.historico.filter((h) => h.id !== id),
    }));
  };

  return (
    <UserContext.Provider value={{ user, entrar, registrarDescarte, removerDescarte }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser deve ser usado dentro de UserProvider');
  return ctx;
}
