import { Controller, Get, Query } from "@nestjs/common";
import { ProgramacionPersonalService } from "../services/programacion-personal.service";
import { DescriptionRoutes } from "src/auth/interfaces/description-routes.interface";
import { AppAuth } from "src/auth/decorators/app-auth.decorator";
import { PaginationDto } from "src/common/dto";

@Controller('programacion-personal')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ProgramacionPersonalController {

  constructor(private readonly programacionPersonalService: ProgramacionPersonalService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.programacionPersonalService.findAll(paginationDto, paginationDto.pagination);
  }

}
