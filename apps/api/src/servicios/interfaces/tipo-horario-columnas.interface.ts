import { TipoHorarioInterface } from './tipo-horario.interface';

export interface RangoHorario {
    horaInicio: string;
    horaFin: string;
}

interface ColumnasHorario {
    horaInicio: 'horaInicioDiurno' | 'horaInicioNocturno';
    horaFin: 'horaFinDiurno' | 'horaFinNocturno';
}

// NOMBRES DE LAS COLUMNAS DE TipoHorario SEGUN EL TIPO DE HORARIO (DIURNO O NOCTURNO), YA QUE AMBOS
// SE GUARDAN EN LA MISMA FILA. USADO POR TipoHorarioService.obtenerRangoHorario PARA QUE EL CALCULO
// DE PRECIOS Y LAS VALIDACIONES TOMEN EL RANGO DE HORAS CORRECTO SEGUN EL TIPO DE HORARIO SOLICITADO.
export const TIPO_HORARIO_COLUMNAS: Record<string, ColumnasHorario> = {
    [TipoHorarioInterface.DIURNO]: { horaInicio: 'horaInicioDiurno', horaFin: 'horaFinDiurno' },
    [TipoHorarioInterface.NOCTURNO]: { horaInicio: 'horaInicioNocturno', horaFin: 'horaFinNocturno' },
};
