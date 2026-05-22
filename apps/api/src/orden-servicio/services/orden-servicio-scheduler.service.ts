// orden-servicio.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdenServicioService } from './orden-servicio.service';

@Injectable()
export class OrdenServicioScheduler {

    private readonly logger = new Logger(OrdenServicioScheduler.name);

    constructor(
        private readonly ordenServicioService: OrdenServicioService
    ) {}

    // TODOS LOS DIAS A LAS 7 AM
    @Cron('0 7 * * *')
    async validarEstadosOrdenes() {

        this.logger.log('Validando estados de ordenes de servicio...');

        try {

            await this.ordenServicioService.actualizarEstadosAutomaticamente();
            
        } catch (error) {

            this.logger.error(
                'Error global actualizando estados automaticos',
                error
            );
            
        }
    }

    // @Cron('*/10 * * * * *')
    // async testCron() {
    //   console.log('CRON funcionando');
    // }

}