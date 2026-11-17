import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EnviarCorreoDto } from '../../common/dto';
import { SendMailOptions } from '../../common/services/email/email.service';
import { EmailService, TipoClienteService, TipoIdentificacionService } from '../../common/services';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { ReporteClientesPuestosService } from '../../reportes/services';

import { Cliente, Correo } from '../entities';
import { EstadoOrdenServicio } from '../../common/entities';
import { SubSegmentacionService } from './sub-segmentacion.service';
import { enviarCorreoContactoVinculado } from './correo-contacto.helper';

import { CreateClienteDto, UpdateClienteDto, FilterClienteDto, ClienteFilterColumn, CreateCorreoDto } from '../dto';

@Injectable()
export class ClientesService {

  private readonly logger = new Logger('ClientesService');
        
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Correo)
    private readonly correoRepository: Repository<Correo>,
    @InjectRepository(EstadoOrdenServicio)
    private readonly estadoOrdenServicioRepository: Repository<EstadoOrdenServicio>,
    private readonly dataSource: DataSource,
    private readonly subSegmentacionService: SubSegmentacionService,
    private readonly tipoClienteService: TipoClienteService,
    private readonly tipoIdentificacionService: TipoIdentificacionService,
    private readonly reporteClientesPuestosService: ReporteClientesPuestosService, // Servicio para generar reportes de clientes y puestos
    private readonly emailService: EmailService, // Servicio de email para envio de correos
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createClienteDto: CreateClienteDto) {
    
    const existCliente = await this.clienteRepository.findOneBy({numeroIdentificacion: createClienteDto.numeroIdentificacion});
    
    if(existCliente){
      throw new BadRequestException(`Cliente con identificacion ${createClienteDto.numeroIdentificacion} ya existe`);
    }

    // OBTENER TIPO DE ID
    const tipoIdentificacion = await this.tipoIdentificacionService.findOne(createClienteDto.idTipoIdentificacion);
    
    // OBTENER TIPO DE CLIENTE
    const tipoCliente = await this.tipoClienteService.findOne(createClienteDto.idTipoCliente);

    // OBTENER SUB SEGMENTACION
    const subSegmentacion = createClienteDto.idSubSegmentacion ? await this.subSegmentacionService.findOne(createClienteDto.idSubSegmentacion) : null;

    try {

      const { correos, ...clienteData } = createClienteDto;

      // El cliente y sus contactos se guardan juntos (si falla un contacto no queda el cliente a medias)
      return await this.dataSource.transaction(async (manager) => {

        const cliente = manager.create(Cliente, {
          ...clienteData,
          idTipoIdentificacion: tipoIdentificacion,
          idTipoCliente: tipoCliente,
          idSubSegmentacion: subSegmentacion
        });

        await manager.save(Cliente, cliente);

        if (correos?.length) {
          await this.guardarCorreosCliente(manager, cliente, correos);
        }

        return cliente;

      });
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }

  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [clientes, total] = await this.clienteRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          }
      });
  
      return {
        data: clientes,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        }
      };

    }

    const clientes = await this.clienteRepository.find({
      order: {
        nombre: 'ASC'
      }
    });

    return {
      data: clientes,
      pagination: {
        total: clientes.length,
        limit: clientes.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }
  
  async findAllActives(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [clientes, total] = await this.clienteRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return {
        data: clientes,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        }
      };

    }
    
    const clientes= await this.clienteRepository.find({
        order: {
            nombre: 'ASC'
        },
        where: {
            estado: true
        }
    });

    return {
      data: clientes,
      pagination: {
        total: clientes.length,
        limit: clientes.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  async findOne(id: number) {
    
    const cliente = await this.clienteRepository.findOne({
      where: {
        idCliente: id
      },
      relations: {
        locaciones: {
          correos: {
            estados: true
          },
          idCiudad: true
        },
        // Contactos del cliente (para sus ordenes asignadas directo, sin puesto)
        correos: {
          estados: true
        }
      }
    });
        
    if(!cliente) throw new NotFoundException(`Cliente con id "${id}" no se ha encontrado`);

    return cliente;

  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    
    const { idTipoIdentificacion, idTipoCliente, idSubSegmentacion, correos, ...clienteData } = updateClienteDto;

    const cliente = await this.clienteRepository.preload({idCliente: id, ...clienteData});

    if(!cliente) throw new NotFoundException(`Cliente con id "${id}" no encontrado`);

    if (updateClienteDto.idTipoIdentificacion){
      
      // OBTENER TIPO DE ID
      const tipoIdentificacion = await this.tipoIdentificacionService.findOne(updateClienteDto.idTipoIdentificacion);

      cliente.idTipoIdentificacion = tipoIdentificacion;
      
    }
    
    if (updateClienteDto.idTipoCliente){
      
      // OBTENER TIPO DE CLIENTE
      const tipoCliente = await this.tipoClienteService.findOne(updateClienteDto.idTipoCliente);

      cliente.idTipoCliente = tipoCliente;
      
    }
    
    if (updateClienteDto.idSubSegmentacion !== undefined){
      if (updateClienteDto.idSubSegmentacion === null) {
        cliente.idSubSegmentacion = null;
      } else {
        // OBTENER SUB SEGMENTACION
        const subSegmentacion = await this.subSegmentacionService.findOne(updateClienteDto.idSubSegmentacion);
        cliente.idSubSegmentacion = subSegmentacion;
      }
    }

    try {
      
      await this.dataSource.transaction(async (manager) => {

        await manager.save(Cliente, cliente);

        // Solo si se envian los contactos se reemplazan (sin enviarlos quedan como estan)
        if (correos !== undefined) {
          await this.guardarCorreosCliente(manager, cliente, correos);
        }

      });

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // REEMPLAZA LOS CONTACTOS DEL CLIENTE POR LOS ENVIADOS (mismas reglas que los contactos de un puesto: sin emails
  // repetidos, cada uno con al menos un estado existente). Solo a los emails que no estaban antes se les envia el
  // correo de bienvenida
  private async guardarCorreosCliente(manager: EntityManager, cliente: Cliente, correos: CreateCorreoDto[]) {

    // Sin emails repetidos (se conserva el primero)
    const vistos = new Set<string>();
    const correosUnicos = correos.filter(correo => {
      const email = correo.email.toLowerCase().trim();
      if (vistos.has(email)) return false;
      vistos.add(email);
      return true;
    });

    const existentes = await manager.find(Correo, { where: { cliente: { idCliente: cliente.idCliente } } });
    const emailsExistentes = new Set(existentes.map(correo => correo.email.toLowerCase().trim()));

    await manager.delete(Correo, { cliente: { idCliente: cliente.idCliente } });

    for (const correoDto of correosUnicos) {

      if (!correoDto.estados?.length) {
        throw new BadRequestException(`Se debe enviar al menos un estado en cada correo`);
      }

      const estados = await this.estadoOrdenServicioRepository.findBy({
        idEstadoOrdenServicio: In(correoDto.estados)
      });

      if (estados.length !== correoDto.estados.length) {

        const encontrados = estados.map(estado => estado.idEstadoOrdenServicio);
        const noEncontrados = correoDto.estados.filter(id => !encontrados.includes(id));

        throw new BadRequestException(`Los siguientes estados no existen: ${noEncontrados.join(', ')}`);

      }

      await manager.save(Correo, manager.create(Correo, {
        nombre: correoDto.nombre,
        apellido: correoDto.apellido,
        email: correoDto.email,
        cliente,
        locacion: null,
        estados,
      }));

      if (!emailsExistentes.has(correoDto.email.toLowerCase().trim())) {
        await enviarCorreoContactoVinculado(this.emailService, correoDto, `el cliente ${cliente.nombre}`);
      }

    }

  }

  // EMAILS DE LOS CONTACTOS DEL CLIENTE QUE QUIEREN AVISO DE ESE ESTADO DE LA ORDEN (para las ordenes asignadas
  // directo al cliente; las de un puesto usan getEmailsByLocacionAndEstado)
  async getEmailsByClienteAndEstado(idCliente: number, idEstadoOrden: number): Promise<string[]> {

    const result = await this.correoRepository
      .createQueryBuilder('correo')
      .innerJoin('correo_estado', 'ce', 'ce.correo_id = correo.idCorreo')
      .where('correo.idCliente = :idCliente', { idCliente })
      .andWhere('ce.estado_id = :idEstadoOrden', { idEstadoOrden })
      .select('correo.email')
      .getMany();

    return result.map(correo => correo.email);

  }

  async remove(id: number) {
    
    const cliente = await this.findOne(id);
    
    try {

      await this.clienteRepository.remove(cliente);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Cliente ${cliente.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  async findFiltered(
    filterClienteDto: FilterClienteDto
  ) {
    
    const {
      column,
      query,
      limit = this.defaultLimit,
      offset = 0,
    } = filterClienteDto;
  
    const columnMap: Record<ClienteFilterColumn, string> = {
      [ClienteFilterColumn.NUMERO_IDENTIFICACION]: 'cliente.numeroIdentificacion',
      [ClienteFilterColumn.NOMBRE]: 'cliente.nombre',
      [ClienteFilterColumn.TIPO_CLIENTE]: 'tipoCliente.descripcion',
      [ClienteFilterColumn.SUBSEGMENTACION]: 'subSegmentacion.descripcion',
    };
  
    const dbColumn = columnMap[column];
  
    if (!dbColumn) {
      throw new BadRequestException('Columna de filtro no permitida');
    }
  
    const qb = this.clienteRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.idTipoIdentificacion', 'tipoIdentificacion')
      .leftJoinAndSelect('cliente.idTipoCliente', 'tipoCliente')
      .leftJoinAndSelect('cliente.idSubSegmentacion', 'subSegmentacion')
      .where(`${dbColumn} LIKE :query`, {
        query: `%${query}%`,
      })
      .orderBy('cliente.nombre', 'ASC');
  
    if (filterClienteDto.pagination === PaginationOption.TRUE) {
      qb.take(limit).skip(offset);

      const [clientes, total] = await qb.getManyAndCount();

      return {
        data: clientes,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        },
      };

    }
  
    const clientes = await qb.getMany();

    return {
      data: clientes,
      pagination: {
        total: clientes.length,
        limit: clientes.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
    
  }

  async downloadClientes(filterClienteDto?: FilterClienteDto){

    let clientes;

    if (filterClienteDto?.column && filterClienteDto?.query) {
      const { column, query } = filterClienteDto;
      const columnMap: Record<ClienteFilterColumn, string> = {
        [ClienteFilterColumn.NUMERO_IDENTIFICACION]: 'cliente.numeroIdentificacion',
        [ClienteFilterColumn.NOMBRE]: 'cliente.nombre',
        [ClienteFilterColumn.TIPO_CLIENTE]: 'tipoCliente.descripcion',
        [ClienteFilterColumn.SUBSEGMENTACION]: 'subSegmentacion.descripcion',
      };
      const dbColumn = columnMap[column as ClienteFilterColumn];

      if (!dbColumn) {
        throw new BadRequestException('Columna de filtro no permitida');
      }

      clientes = await this.clienteRepository
        .createQueryBuilder('cliente')
        .leftJoinAndSelect('cliente.idTipoIdentificacion', 'tipoIdentificacion')
        .leftJoinAndSelect('cliente.idTipoCliente', 'tipoCliente')
        .leftJoinAndSelect('cliente.idSubSegmentacion', 'subSegmentacion')
        .leftJoinAndSelect('cliente.locaciones', 'locaciones')
        .where(`${dbColumn} LIKE :query`, { query: `%${query}%` })
        .orderBy('cliente.nombre', 'ASC')
        .getMany();
    } else {
      clientes = await this.clienteRepository.find({
        relations: {
          locaciones: true,
        },
      });
    }

    const excelBuffer = await this.reporteClientesPuestosService.generateExcel(clientes);

    return {
      excelBuffer: excelBuffer,
      title: `clientes_puestos_${new Date().toISOString()}`
    };    

  }

  async sendClientesExcel(enviarCorreoDto: EnviarCorreoDto, filterClienteDto?: FilterClienteDto){
  
    let clientes;

    if (filterClienteDto?.column && filterClienteDto?.query) {
      const { column, query } = filterClienteDto;
      const columnMap: Record<ClienteFilterColumn, string> = {
        [ClienteFilterColumn.NUMERO_IDENTIFICACION]: 'cliente.numeroIdentificacion',
        [ClienteFilterColumn.NOMBRE]: 'cliente.nombre',
        [ClienteFilterColumn.TIPO_CLIENTE]: 'tipoCliente.descripcion',
        [ClienteFilterColumn.SUBSEGMENTACION]: 'subSegmentacion.descripcion',
      };
      const dbColumn = columnMap[column as ClienteFilterColumn];

      if (!dbColumn) {
        throw new BadRequestException('Columna de filtro no permitida');
      }

      clientes = await this.clienteRepository
        .createQueryBuilder('cliente')
        .leftJoinAndSelect('cliente.idTipoIdentificacion', 'tipoIdentificacion')
        .leftJoinAndSelect('cliente.idTipoCliente', 'tipoCliente')
        .leftJoinAndSelect('cliente.idSubSegmentacion', 'subSegmentacion')
        .leftJoinAndSelect('cliente.locaciones', 'locaciones')
        .where(`${dbColumn} LIKE :query`, { query: `%${query}%` })
        .orderBy('cliente.nombre', 'ASC')
        .getMany();
    } else {
      clientes = await this.clienteRepository.find({
        relations: {
          locaciones: true,
        },
      });
    }

    const excelBuffer = await this.reporteClientesPuestosService.generateExcel(clientes);

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): Reporte Clientes & Puestos`;

    const html = `
      <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">REPORTE CLIENTES & PUESTOS</h2>
          </div>
          
          <!-- Cuerpo -->
          <div style="padding: 25px; text-align: center;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Buen día, se envia EXCEL adjunto con exportacion de <b>clientes & puestos</b><br><br>
              Por favor, revise el <b>EXCEL adjunto</b> para más detalles.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Si usted no brindó su correo para el sistema de notificaciones, omita este mensaje.
            </p>
            <p style="margin-top: 20px; font-size: 15px;">Saludos,</p>
            <p style="font-size: 15px; font-weight: 600; color: #0055a5;">El equipo de GEVID</p>
          </div>
      
          <!-- Imagen -->
          <div style="text-align: center; padding: 15px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFqE70N9MCDAIq8w8xYD-KSyRc2F2I3vc2vsjFLg6qjE2a-qkUgsh9v4ks9lIOfwXbAsk&usqp=CAU" 
                  alt="videlca" 
                  style="width: 180px; height: auto; border-radius: 8px; margin-top: 10px;">
          </div>
      
          <!-- Mensaje de aplicación -->
          <div style="padding: 10px 20px; text-align: center; font-size: 13px; color: #666; font-style: italic;">
            📩 Este correo fue enviado automáticamente por la aplicación <b>GEVID</b>, no responda este mensaje.
          </div>
      
          <!-- Pie de página -->
          <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © 2025 Videlca Ltda. - Seguridad Física y Electrónica
          </div>
          
        </div>
      </div>
      `;

    const emails = enviarCorreoDto.correos.map(correo => correo.email.trim());

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
      to: emails,
      subject: subject,
      htmlBody: html,
      attachments: [
        {
          filename: `clientes_puestos_${new Date().toISOString()}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
      throw new InternalServerErrorException(`Error al enviar correo con exportacion de clientes y puestos a los emails ${emails}, revisar correos si estan bien escritos`);
    }

  }

  private handleDbExceptions(error: any){

    // Errores ya con su mensaje (ej. validacion de los contactos): se devuelven tal cual
    if (error instanceof HttpException) throw error;

    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  // ELIMINAR TODOS LOS CLIENTES -> LOCACIONES -> CORREOS -> CORREOS_ESTADO: SOLO SI NO HAY LOCACIONES ASOCIADAS A UNA ORDEN DE SERVICIO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA CLIENTES -> LOCACIONES -> CORREOS -> CORREOS_ESTADO
  async deleteAllClientes(){
  
    const query = this.clienteRepository.createQueryBuilder('cliente');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }
  
}
