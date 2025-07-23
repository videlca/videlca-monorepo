import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ClientesService, SegmentacionService } from '../clientes/services';
import { EstadoOrdenServicioService, TipoClienteService, TipoIdentificacionService, UbicacionService } from '../common/services';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PersonalService, TipoGeneroService, TipoPersonalService } from '../personal/services';
import { TipoNovedadService } from '../novedad/services';
import { ServiciosService, TipoDuracionService, TipoHorarioDescripcionService, TipoHorarioService, TipoServicioService } from '../servicios/services';
import { PeriodosService } from '../periodos/periodos.service';
import { TarifasService, TipoTarifaService, TipoUnidadTiempoService } from '../tarifas/services';

import { initialData } from './data/data_prueba';

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
        private readonly userService: UsersService,
        private readonly permissionsService: PermissionsService,
        private readonly personalService: PersonalService,
        private readonly tipoNovedadService: TipoNovedadService,
        private readonly tipoGeneroService: TipoGeneroService,
        private readonly tipoPersonalService: TipoPersonalService,
        private readonly tipoDuracionService: TipoDuracionService,
        private readonly tipoHorarioDescripcionService: TipoHorarioDescripcionService,
        private readonly tipoServicioService: TipoServicioService,
        private readonly tipoHorarioService: TipoHorarioService,
        private readonly serviciosService: ServiciosService,
        private readonly periodosService: PeriodosService,
        private readonly tarifasService: TarifasService,
        private readonly tipoTarifaService: TipoTarifaService,
        private readonly tipoUnidadTiempoService: TipoUnidadTiempoService
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
        
        // ELIMINAR TABLA USUARIOS
        await this.userService.deleteAllUsers();

        // ELIMINAR TABLA ROLES Y PERMISOS
        await this.permissionsService.deleteAllRoles();
        await this.permissionsService.deleteAllPermissions();

        // ELIMINAR TABLA CLIENTES -> LOCACIONES -> CORREOS -> CORREO_ESTADO
        await this.clienteService.deleteAllClientes();

        // ELIMINAR TABLAS SEGMENTACION -> SUBSEGMENTACION
        await this.segmentacionService.deleteAllSegmentaciones();

        // ELIMINAR TABLA ESTADO ORDEN DE SERVICIO
        await this.estadoOrdenServicioService.deleteAllTiposEstadosOrden();

        // ELIMINAR TABLA TIPO CLIENTE:
        await this.tipoClienteService.deleteAllTiposCliente();

        // ELIMINAR TABLA PERSONAL -> NOVEDADES
        await this.personalService.deleteAllPersonal();    

        // ELIMINAR TIPO NOVEDAD
        await this.tipoNovedadService.deleteAllTiposNovedad();

        // ELIMINAR TIPO GENERO
        await this.tipoGeneroService.deleteAllTiposGenero();

        // ELIMINAR TIPO PERSONAL
        await this.tipoPersonalService.deleteAllTiposPersonal();

        // ELIMINAR TABLA TIPO ID: despues de eliminar usuario, cliente y personal
        await this.tipoIdService.deleteAllTiposId();

        // ELIMINAR TABLA PAIS -> DEPARTAMENTO -> CIUDAD: despues de borrar personal y locacion
        await this.ubicacionService.deleteAllPais();

        // ELIMINAR TABLA TARIFA
        await this.tarifasService.deleteAllTarifas();

        // ELIMINAR PERIODO
        await this.periodosService.deleteAllPeriodo();

        // ELIMINAR TIPO TARIFA
        await this.tipoTarifaService.deleteAllTiposTarifa();

        // ELIMINAR TIPO UNIDAD TIEMPO
        await this.tipoUnidadTiempoService.deleteAllTiposUnidadTiempo();

        // ELIMINAR SERVICIOS
        await this.serviciosService.deleteAllServicios();

        // ELIMINAR TIPO SERVICIO
        await this.tipoServicioService.deleteAllTiposServicio();

        // ELIMINAR TIPO HORARIO
        await this.tipoHorarioService.deleteAllTiposHorario();

        // ELIMINAR TIPO HORARIO DESCRIPCION
        await this.tipoHorarioDescripcionService.deleteAllTiposHorariosDescripcion();

        // ELIMINAR TIPO DURACION
        await this.tipoDuracionService.deleteAllTiposDuracion();

    }

    private async insertNewData() {

        const tiposUnidadTiempo = initialData.tiposUnidadTiempo;

        const tiposTarifa = initialData.tiposTarifa;

        const tiposId = initialData.tiposId;

        const tiposGenero = initialData.tiposGenero;

        const tiposDuracion = initialData.tiposDuracion;

        const tiposHorario = initialData.tiposHorario;

        const paises = initialData.paises;
        
        const tiposNovedad = initialData.tiposNovedad;

        const estadosOrdenesServicio = initialData.estadosOrdenServicio;

        const roles = initialData.roles;
        const permisos = initialData.permissions;

        const usuarios = initialData.users;

        const insertPromises = [];
        
        // insertar tipos id
        tiposId.forEach(tipoId => {
            insertPromises.push(this.tipoIdService.create({
                descripcion: tipoId.descripcion
            }))
        })

        // Insertar tipos genero
        tiposGenero.forEach(tipoGenero => {
            insertPromises.push(this.tipoGeneroService.create({
                descripcion: tipoGenero.descripcion
            }))
        })

        // Insertar pais
        paises.forEach(pais => {
            insertPromises.push(this.ubicacionService.createPais({
                descripcion: pais.descripcion
            }))
        })

        // Insertar Tipo duracion
        tiposDuracion.forEach(tipoDuracion => {
            insertPromises.push(this.tipoDuracionService.create({
                descripcion: tipoDuracion.descripcion
            }))
        })

        // Insertar Tipo Horario Descripcion
        tiposHorario.forEach(tipoHorario => {
            insertPromises.push(this.tipoHorarioDescripcionService.create({
                descripcion: tipoHorario.descripcion
            }))
        })

        // insertar tipos novedad
        tiposNovedad.forEach(tipoNovedad => {
            insertPromises.push(this.tipoNovedadService.createTipoNovedadSeed(tipoNovedad))
        });

        // insertar estados orden de servicio
        estadosOrdenesServicio.forEach(estadoOrden => {
            insertPromises.push(this.estadoOrdenServicioService.createEstadoOrdenSeed(estadoOrden))
        });

        // insertar rol
        roles.forEach(rol => {
            insertPromises.push(this.permissionsService.createRoleSeed(rol))
        });

        // insertar permisos
        permisos.forEach(permiso => {
            insertPromises.push(this.permissionsService.createPermission(permiso))
        })

        // insertar tipos unidad tiempo
        tiposUnidadTiempo.forEach(tipoUnidadTiempo => {
            insertPromises.push(this.tipoUnidadTiempoService.create(tipoUnidadTiempo))
        })

        await Promise.all(insertPromises);

        // insertar usuarios
        await Promise.all(usuarios.map(user => this.userService.createUserSeed(user)))

        // insertar tipos tarifa
        await Promise.all(tiposTarifa.map(tipoTarifa => this.tipoTarifaService.createTipoTarifaSeed(tipoTarifa)))

        return true;

    }

}
