import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { initialData } from './data/data_prueba';
import { ClientesService } from '../clientes/services/clientes.service';
import { EstadoOrdenServicioService } from '../common/services';

@Injectable()
export class SeedService {

    private environment: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly clienteService: ClientesService,
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

        

    }

    private async insertNewData() {}

}
