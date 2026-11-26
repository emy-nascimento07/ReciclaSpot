import { useEcopontos } from '../context/EcopontosContext';

export interface UseLocationReturn {
  status: ReturnType<typeof useEcopontos>['status'];
  usuario: ReturnType<typeof useEcopontos>['usuario'];
  cidade: ReturnType<typeof useEcopontos>['cidade'];
  regiao: ReturnType<typeof useEcopontos>['regiao'];
  iniciar: ReturnType<typeof useEcopontos>['iniciar'];
}

export function useLocation(): UseLocationReturn {
  const { status, usuario, cidade, regiao, iniciar } = useEcopontos();
  return { status, usuario, cidade, regiao, iniciar };
}
