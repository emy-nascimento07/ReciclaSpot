import { Categoria } from './PontoColeta';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  pontosReciclagem: number;
  /** null = usa o avatar padrão do app */
  fotoPerfilUri: string | null;
}

export type Role = 'cidadao' | 'voluntario';

export interface Descarte {
  id: string;
  fotoUri: string;
  categoria: Categoria;
  pontoId: string;
  pontoNome: string;
  /** data em formato ISO (texto), para poder salvar no celular */
  data: string;
}
