import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EnviarCorreoDto } from '../../common/dto';
import { SendMailOptions } from '../../common/services/email/email.service';
import { EmailService, TipoClienteService, TipoIdentificacionService } from '../../common/services';

import { PaginationDto } from '../../common/dto';

import { ReporteClientesPuestosService } from '../../reportes/services';

import { Cliente } from '../entities';
import { SubSegmentacionService } from './sub-segmentacion.service';

import { CreateClienteDto, UpdateClienteDto, FilterClienteDto, ClienteFilterColumn } from '../dto';

@Injectable()
export class ClientesService {

  private readonly logger = new Logger('ClientesService');
        
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
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
    const subSegmentacion = await this.subSegmentacionService.findOne(createClienteDto.idSubSegmentacion);

    try {

      const cliente = this.clienteRepository.create({
        ...createClienteDto,
        idTipoIdentificacion: tipoIdentificacion,
        idTipoCliente: tipoCliente,
        idSubSegmentacion: subSegmentacion
      });

      await this.clienteRepository.save(cliente);

      return cliente;
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const clientes = await this.clienteRepository.find({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          }
      });
  
      return clientes;

    }

    return await this.clienteRepository.find({
      order: {
        nombre: 'ASC'
      }
    });


  }
  
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const clientes = await this.clienteRepository.find({
          take: limit,
          skip: offset,
          order: {
              nombre: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return clientes;

    }
    
    return await this.clienteRepository.find({
        order: {
            nombre: 'ASC'
        },
        where: {
            estado: true
        }
    });

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
        }
      }
    });
        
    if(!cliente) throw new NotFoundException(`Cliente con id "${id}" no se ha encontrado`);

    return cliente;

  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    
    const { idTipoIdentificacion, idTipoCliente, idSubSegmentacion, ...clienteData } = updateClienteDto;

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
    
    if (updateClienteDto.idSubSegmentacion){
      
      // OBTENER SUB SEGMENTACION
      const subSegmentacion = await this.subSegmentacionService.findOne(updateClienteDto.idSubSegmentacion);

      cliente.idSubSegmentacion = subSegmentacion;
      
    }

    try {
      
      await this.clienteRepository.save(cliente);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

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
    filterClienteDto: FilterClienteDto,
    pagination: boolean = true,
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
  
    if (pagination) {
      qb.take(limit).skip(offset);
    }
  
    return await qb.getMany();
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

    const emails = enviarCorreoDto.correos.map(correo => correo.email);

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
