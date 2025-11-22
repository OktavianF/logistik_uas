import { useEffect, useState, useRef } from 'react';
import { Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
  status?: string;
  location?: string;
}

interface AnimatedPackageMarkerProps {
  route: Location[];
  isPlaying: boolean;
  speed: number;
  onPositionChange?: (position: Location, progress: number) => void;
  onComplete?: () => void;
}

// Create animated package icon
const createAnimatedPackageIcon = () => {
  return L.divIcon({
    className: 'animated-package-marker',
    html: `
      <div class="animate-bounce" style="
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px hsl(var(--primary) / 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <span style="color: white; font-size: 20px;">🚚</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px hsl(var(--primary) / 0.6); }
          50% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.5), 0 0 30px hsl(var(--primary) / 0.8); }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const AnimatedPackageMarker = ({
  route,
  isPlaying,
  speed,
  onPositionChange,
  onComplete,
}: AnimatedPackageMarkerProps) => {
  const [currentPosition, setCurrentPosition] = useState<Location>(route[0]);
  const [progress, setProgress] = useState(0);
  const [trailPositions, setTrailPositions] = useState<[number, number][]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedProgressRef = useRef(0);
  const map = useMap();

  // Interpolate between two points
  const interpolate = (start: Location, end: Location, t: number): Location => {
    return {
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
      timestamp: end.timestamp,
      status: end.status,
      location: end.location,
    };
  };

  // Calculate position along route based on progress (0 to 1)
  const getPositionAtProgress = (prog: number): Location => {
    if (route.length === 0) return route[0];
    if (prog >= 1) return route[route.length - 1];
    if (prog <= 0) return route[0];

    const totalSegments = route.length - 1;
    const segmentProgress = prog * totalSegments;
    const segmentIndex = Math.floor(segmentProgress);
    const segmentT = segmentProgress - segmentIndex;

    if (segmentIndex >= totalSegments) return route[route.length - 1];

    return interpolate(route[segmentIndex], route[segmentIndex + 1], segmentT);
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying || route.length < 2) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const duration = (10000 / speed); // Base duration 10 seconds, adjusted by speed

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = (elapsed / duration) + pausedProgressRef.current;
      const currentProgress = Math.min(rawProgress, 1);

      setProgress(currentProgress);
      const newPosition = getPositionAtProgress(currentProgress);
      setCurrentPosition(newPosition);

      // Update trail
      setTrailPositions(prev => {
        const newTrail = [...prev, [newPosition.lat, newPosition.lng] as [number, number]];
        // Keep trail at max 50 points
        return newTrail.slice(-50);
      });

      // Pan map to follow marker
      map.panTo([newPosition.lat, newPosition.lng], { animate: true, duration: 0.5 });

      onPositionChange?.(newPosition, currentProgress);

      if (currentProgress >= 1) {
        onComplete?.();
        pausedProgressRef.current = 0;
        startTimeRef.current = null;
        setTrailPositions([]);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, route, onPositionChange, onComplete, map]);

  // Handle pause
  useEffect(() => {
    if (!isPlaying && animationRef.current) {
      pausedProgressRef.current = progress;
      startTimeRef.current = null;
    }
  }, [isPlaying, progress]);

  const animatedIcon = createAnimatedPackageIcon();

  return (
    <>
      {/* Animated trail */}
      {trailPositions.length > 1 && (
        <Polyline
          positions={trailPositions}
          pathOptions={{
            color: 'hsl(var(--accent))',
            weight: 3,
            opacity: 0.6,
            dashArray: '5, 5',
          }}
        />
      )}

      {/* Animated package marker */}
      <Marker position={[currentPosition.lat, currentPosition.lng]} icon={animatedIcon}>
        <Popup>
          <div className="text-sm space-y-1">
            <div className="font-bold text-primary">🚚 Paket Bergerak</div>
            <div className="text-xs">
              <span className="text-muted-foreground">Progress: </span>
              <span className="font-semibold">{Math.round(progress * 100)}%</span>
            </div>
            {currentPosition.status && (
              <div className="text-xs">
                <span className="text-muted-foreground">Status: </span>
                {currentPosition.status}
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default AnimatedPackageMarker;