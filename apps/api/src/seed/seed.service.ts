import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { initialData } from './data/data_prueba';
import { ClientesService, SegmentacionService } from '../clientes/services';
import { EstadoOrdenServicioService, TipoClienteService, TipoIdentificacionService, UbicacionService } from '../common/services';

@Injectable()
export class SeedService {

    private environment: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly clienteService: ClientesService,
        private readonly segmentacionService: SegmentacionService,
        private readonly estadoOrdenServicioService: EstadoOrdenServicioService,
        private readonly tipoClienteService: TipoClienteService,
        private readonly tipoIdService: TipoIdentificacionService,
        private readonly ubicacionService: UbicacionService,
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

        // ELIMINAR TABLA ESTADO ORDEN DE SERVICIO
        await this.estadoOrdenServicioService.deleteAllTiposEstadosOrden();

        // ELIMINAR TABLA TIPO CLIENTE:
        await this.tipoClienteService.deleteAllTiposCliente();




        // ELIMINAR TABLA TIPO ID: despues de eliminar usuario, cliente y personal
        await this.tipoIdService.deleteAllTiposId();

        // ELIMINAR TABLA PAIS -> DEPARTAMENTO -> CIUDAD: despues de borrar personal y locacion
        await this.ubicacionService.deleteAllPais();

    }

    private async insertNewData() {}

}
