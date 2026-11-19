/** Tipos de resíduo aceitos pelos pontos de coleta. */
export type Categoria = 'Eletrônicos' | 'Óleo Usado' | 'Pilhas/Baterias' | 'Recicláveis Gerais' | 'Medicamentos';

export interface PontoColeta {
  id: string;
  nome: string;
  categoria: Categoria;
  endereco: string;
  bairro: string;
  horarioFuncionamento: string;
  latitude: number;
  longitude: number;
  imagemUri: string;
  telefoneContato: string;
  aceitaEntulho: boolean;
}

/** Ponto de coleta com a distância até o usuário já calculada (usado nas telas). */
export interface PontoColetaComDistancia extends PontoColeta {
  distanciaKm: number;
  /** distância formatada, ex.: "1.2 Km" */
  distancia: string;
}
