import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../common/dto';
import { PaginationOption } from '../common/interfaces/pagination.interface';
import { EstadoAppInterface } from '../common/interfaces/estado-app.interface';

import { SendMailOptions } from '../common/services/email/email.service';
import { EmailService, CorreoDefaultService } from '../common/services';

import { Periodo } from './entities/periodo.entity';
import { TarifasService } from '../tarifas/services/tarifas.service';

import { CreatePeriodoDto, UpdatePeriodoDto } from './dto';
import { Meses } from './interfaces/meses.interface';

@Injectable()
export class PeriodosService {

  private readonly logger = new Logger('PeriodosService');
          
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Periodo)
    private readonly periodoRepository: Repository<Periodo>,
    private readonly dataSource: DataSource, 
    @Inject(forwardRef(() => TarifasService))
    private readonly tarifasService: TarifasService,
    private readonly correoDefaultService: CorreoDefaultService, // Servicio para obtener el email por defecto
    private readonly emailService: EmailService, // Servicio de email para envio de correos
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async compararPeriodos(
    idPeriodoA: number,
    idPeriodoB: number,
  ){

    if (idPeriodoA === idPeriodoB) {
      throw new BadRequestException('Los periodos a comparar no pueden ser el mismo');
    }

    // =========================================================
    // PERIODOS
    // =========================================================

    const periodoA = await this.periodoRepository.findOne({
      where: { idPeriodo: idPeriodoA }
    });

    if (!periodoA) {
      throw new NotFoundException(`Periodo con id "${idPeriodoA}" no encontrado`);
    }
    
    const periodoB = await this.periodoRepository.findOne({
      where: { idPeriodo: idPeriodoB }
    });  

    if (!periodoB) {
      throw new NotFoundException(`Periodo con id "${idPeriodoB}" no encontrado`);
    }

    // =========================================================
    // TARIFAS PERIODO A
    // =========================================================

    const tarifasA = await this.tarifasService.searchTarifaByPeriodo(idPeriodoA);

    // =========================================================
    // TARIFAS PERIODO B
    // =========================================================
  
    const tarifasB = await this.tarifasService.searchTarifaByPeriodo(idPeriodoB);

    // =========================================================
    // MAPAS DE SERVICIOS
    // =========================================================
  
    const serviciosPeriodoA = new Map();
    const serviciosPeriodoB = new Map();
  
    // =========================================================
    // CONSTRUIR MAPA A
    // =========================================================
  
    for (const tarifa of tarifasA) {
  
      const idServicio = tarifa.idServicio.idServicio;
  
      const ordenesUnicas = new Set<number>();
  
      for (const ordenServicioTarifa of tarifa.ordenesServicio) {
  
        if (ordenServicioTarifa.idOrdenServicio) {
  
          ordenesUnicas.add(
            ordenServicioTarifa.idOrdenServicio.idOrdenServicio
          );
  
        }
  
      }
  
      serviciosPeriodoA.set(idServicio, {
        idServicio: tarifa.idServicio.idServicio,
        nombreServicio: tarifa.idServicio.descripcion,
        idTarifa: tarifa.idTarifa,
        precio: Number(tarifa.precioTotal),
        cantidadOrdenes: ordenesUnicas.size,
        tarifa,
      });
  
    }
  
    // =========================================================
    // CONSTRUIR MAPA B
    // =========================================================
  
    for (const tarifa of tarifasB) {
  
      const idServicio = tarifa.idServicio.idServicio;
  
      const ordenesUnicas = new Set<number>();
  
      for (const ordenServicioTarifa of tarifa.ordenesServicio) {
  
        if (ordenServicioTarifa.idOrdenServicio) {
  
          ordenesUnicas.add(
            ordenServicioTarifa.idOrdenServicio.idOrdenServicio
          );
  
        }
  
      }
  
      serviciosPeriodoB.set(idServicio, {
        idServicio: tarifa.idServicio.idServicio,
        nombreServicio: tarifa.idServicio.descripcion,
        idTarifa: tarifa.idTarifa,
        precio: Number(tarifa.precioTotal),
        cantidadOrdenes: ordenesUnicas.size,
        tarifa,
      });
  
    }

    // =========================================================
    // SERVICIOS NUEVOS
    // =========================================================
  
    const serviciosNuevos = [];
  
    for (const [idServicio, servicioB] of serviciosPeriodoB) {
  
      if (!serviciosPeriodoA.has(idServicio)) {
  
        serviciosNuevos.push({
          idServicio: servicioB.idServicio,
          nombreServicio: servicioB.nombreServicio,
          precio: servicioB.precio,
          cantidadOrdenes: servicioB.cantidadOrdenes,
        });
  
      }
  
    }

    // =========================================================
    // SERVICIOS ELIMINADOS
    // =========================================================
  
    const serviciosEliminados = [];
  
    for (const [idServicio, servicioA] of serviciosPeriodoA) {
  
      if (!serviciosPeriodoB.has(idServicio)) {
  
        serviciosEliminados.push({
          idServicio: servicioA.idServicio,
          nombreServicio: servicioA.nombreServicio,
          precio: servicioA.precio,
          cantidadOrdenes: servicioA.cantidadOrdenes,
        });
  
      }
  
    }

    // =========================================================
    // CAMBIO DE PRECIOS
    // =========================================================
  
    const serviciosConCambioPrecio = [];
  
    for (const [idServicio, servicioA] of serviciosPeriodoA) {
  
      const servicioB = serviciosPeriodoB.get(idServicio);
  
      if (!servicioB) continue;
  
      if (
        Number(servicioA.precio) !==
        Number(servicioB.precio)
      ) {
  
        serviciosConCambioPrecio.push({
          idServicio,
          nombreServicio: servicioA.nombreServicio,
          precioAnterior: servicioA.precio,
          precioNuevo: servicioB.precio,
          diferencia:
            Number(servicioB.precio) -
            Number(servicioA.precio),
        });
  
      }
  
    }
  
    // =========================================================
    // ORDENES POR SERVICIO
    // =========================================================
  
    const ordenesPorServicio = [];
  
    for (const [idServicio, servicioA] of serviciosPeriodoA) {
  
      const servicioB = serviciosPeriodoB.get(idServicio);
  
      ordenesPorServicio.push({
        idServicio,
        nombreServicio: servicioA.nombreServicio,
        periodoA: {
          cantidadOrdenes: servicioA.cantidadOrdenes,
        },
        periodoB: {
          cantidadOrdenes: servicioB
            ? servicioB.cantidadOrdenes
            : 0,
        },
        diferencia:
          (servicioB
            ? servicioB.cantidadOrdenes
            : 0) - servicioA.cantidadOrdenes,
      });
  
    }
  
    // =========================================================
    // SERVICIOS QUE SOLO EXISTEN EN B
    // =========================================================
  
    for (const [idServicio, servicioB] of serviciosPeriodoB) {
  
      if (!serviciosPeriodoA.has(idServicio)) {
  
        ordenesPorServicio.push({
          idServicio,
          nombreServicio: servicioB.nombreServicio,
          periodoA: {
            cantidadOrdenes: 0,
          },
          periodoB: {
            cantidadOrdenes: servicioB.cantidadOrdenes,
          },
          diferencia: servicioB.cantidadOrdenes,
        });
  
      }
  
    }
  
    // =========================================================
    // TOTALES FINANCIEROS
    // =========================================================
  
    const valorTotalPeriodoA = tarifasA.reduce(
      (acc, tarifa) => acc + Number(tarifa.precioTotal),
      0
    );
  
    const valorTotalPeriodoB = tarifasB.reduce(
      (acc, tarifa) => acc + Number(tarifa.precioTotal),
      0
    );

    // =========================================================
    // RESPUESTA
    // =========================================================
  
    return {
  
      periodoA: {
        idPeriodo: periodoA.idPeriodo,
        nombre: periodoA.nombre,
        fechaInicio: periodoA.fechaInicio,
        fechaFin: periodoA.fechaFin,
      },
  
      periodoB: {
        idPeriodo: periodoB.idPeriodo,
        nombre: periodoB.nombre,
        fechaInicio: periodoB.fechaInicio,
        fechaFin: periodoB.fechaFin,
      },
  
      resumen: {
  
        cantidadServicios: {
          periodoA: serviciosPeriodoA.size,
          periodoB: serviciosPeriodoB.size,
          diferencia:
            serviciosPeriodoB.size -
            serviciosPeriodoA.size,
        },
  
        valorTotalTarifas: {
          periodoA: valorTotalPeriodoA,
          periodoB: valorTotalPeriodoB,
          diferencia:
            valorTotalPeriodoB -
            valorTotalPeriodoA,
        },
  
      },
  
      comparativa: {
  
        serviciosNuevos,
  
        serviciosEliminados,
  
        serviciosConCambioPrecio,
  
        ordenesPorServicio,
  
      },
  
    };
  
  }

  async create(createPeriodoDto: CreatePeriodoDto) {
    
    // FECHA INICIO
    
    const fechaInicioSplit = createPeriodoDto.fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);

    const nombreMesInicio = Meses[mesInicio - 1].nombre;
    
    const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
    
    // FECHA FIN

    const fechaFinSplit = createPeriodoDto.fechaFin.toISOString().split('T')[0];

    const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);

    const nombreMesFin = Meses[mesFin - 1].nombre;
    
    const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
    
    // VALIDAR PERIODOS 

    await this.validarPeriodo(fechaInicio, fechaFin);
    
    // NOMBRE PERIODO
    const nombrePeriodo = `${nombreMesInicio} ${diaInicio} de ${añoInicio} a ${nombreMesFin} ${diaFin} de ${añoFin}`;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Crear periodo
      const periodo = queryRunner.manager.create(Periodo, {
          nombre: nombrePeriodo,
          mesInicio: mesInicio,
          anioInicio: añoInicio,
          mesFin: mesFin,
          anioFin: añoFin,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
      });

      const savedPeriodo = await queryRunner.manager.save(Periodo, periodo);
     
      // Validacion si el periodo a crear sera el que estara activo para facturacion
      if (createPeriodoDto.periodoActivoFacturacion == true){

        await queryRunner.manager.update(
          Periodo,
          {periodoActivoFacturacion: true},
          {periodoActivoFacturacion: false}
        );

        await queryRunner.manager.update(
          Periodo,
          {idPeriodo: savedPeriodo.idPeriodo},
          {periodoActivoFacturacion: true}
        );
  
      }

      // NOTIFICAR CREACION DE PERIODO
      await this.notificationEmail(
        nombrePeriodo,
        fechaInicio.toISOString().split('T')[0],
        fechaFin.toISOString().split('T')[0]
      )

      await queryRunner.commitTransaction();

      return await this.periodoRepository.findOne({
        where: {
          idPeriodo: savedPeriodo.idPeriodo
        }
      })

    } catch (error) {
      
      await queryRunner.rollbackTransaction();

      throw error;

      // this.handleDbExceptions(error);

    } finally {

      await queryRunner.release();

    }

  }

  private async validarPeriodo(fechaInicio: Date, fechaFin: Date, idPeriodoExcluir?: number){

    // Validar que el período sea lógicamente correcto
    if (fechaInicio >= fechaFin) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar solapamientos
    let query = this.periodoRepository
      .createQueryBuilder('periodo')
      .where('periodo.estado = :estado', { estado: true })
      .andWhere(
        `(
          (:fechaInicio BETWEEN periodo.fechaInicio AND periodo.fechaFin) OR
          (:fechaFin BETWEEN periodo.fechaInicio AND periodo.fechaFin) OR
          (:fechaInicio <= periodo.fechaInicio AND :fechaFin >= periodo.fechaFin)
        )`,
        { fechaInicio, fechaFin }
      );

    // Excluir el periodo que se está actualizando
    if (idPeriodoExcluir) {
      query = query.andWhere('periodo.idPeriodo != :idPeriodoExcluir', { idPeriodoExcluir });
    }

    const periodosSolapados = await query.getMany();

    if (periodosSolapados.length > 0) {
      throw new BadRequestException(`El período se solapa con: ${periodosSolapados.map(p => p.nombre).join(', ')}`);
    }

  }

  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [periodos, total] = await this.periodoRepository.findAndCount({
        take: limit,
        skip: offset,
        order: {
            fechaInicio: 'DESC'
        },
      });

      return {
        data: periodos,
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
  
    const periodos = await this.periodoRepository.find({
      order: {
          fechaInicio: 'DESC'
      },
    });

    return {
      data: periodos,
      pagination: {
          total: periodos.length,
          limit: periodos.length,
          offset: 0,
          page: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
      }
    };

  }

  async findOne(id: number) {
    
    const periodo = await this.periodoRepository.findOne({
      where: { 
          idPeriodo: id, 
      },
    });
  
    if (!periodo) {
        throw new NotFoundException(`Periodo con id "${id}" no encontrada`);
    }
    
    return periodo;
  
  }

  async update(id: number, updatePeriodoDto: UpdatePeriodoDto) {

    const periodoExistente = await this.findOne(id);

    // FECHA INICIO
    
    const fechaInicioSplit = updatePeriodoDto.fechaInicio.toISOString().split('T')[0];

    const [añoInicio, mesInicio, diaInicio] = fechaInicioSplit.split('-').map(Number);

    const nombreMesInicio = Meses[mesInicio - 1].nombre;
    
    const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
    
    // FECHA FIN

    const fechaFinSplit = updatePeriodoDto.fechaFin.toISOString().split('T')[0];

    const [añoFin, mesFin, diaFin] = fechaFinSplit.split('-').map(Number);

    const nombreMesFin = Meses[mesFin - 1].nombre;
    
    const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
    
    // VALIDAR PERIODOS 
    
    await this.validarPeriodo(fechaInicio, fechaFin, id);
        
    // NOMBRE PERIODO
    const nombrePeriodo = `${nombreMesInicio} ${diaInicio} de ${añoInicio} a ${nombreMesFin} ${diaFin} de ${añoFin}`;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Crear periodo
      const periodo = await queryRunner.manager.update(Periodo, 
        {idPeriodo: id},
        {
          nombre: nombrePeriodo,
          mesInicio: mesInicio,
          anioInicio: añoInicio,
          mesFin: mesFin,
          anioFin: añoFin,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
      });
     
      // Validacion si el periodo a crear sera el que estara activo para facturacion
      if (updatePeriodoDto.periodoActivoFacturacion == true){

        await queryRunner.manager.update(
          Periodo,
          {periodoActivoFacturacion: true},
          {periodoActivoFacturacion: false}
        );

        await queryRunner.manager.update(
          Periodo,
          {idPeriodo: id},
          {periodoActivoFacturacion: true}
        );
  
      }

      await queryRunner.commitTransaction();

      return await this.periodoRepository.findOne({
        where: {
          idPeriodo: id
        }
      })

    } catch (error) {
      
      await queryRunner.rollbackTransaction();

      throw error;

    } finally {

      await queryRunner.release();

    }

  }

  async obtenerPeriodoActivo() {

    return await this.periodoRepository.findOne({
      where: { 
        periodoActivoFacturacion: true,
        estado: true 
      }
    });

  }

  async remove(id: number) {

    const periodo = await this.findOne(id);
        
    try {

      await this.periodoRepository.remove(periodo);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Periodo ${periodo.nombre} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  // ELIMINAR TODOS LOS PERIODO
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA PERIODO
  async deleteAllPeriodo(){
  
    const query = this.periodoRepository.createQueryBuilder('periodo');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ENVIAR CORREO PARA INFORMAR CREACION DE PERIODO
  private async notificationEmail(
    nombrePeriodo: string, 
    fechaInicio: string,
    fechaFin: string
  ) {        

    const html = `
    <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Poppins', Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 25px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Encabezado -->
        <div style="background: linear-gradient(135deg, #003366, #0055a5); padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">CREACION PERIODO DE FACTURACION</h2>
        </div>
        
        <!-- Cuerpo -->
        <div style="padding: 25px; text-align: center;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Buen día, se ha creado un nuevo periodo de facturacion. <br><br>
            📝 Nombre periodo: ${nombrePeriodo} <br><br>
            📅 Fecha inicio periodo: ${fechaInicio} <br><br>
            📅 Fecha fin periodo: ${fechaFin}
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

    const subject = `NOTIFICACIONES VIDELCA (GEVID 👮‍♂️): creacion periodo de facturacion`;

    const emails = await this.correoDefaultService.findAllByEstadoApp(EstadoAppInterface.CREACION_PERIODO);

    // VALORES REQUERIDOS PARA ENVIAR UN EMAIL
    const options: SendMailOptions = {
        to: emails,
        subject: subject,
        htmlBody: html
    }

    // Enviamos correo para notificar al usuario
    const isEmailSend = await this.emailService.sendEmail(options);

    if (!isEmailSend){
        throw new InternalServerErrorException(`Error al enviar correo de notificacion a los emails ${emails}, revisar correo si esta bien escrito`);
    }

  }

  private handleDbExceptions(error: any){
  
    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear periodos duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

}
