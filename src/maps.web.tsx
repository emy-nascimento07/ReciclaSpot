/**
 * Versão web do `react-native-maps`, feita com Leaflet + OpenStreetMap.
 * O metro.config.js troca o import de 'react-native-maps' por este arquivo
 * só quando roda no navegador. No celular, nada muda.
 */
import {
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { View, ViewStyle, StyleProp } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
type LatLng = { latitude: number; longitude: number };

const toBounds = (r: Region): L.LatLngBoundsExpression => [
  [r.latitude - r.latitudeDelta / 2, r.longitude - r.longitudeDelta / 2],
  [r.latitude + r.latitudeDelta / 2, r.longitude + r.longitudeDelta / 2],
];

const MapCtx = createContext<{ map: L.Map | null; markerPressed: { current: boolean } } | null>(null);

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion: Region;
  showsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onPress?: (ev: { nativeEvent: { action?: string } }) => void;
  children?: ReactNode;
  // demais props do react-native-maps são ignoradas na web
  [k: string]: any;
};

export type MapViewHandle = { animateToRegion: (r: Region, duration?: number) => void };

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { style, initialRegion, showsUserLocation, scrollEnabled = true, zoomEnabled = true, onPress, children },
  ref,
) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const markerPressed = useRef(false);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    if (!divRef.current) return;
    const m = L.map(divRef.current, {
      zoomControl: false,
      attributionControl: true,
      dragging: scrollEnabled,
      scrollWheelZoom: zoomEnabled,
      doubleClickZoom: zoomEnabled,
      touchZoom: zoomEnabled,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m);
    m.fitBounds(toBounds(initialRegion));
    m.on('click', () => {
      if (markerPressed.current) {
        markerPressed.current = false;
        return;
      }
      onPressRef.current?.({ nativeEvent: {} });
    });
    // o container pode mudar de tamanho depois de montar
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(divRef.current);
    setMap(m);
    return () => {
      ro.disconnect();
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    animateToRegion: (r, duration = 400) => {
      map?.flyToBounds(toBounds(r), { duration: duration / 1000 });
    },
  }), [map]);

  // bolinha azul da localização do usuário
  useEffect(() => {
    if (!map || !showsUserLocation || !navigator.geolocation) return;
    let dot: L.CircleMarker | null = null;
    const id = navigator.geolocation.watchPosition((p) => {
      const ll: L.LatLngExpression = [p.coords.latitude, p.coords.longitude];
      if (dot) dot.setLatLng(ll);
      else
        dot = L.circleMarker(ll, {
          radius: 8, color: '#fff', weight: 3, fillColor: '#2F80ED', fillOpacity: 1,
        }).addTo(map);
    });
    return () => {
      navigator.geolocation.clearWatch(id);
      dot?.remove();
    };
  }, [map, showsUserLocation]);

  return (
    <View style={style}>
      <div ref={divRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <MapCtx.Provider value={{ map, markerPressed }}>{children}</MapCtx.Provider>
    </View>
  );
});

type MarkerProps = {
  coordinate: LatLng;
  anchor?: { x: number; y: number };
  onPress?: () => void;
  children?: ReactNode;
};

export function Marker({ coordinate, anchor = { x: 0.5, y: 1 }, onPress, children }: MarkerProps) {
  const ctx = useContext(MapCtx);
  const [el] = useState(() => {
    const d = document.createElement('div');
    d.style.display = 'inline-block';
    return d;
  });
  const markerRef = useRef<L.Marker | null>(null);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    const map = ctx?.map;
    if (!map) return;
    const icon = L.divIcon({ html: el, className: '', iconSize: undefined });
    const mk = L.marker([coordinate.latitude, coordinate.longitude], { icon }).addTo(map);
    mk.on('click', () => {
      ctx.markerPressed.current = true;
      setTimeout(() => (ctx.markerPressed.current = false), 0);
      onPressRef.current?.();
    });
    markerRef.current = mk;
    return () => {
      mk.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.map]);

  useEffect(() => {
    markerRef.current?.setLatLng([coordinate.latitude, coordinate.longitude]);
  }, [coordinate.latitude, coordinate.longitude]);

  // posiciona o conteúdo de acordo com o anchor (ex.: ponta do pino no ponto)
  el.style.transform = `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%)`;

  return createPortal(children ?? <DefaultPin />, el);
}

function DefaultPin() {
  return <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#e33' }} />;
}

export default MapView;
