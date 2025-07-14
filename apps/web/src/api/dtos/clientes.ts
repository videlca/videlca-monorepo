// Segmentación
export interface CreateSegmentacionDto {
  descripcion: string;
  subSegmentaciones: { descripcion: string }[];
}

export interface UpdateSegmentacionDto {
  descripcion?: string;
  estado?: boolean;
}




