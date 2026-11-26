import * as SQLite from 'expo-sqlite';
import { Categoria, Descarte, PontoColeta, Role } from '../types';

const DB_NAME = 'reciclaspot.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export interface UsuarioDb {
  id: string;
  nome: string;
  email: string;
  role: Role;
  criadoEm: string;
}

interface EcopontoRow {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  bairro: string;
  horarioFuncionamento: string;
  latitude: number;
  longitude: number;
  imagemUri: string;
  telefoneContato: string;
  aceitaEntulho: number;
}

function rowParaPonto(row: EcopontoRow): PontoColeta {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria as Categoria,
    endereco: row.endereco,
    bairro: row.bairro,
    horarioFuncionamento: row.horarioFuncionamento,
    latitude: row.latitude,
    longitude: row.longitude,
    imagemUri: row.imagemUri,
    telefoneContato: row.telefoneContato,
    aceitaEntulho: row.aceitaEntulho === 1,
  };
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ecopontos (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          categoria TEXT NOT NULL,
          endereco TEXT NOT NULL,
          bairro TEXT NOT NULL,
          horarioFuncionamento TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          imagemUri TEXT NOT NULL,
          telefoneContato TEXT NOT NULL,
          aceitaEntulho INTEGER NOT NULL DEFAULT 0,
          custom INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS favoritos (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          categoria TEXT NOT NULL,
          endereco TEXT NOT NULL,
          bairro TEXT NOT NULL,
          horarioFuncionamento TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          imagemUri TEXT NOT NULL,
          telefoneContato TEXT NOT NULL,
          aceitaEntulho INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS descartes (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL,
          fotoUri TEXT NOT NULL,
          categoria TEXT NOT NULL,
          pontoId TEXT NOT NULL,
          pontoNome TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS usuarios (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          criadoEm TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function listarEcopontosDb(custom = false): Promise<PontoColeta[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EcopontoRow>(
    'SELECT * FROM ecopontos WHERE custom = ?;',
    [custom ? 1 : 0],
  );
  return rows.map(rowParaPonto);
}

export async function inserirEcopontoDb(ponto: PontoColeta, custom = false): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO ecopontos
      (id, nome, categoria, endereco, bairro, horarioFuncionamento, latitude, longitude, imagemUri, telefoneContato, aceitaEntulho, custom)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      ponto.id,
      ponto.nome ?? '',
      ponto.categoria ?? 'Recicláveis Gerais',
      ponto.endereco ?? '',
      ponto.bairro ?? '',
      ponto.horarioFuncionamento ?? '',
      ponto.latitude,
      ponto.longitude,
      ponto.imagemUri ?? '',
      ponto.telefoneContato ?? '',
      ponto.aceitaEntulho ? 1 : 0,
      custom ? 1 : 0,
    ],
  );
}

export async function salvarEcopontosDb(pontos: PontoColeta[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ecopontos WHERE custom = 0;');
    for (const ponto of pontos) {
      await db.runAsync(
        `INSERT OR REPLACE INTO ecopontos
          (id, nome, categoria, endereco, bairro, horarioFuncionamento, latitude, longitude, imagemUri, telefoneContato, aceitaEntulho, custom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [
          ponto.id,
          ponto.nome ?? '',
          ponto.categoria ?? 'Recicláveis Gerais',
          ponto.endereco ?? '',
          ponto.bairro ?? '',
          ponto.horarioFuncionamento ?? '',
          ponto.latitude,
          ponto.longitude,
          ponto.imagemUri ?? '',
          ponto.telefoneContato ?? '',
          ponto.aceitaEntulho ? 1 : 0,
        ],
      );
    }
  });
}

export async function listarFavoritosDb(): Promise<PontoColeta[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EcopontoRow>('SELECT * FROM favoritos;');
  return rows.map(rowParaPonto);
}

export async function ehFavoritoDb(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM favoritos WHERE id = ?;',
    [id],
  );
  return row !== null;
}

export async function alternarFavoritoDb(ponto: PontoColeta): Promise<boolean> {
  const db = await getDb();
  const existe = await ehFavoritoDb(ponto.id);

  if (existe) {
    await db.runAsync('DELETE FROM favoritos WHERE id = ?;', [ponto.id]);
    return false;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO favoritos
      (id, nome, categoria, endereco, bairro, horarioFuncionamento, latitude, longitude, imagemUri, telefoneContato, aceitaEntulho)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      ponto.id,
      ponto.nome,
      ponto.categoria,
      ponto.endereco,
      ponto.bairro,
      ponto.horarioFuncionamento,
      ponto.latitude,
      ponto.longitude,
      ponto.imagemUri,
      ponto.telefoneContato,
      ponto.aceitaEntulho ? 1 : 0,
    ],
  );
  return true;
}

export async function listarDescartesDb(role: Role): Promise<Descarte[]> {
  const db = await getDb();
  return db.getAllAsync<Descarte>(
    'SELECT id, fotoUri, categoria, pontoId, pontoNome, data FROM descartes WHERE role = ? ORDER BY data DESC;',
    [role],
  );
}

export async function inserirDescarteDb(descarte: Descarte, role: Role): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO descartes (id, role, fotoUri, categoria, pontoId, pontoNome, data)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      descarte.id,
      role,
      descarte.fotoUri,
      descarte.categoria,
      descarte.pontoId,
      descarte.pontoNome,
      descarte.data,
    ],
  );
}

export async function removerDescarteDb(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM descartes WHERE id = ?;', [id]);
}

export async function inserirUsuarioDb(usuario: UsuarioDb): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO usuarios (id, nome, email, role, criadoEm)
     VALUES (?, ?, ?, ?, ?);`,
    [usuario.id, usuario.nome, usuario.email, usuario.role, usuario.criadoEm],
  );
}

export async function listarUsuariosDb(role?: Role): Promise<UsuarioDb[]> {
  const db = await getDb();
  if (role) {
    return db.getAllAsync<UsuarioDb>(
      'SELECT id, nome, email, role, criadoEm FROM usuarios WHERE role = ? ORDER BY criadoEm DESC;',
      [role],
    );
  }
  return db.getAllAsync<UsuarioDb>(
    'SELECT id, nome, email, role, criadoEm FROM usuarios ORDER BY criadoEm DESC;',
  );
}

export async function buscarUsuarioPorEmailDb(
  email: string,
  role?: Role,
): Promise<UsuarioDb | null> {
  const db = await getDb();
  if (role) {
    return db.getFirstAsync<UsuarioDb>(
      'SELECT id, nome, email, role, criadoEm FROM usuarios WHERE LOWER(email) = LOWER(?) AND role = ?;',
      [email.trim(), role],
    );
  }
  return db.getFirstAsync<UsuarioDb>(
    'SELECT id, nome, email, role, criadoEm FROM usuarios WHERE LOWER(email) = LOWER(?);',
    [email.trim()],
  );
}

export async function debugBancoDeDados() {
  const db = await getDb();
  const [usuarios, ecopontos, favoritos, descartes] = await Promise.all([
    db.getAllAsync<UsuarioDb>('SELECT * FROM usuarios ORDER BY criadoEm DESC;'),
    db.getAllAsync<EcopontoRow>('SELECT * FROM ecopontos;'),
    db.getAllAsync<EcopontoRow>('SELECT * FROM favoritos;'),
    db.getAllAsync<Descarte & { role: Role }>('SELECT * FROM descartes ORDER BY data DESC;'),
  ]);

  console.log('[SQLite] usuarios:', usuarios);
  console.log('[SQLite] ecopontos:', ecopontos);
  console.log('[SQLite] favoritos:', favoritos);
  console.log('[SQLite] descartes:', descartes);

  return { usuarios, ecopontos, favoritos, descartes };
}
