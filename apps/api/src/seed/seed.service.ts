import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { initialData } from './data/data_prueba';
import { ClientesService, SegmentacionService } from '../clientes/services';
import { EstadoOrdenServicioService } from '../common/services';

@Injectable()
export class SeedService {

    private environment: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly clienteService: ClientesService,
        private readonly segmentacionService: SegmentacionService,
        private readonly estadoOrdenServicioService: EstadoOrdenServicioService,
        
    ){
        this.environment = this.configService.get<string>('environment');
    }

    async runSeed(){

        if(this.environment !== 'dev'){
            throw new ForbiddenException("Estas en otro ambiente que no es DESARROLLO y no se puede ejecutar el SEED");
        }

        await this.deleteTables();
    
        await this.insertNewData();
        
        return "SEED EXECUTED";
    
    }

    private async deleteTables(){

        // ELIMINAR TABLA CLIENTES -> LOCACIONES -> CORREOS -> CORREO_ESTADO
        await this.clienteService.deleteAllClientes();

        // ELIMINAR TABLAS SEGMENTACION -> SUBSEGMENTACION
        await this.segmentacionService.deleteAllSegmentaciones();

    }

    private async insertNewData() {}

}
