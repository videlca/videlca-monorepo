// Segmentación
export interface CreateSegmentacionDto {
  descripcion: string;
  subSegmentaciones: { descripcion: string }[];
}

export interface UpdateSegmentacionDto {
  descripcion: string;
  subSegmentaciones?: { descripcion: string }[];
  estado: boolean;
}




