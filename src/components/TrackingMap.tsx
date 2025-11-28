import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import AnimatedPackageMarker from './AnimatedPackageMarker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons for different marker types
const createCustomIcon = (color: string, icon: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); color: white; font-size: 16px;">${icon}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const originIcon = createCustomIcon('hsl(var(--primary))', '🏭');
const destinationIcon = createCustomIcon('hsl(var(--accent))', '🏠');
const currentIcon = createCustomIcon('hsl(142.1 76.2% 36.3%)', '📦');

interface Location {
  lat: number;
  lng: number;
  name?: string;
  timestamp?: string;
  status?: string;
  location?: string;
}

interface TrackingMapProps {
  route: Location[];
  origin: Location;
  destination: Location;
  current: Location;
  enableClustering?: boolean;
  pollInterval?: number;
}

// Component to fit bounds
const FitBounds = ({ bounds }: { bounds: L.LatLngBounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
};

const TrackingMap = ({
  route,
  origin,
  destination,
  current,
}: TrackingMapProps) => {
  const mapRef = useRef<L.Map>(null);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Get tile URL from env or use OpenStreetMap as fallback
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = import.meta.env.VITE_MAP_ATTRIBUTION || 
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Calculate bounds to fit all points
  const bounds = L.latLngBounds([
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
    [current.lat, current.lng],
    ...route.map(point => [point.lat, point.lng] as [number, number])
  ]);

  // Prepare polyline positions
  const polylinePositions = route.map(point => [point.lat, point.lng] as [number, number]);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePlayPause = () => {
    if (!showAnimation) {
      setShowAnimation(true);
      setIsAnimationPlaying(true);
    } else {
      setIsAnimationPlaying(!isAnimationPlaying);
    }
  };

  const handleReset = () => {
    setShowAnimation(false);
    setIsAnimationPlaying(false);
    setAnimationProgress(0);
  };

  const handleAnimationComplete = () => {
    setIsAnimationPlaying(false);
  };

  const handlePositionChange = (_position: Location, progress: number) => {
    setAnimationProgress(progress);
  };

  return (
    <div className="space-y-4">
      {/* Animation controls removed per request */}

      {/* Map Container */}
      <div className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-border shadow-elegant">
        <MapContainer
          ref={mapRef}
          center={[current.lat, current.lng]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />

        <FitBounds bounds={bounds} />

        {/* Origin Marker */}
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-primary">📍 Asal</div>
              <div className="font-semibold">{origin.name}</div>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-accent">🎯 Tujuan</div>
              <div className="font-semibold">{destination.name}</div>
            </div>
          </Popup>
        </Marker>

        {/* Route Polyline */}
        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Route Points as small markers */}
        {route.map((point, index) => (
          point.location && (
            <CircleMarker
              key={index}
              center={[point.lat, point.lng]}
              pathOptions={{
                fillColor: 'hsl(var(--primary))',
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
              }}
              radius={6}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <div className="font-semibold">{point.location}</div>
                  {point.status && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Status: </span>
                      {point.status}
                    </div>
                  )}
                  {point.timestamp && (
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(point.timestamp)}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>
      </div>
    </div>
  );
};

export default TrackingMap;