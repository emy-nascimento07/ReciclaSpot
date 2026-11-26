import { useMemo, useState } from 'react';
import { useEcopontos } from '../context/EcopontosContext';
import { Categoria, PontoColetaComDistancia } from '../types';

export interface UsePontosFiltradosReturn {
  lista: PontoColetaComDistancia[];
  busca: string;
  setBusca: (v: string) => void;
  filtros: Categoria[];
  toggleFiltro: (c: Categoria) => void;
}

export function usePontosFiltrados(): UsePontosFiltradosReturn {
  const { ecopontos } = useEcopontos();
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Categoria[]>([]);

  const toggleFiltro = (c: Categoria) =>
    setFiltros((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return ecopontos.filter(
      (e) =>
        (!q ||
          e.nome.toLowerCase().includes(q) ||
          e.endereco.toLowerCase().includes(q) ||
          e.bairro.toLowerCase().includes(q)) &&
        (filtros.length === 0 || filtros.includes(e.categoria)),
    );
  }, [busca, filtros, ecopontos]);

  return { lista, busca, setBusca, filtros, toggleFiltro };
}
