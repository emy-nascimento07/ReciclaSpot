import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Categoria, PontoColeta, Role } from '../types';

const BASE_URL = 'http://10.0.2.2:3000';

const CHAVE_TOKEN = '@reciclaspot:token';

const TIMEOUT_MS = 3_000;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(CHAVE_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new Error('Sem conexão com o servidor. Verifique sua internet.'));
    }
    return Promise.reject(error);
  },
);

export interface FiltroEcopontos {
  material?: Categoria;
  lat?: number;
  lng?: number;
  raioKm?: number;
}

export interface CadastroUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  role: Role;
}

export interface CadastroUsuarioResposta {
  id: string;
  nome: string;
  email: string;
  role: Role;
  pontosReciclagem: number;
  fotoPerfilUri: string | null;
  token: string;
}

export async function getEcopontos(filtros?: FiltroEcopontos): Promise<PontoColeta[]> {
  const params: Record<string, string | number> = {};
  if (filtros?.material) params.material = filtros.material;
  if (filtros?.lat !== undefined) params.lat = filtros.lat;
  if (filtros?.lng !== undefined) params.lng = filtros.lng;
  if (filtros?.raioKm !== undefined) params.raioKm = filtros.raioKm;

  const { data } = await api.get<PontoColeta[]>('/ecopontos', { params });
  return data;
}

export async function getEcoponto(id: string): Promise<PontoColeta> {
  const { data } = await api.get<PontoColeta>(`/ecopontos/${id}`);
  return data;
}

export async function cadastrarUsuario(
  payload: CadastroUsuarioPayload,
): Promise<CadastroUsuarioResposta> {
  const { data } = await api.post<CadastroUsuarioResposta>('/usuarios', payload);
  if (data.token) {
    await AsyncStorage.setItem(CHAVE_TOKEN, data.token);
  }
  return data;
}

export default api;
