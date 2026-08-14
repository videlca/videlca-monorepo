import { Injectable, Logger } from '@nestjs/common';

interface HolidayApiResponse {
  date: string;
  name: string;
}

@Injectable()
export class FestivosService {

  private readonly logger = new Logger('FestivosService');

  // Cache en memoria por año, los festivos de un año no cambian
  private readonly cachePorAnio = new Map<number, Set<string>>();

  // Evita pedir el mismo año varias veces en paralelo
  private readonly promesasPorAnio = new Map<number, Promise<Set<string>>>();

  // OBTENER SI UNA FECHA ES FESTIVO EN COLOMBIA
  async esFestivo(fecha: Date): Promise<boolean> {

    const festivosDelAnio = await this.obtenerFestivosDelAnio(fecha.getFullYear());

    return festivosDelAnio.has(this.formatearFecha(fecha));

  }

  private async obtenerFestivosDelAnio(anio: number): Promise<Set<string>> {

    if (this.cachePorAnio.has(anio)) {
      return this.cachePorAnio.get(anio);
    }

    if (this.promesasPorAnio.has(anio)) {
      return this.promesasPorAnio.get(anio);
    }

    const promesa = this.consultarFestivosDelAnio(anio);

    this.promesasPorAnio.set(anio, promesa);

    const festivos = await promesa;

    this.promesasPorAnio.delete(anio);

    return festivos;

  }

  private async consultarFestivosDelAnio(anio: number): Promise<Set<string>> {

    try {

      const response = await fetch(`https://api-colombia.com/api/v1/Holiday/year/${anio}`);

      if (!response.ok) {
        throw new Error(`La API de festivos respondio con status ${response.status}`);
      }

      const festivos: HolidayApiResponse[] = await response.json();

      const fechas = new Set(festivos.map(festivo => festivo.date.split('T')[0]));

      this.cachePorAnio.set(anio, fechas);

      return fechas;

    } catch (error) {

      // Si la API de festivos falla no se debe bloquear el calculo del precio, se asume que ese año no tiene festivos configurados
      this.logger.error(`No se pudieron obtener los dias festivos del año ${anio}, se continuara sin festivos para ese año`, error);

      return new Set();

    }

  }

  private formatearFecha(fecha: Date): string {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;

  }

}
