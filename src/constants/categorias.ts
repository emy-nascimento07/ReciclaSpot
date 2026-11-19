import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Categoria } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

/** Ordem de exibição e ícone de cada categoria. O Record garante que nenhuma fica de fora. */
const icones: Record<Categoria, Icone> = {
  Eletrônicos: 'monitor',
  'Óleo Usado': 'oil',
  'Pilhas/Baterias': 'battery-charging-outline',
  'Recicláveis Gerais': 'recycle',
  Medicamentos: 'pill',
};

export const categorias = (Object.keys(icones) as Categoria[]).map((nome) => ({ nome, icone: icones[nome] }));
