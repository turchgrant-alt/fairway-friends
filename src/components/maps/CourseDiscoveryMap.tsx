import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Course } from '@/lib/course-data';
import type { MapBoundsTuple } from '@/lib/map-search-locations';

interface ViewportState {
  bounds: MapBoundsTuple;
  zoom: number;
}

interface MapFocusTarget {
  id: string;
  label: string;
  bounds: MapBoundsTuple;
  maxZoom?: number;
}

interface CourseDiscoveryMapProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
  onViewportChange: (viewport: ViewportState) => void;
  focusTarget: MapFocusTarget;
}

function hasCoordinates(course: Course) {
  return course.latitude != null && course.longitude != null;
}

function createMarkerIcon(active: boolean) {
  const outerBackground = active ? 'hsl(42 80% 55%)' : 'hsl(154 46% 10%)';
  const outerBorder = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.78)';
  const innerBackground = active ? 'hsl(154 46% 10%)' : 'rgba(255,255,255,0.96)';

  return L.divIcon({
    className: 'golfer-map-marker',
    html: `
      <span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:22px;
        height:22px;
        border-radius:999px;
        background:${outerBackground};
        border:2px solid ${outerBorder};
        box-shadow:0 14px 30px -12px rgba(0,0,0,0.55);
      ">
        <span style="
          width:7px;
          height:7px;
          border-radius:999px;
          background:${innerBackground};
        "></span>
      </span>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function toLeafletBounds(bounds: MapBoundsTuple) {
  return L.latLngBounds(bounds);
}

export default function CourseDiscoveryMap({
  courses,
  selectedCourseId,
  onSelectCourse,
  onViewportChange,
  focusTarget,
}: CourseDiscoveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const previousSelectedCourseIdRef = useRef<string | null>(null);
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      minZoom: 3,
      maxZoom: 14,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);

    const emitViewport = () => {
      if (!mapRef.current) return;

      const bounds = mapRef.current.getBounds();
      onViewportChangeRef.current({
        bounds: [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()],
        ],
        zoom: mapRef.current.getZoom(),
      });
    };

    map.on('moveend zoomend', emitViewport);
    map.fitBounds(toLeafletBounds(focusTarget.bounds), {
      padding: [28, 28],
      maxZoom: focusTarget.maxZoom ?? 5,
      animate: false,
    });

    mapRef.current = map;
    emitViewport();

    return () => {
      map.off('moveend zoomend', emitViewport);
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      markersByIdRef.current = new Map();
      previousSelectedCourseIdRef.current = null;
    };
  }, [focusTarget.bounds, focusTarget.maxZoom]);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();
    markersByIdRef.current = new Map();

    courses.filter(hasCoordinates).forEach((course) => {
      const marker = L.marker([course.latitude as number, course.longitude as number], {
        icon: createMarkerIcon(course.id === selectedCourseId),
      });

      marker.on('click', () => onSelectCourse(course.id));
      marker.addTo(markerLayerRef.current as L.LayerGroup);
      markersByIdRef.current.set(course.id, marker);
    });
    previousSelectedCourseIdRef.current = selectedCourseId;
  }, [courses, onSelectCourse]);

  useEffect(() => {
    const previousSelectedCourseId = previousSelectedCourseIdRef.current;

    if (previousSelectedCourseId === selectedCourseId) return;

    if (previousSelectedCourseId) {
      const previousMarker = markersByIdRef.current.get(previousSelectedCourseId);
      if (previousMarker) {
        previousMarker.setIcon(createMarkerIcon(false));
      }
    }

    if (selectedCourseId) {
      const selectedMarker = markersByIdRef.current.get(selectedCourseId);
      if (selectedMarker) {
        selectedMarker.setIcon(createMarkerIcon(true));
      }
    }

    previousSelectedCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.fitBounds(toLeafletBounds(focusTarget.bounds), {
      padding: [28, 28],
      maxZoom: focusTarget.maxZoom ?? 5,
      animate: true,
    });
  }, [focusTarget]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
