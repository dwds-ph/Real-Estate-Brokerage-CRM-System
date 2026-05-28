export interface MapViewport {
  center: [number, number];
  zoom: number;
}

export interface MapFilters {
  propertyType: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  location: string;
}
