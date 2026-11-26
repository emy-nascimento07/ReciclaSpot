import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { useEcopontos } from '../context/EcopontosContext';
import { PontoColetaComDistancia } from '../types';

export interface UseFavoritosReturn {
  favoritos: PontoColetaComDistancia[];
  ehFavorito: (pontoId: string) => boolean;
  alternarFavorito: (pontoId: string) => void;
}

export function useFavoritos(): UseFavoritosReturn {
  const { user, ehFavorito, alternarFavorito } = useUser();
  const { ecopontos } = useEcopontos();

  const favoritos = useMemo(
    () => ecopontos.filter((e) => user.favoritos.includes(e.id)),
    [ecopontos, user.favoritos],
  );

  return { favoritos, ehFavorito, alternarFavorito };
}
