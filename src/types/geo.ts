export interface Coords {
  latitude: number;
  longitude: number;
}

export interface Regiao extends Coords {
  latitudeDelta: number;
  longitudeDelta: number;
}
