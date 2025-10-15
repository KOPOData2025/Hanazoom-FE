import { Region } from '@/app/map/page';


export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export function getMinimumDistanceForZoom(zoomLevel: number): number {

  if (zoomLevel <= 5) return 50;  
  if (zoomLevel <= 7) return 20;  
  if (zoomLevel <= 9) return 10;  
  if (zoomLevel <= 11) return 5;  
  return 0; 
}


export function filterMarkersByLOD(
  markers: Region[],
  zoomLevel: number,
  centerLat: number,
  centerLng: number,
  isInBounds: (lat: number, lng: number, padding?: number) => boolean
): Region[] {

  let visibleMarkers = markers.filter(marker => 
    isInBounds(marker.latitude, marker.longitude, 0.3) 
  );


  const typeFilter = getMarkerTypeFilter(zoomLevel);
  visibleMarkers = visibleMarkers.filter(marker => typeFilter(marker.type));

  return visibleMarkers;
}


function getMarkerTypeFilter(zoomLevel: number): (type: string) => boolean {
  if (zoomLevel > 8) {
    return (type: string) => type === "CITY";
  } else if (zoomLevel > 5) {
    return (type: string) => type === "DISTRICT";
  } else {
    return (type: string) => type === "NEIGHBORHOOD";
  }
}


function filterByDistance(
  markers: Region[], 
  minDistance: number, 
  centerLat: number, 
  centerLng: number
): Region[] {

  const sortedMarkers = markers.sort((a, b) => {
    const distA = calculateDistance(centerLat, centerLng, a.latitude, a.longitude);
    const distB = calculateDistance(centerLat, centerLng, b.latitude, b.longitude);
    return distA - distB;
  });

  const filteredMarkers: Region[] = [];
  
  for (const marker of sortedMarkers) {
    let shouldInclude = true;
    

    for (const existing of filteredMarkers) {
      const distance = calculateDistance(
        marker.latitude, marker.longitude,
        existing.latitude, existing.longitude
      );
      
      if (distance < minDistance) {
        shouldInclude = false;
        break;
      }
    }
    
    if (shouldInclude) {
      filteredMarkers.push(marker);
    }
  }
  
  return filteredMarkers;
}


export function getMarkerPriority(regionType: string): number {
  switch (regionType) {
    case "CITY": return 3;
    case "DISTRICT": return 2; 
    case "NEIGHBORHOOD": return 1;
    default: return 0;
  }
}


export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static start(label: string): void {
    performance.mark(`${label}-start`);
  }

  static end(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure.duration;
    

    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
    

    const values = this.measurements.get(label)!;
    if (values.length > 10) {
      values.shift();
    }
    

    performance.clearMeasures(label);
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    
    return duration;
  }

  static getStats(label: string): { avg: number; min: number; max: number } | null {
    const values = this.measurements.get(label);
    if (!values || values.length === 0) return null;
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}
