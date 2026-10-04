import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { InfoTile } from "../../../components/ui/common/InfoTile";
import { useProgramacionPersonal } from "../../../api/queryFunctions/programacion-personal";
import { useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  differenceInDays,
} from "date-fns";
import { addWeeks, subWeeks } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { useTipoPersonal } from "../../../api/queryFunctions/configuracion";
import type { Event, PersonalAsignado } from "../../../api/types";
import { safeParseDate } from "../../../utils/DateUtils";
import { SimpleModal } from "../../../components/common/SimpleModal";

export const Route = createFileRoute("/dashboard/programaciones/")({
  component: RouteComponent,
});

// TODO: Agregar los tipos de programaciones en la base de datos y en este archivo
// NOTA: ya no existe relacion entre la programacion de personal y las ordenes de servicio
// (ver ProgramacionPersonalService.findAll en el backend), por lo que todos los eventos
// vienen de novedades del personal; no hay un tipo "asignado".
const eventTypes = {
  permiso: { label: "Permiso", color: "warning.main" },
  vacaciones: { label: "Vacaciones", color: "error.main" },
  incapacidad: { label: "Incapacidad", color: "primary.main" },
  default: { label: "Desconocido", color: "secondary.main" },
};
function RouteComponent() {
  const { data: programacionPersonalQuery } = useProgramacionPersonal();
  const { data: tipoPersonalQuery } = useTipoPersonal();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTipoPersonal, setSelectedTipoPersonal] = useState<number>(0);
  const [selectedEventDetails, setSelectedEventDetails] =
    useState<Event | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const extendedEnd = addDays(weekEnd, 7);
  const extendedDays = eachDayOfInterval({
    start: weekStart,
    end: extendedEnd,
  });

  const filteredPeople = useMemo(() => {
    return selectedTipoPersonal === 0
      ? programacionPersonalQuery?.data
      : programacionPersonalQuery?.data?.data.filter(
        (p) => p.idTipoPersonal === selectedTipoPersonal,
      );
  }, [programacionPersonalQuery?.data, selectedTipoPersonal]);

  const getUniqueEventsForPerson = (personId: number) => {
    return programacionPersonalQuery?.data?.data.find(
      (event) => event.idPersonal === personId,
    );
  };

  const getEventPuesto = (event: Event, dayIndex: number) => {
    const eventStartDate = safeParseDate(event.fechaInicioEvento);
    const eventEndDate = safeParseDate(event.fechaFinEvento);

    const eventStartIndex = Math.max(
      0,
      differenceInDays(eventStartDate, weekStart),
    );
    const eventEndIndex = Math.min(
      extendedDays.length - 1,
      differenceInDays(eventEndDate, weekStart),
    );

    // Calculate the width based on how many days the event spans within the visible calendar
    const eventDuration = eventEndIndex - eventStartIndex + 1;

    // Calculate the remaining width from the current day to the end of the event
    const remainingDays = eventEndIndex - dayIndex + 1;
    const widthFromCurrentDay = Math.max(0, remainingDays);

    return {
      shouldShow:
        dayIndex === eventStartIndex &&
        eventStartIndex <= extendedDays.length - 1,
      width: widthFromCurrentDay,
      isMultiDay: differenceInDays(eventEndDate, eventStartDate) > 0,
      totalEventDays: eventDuration,
    };
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpenModal(true);
    setSelectedEventDetails(event);
  };

  const selectedType =
    eventTypes[selectedEventDetails?.tipoEvento as keyof typeof eventTypes] ||
    eventTypes.default;

  return (
    <div className="flex flex-col gap-4">
      {/* Leyenda de colores */}
      <Paper variant="outlined" className="p-4">
        <Typography variant="h6" component="h3" sx={{ mb: 1.5 }}>
          Tipos de Actividades del Equipo
        </Typography>
        <div className="flex flex-wrap gap-4">
          {Object.entries(eventTypes).map(([key, type]) => (
            <div key={key} className="flex items-center gap-2">
              <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: type.color }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {type.label}
              </Typography>
            </div>
          ))}
        </div>
      </Paper>
      {/* Controles superiores */}
      <Paper variant="outlined" className="p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Tooltip title="Semana anterior">
              <IconButton onClick={goToPreviousWeek} sx={{ border: 1, borderColor: "divider" }}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Semana siguiente">
              <IconButton onClick={goToNextWeek} sx={{ border: 1, borderColor: "divider" }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" color="secondary" onClick={goToToday}>
              Hoy
            </Button>
            <Typography variant="h4" component="p" sx={{ ml: 1 }}>
              {format(weekStart, "dd MMM", { locale: es })} -{" "}
              {format(extendedEnd, "dd MMM yyyy", { locale: es })}
            </Typography>
          </div>

          <TextField
            select
            value={selectedTipoPersonal}
            onChange={(e) => setSelectedTipoPersonal(Number(e.target.value))}
            fullWidth={false}
            sx={{ width: 220 }}
          >
            <MenuItem value={0}>Todo el personal</MenuItem>
            {tipoPersonalQuery?.data?.data?.map((tipo) => (
              <MenuItem key={tipo.idTipoPersonal} value={tipo.idTipoPersonal}>
                {tipo.descripcion}
              </MenuItem>
            ))}
          </TextField>
        </div>
      </Paper>

      {/* Calendario principal */}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <div className="min-w-[1200px] overflow-x-hidden">
            {/* Encabezado de días */}
            <Box
              className="grid grid-cols-[280px_1fr]"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Box
                className="flex items-center gap-2 p-4"
                sx={{ borderRight: 1, borderColor: "divider" }}
              >
                <GroupsOutlinedIcon fontSize="small" />
                <Typography variant="h6" component="span">
                  Personal
                </Typography>
              </Box>
              <div className="grid grid-cols-14 gap-0">
                {extendedDays.map((day, index) => {
                  const isToday =
                    format(day, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd");
                  return (
                    <Box
                      key={index}
                      className="flex flex-col p-3 text-center"
                      sx={{
                        borderRight: 1,
                        borderColor: "divider",
                        "&:last-of-type": { borderRight: 0 },
                        bgcolor: isToday ? "primary.main" : "background.default",
                        color: isToday ? "primary.contrastText" : "text.primary",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        {format(day, "EEE", { locale: es })}
                      </Typography>
                      <Typography variant="h4" component="span">
                        {format(day, "dd")}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        {format(day, "MM-yy")}
                      </Typography>
                    </Box>
                  );
                })}
              </div>
            </Box>

            {/* Filas de personas */}
            {filteredPeople?.data?.map((person) => (
              <Box
                key={person.idPersonal}
                className="grid grid-cols-[280px_1fr]"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box className="p-4" sx={{ borderRight: 1, borderColor: "divider" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {person.nombreCompleto}
                  </Typography>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {person.tipoPersonal}
                    </Typography>
                    <Chip size="small" variant="outlined" label={person.numeroIdentificacion} />
                  </div>
                </Box>
                <div className="relative grid grid-cols-14 gap-0">
                  {extendedDays.map((day, dayIndex) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <Box
                        key={dayIndex}
                        className="relative min-h-[100px] pt-2 pr-2"
                        sx={{
                          borderRight: 1,
                          borderColor: "divider",
                          "&:last-of-type": { borderRight: 0 },
                          bgcolor: isWeekend ? "background.default" : "transparent",
                        }}
                        id={`day-${dayIndex}`}
                      >
                        {getUniqueEventsForPerson(
                          person.idPersonal,
                        )?.eventos?.map((event) => {
                          const eventType =
                            eventTypes[
                            event.tipoEvento as keyof typeof eventTypes
                            ] || eventTypes.default;
                          const puesto = getEventPuesto(event, dayIndex);

                          if (!puesto.shouldShow) return null;

                          const eventStartDate = safeParseDate(
                            event.fechaInicioEvento,
                          );
                          const eventEndDate = safeParseDate(
                            event.fechaFinEvento,
                          );

                          const isFirstDay =
                            dayIndex ===
                            Math.max(
                              0,
                              differenceInDays(eventStartDate, weekStart),
                            );
                          const isLastDay =
                            dayIndex ===
                            Math.min(
                              extendedDays.length - 1,
                              differenceInDays(eventEndDate, weekStart),
                            );
                          return (
                            <Box
                              key={event.idEvento}
                              className="relative mb-1 cursor-pointer"
                              sx={{
                                bgcolor: eventType.color,
                                color: "common.white",
                                width: puesto.isMultiDay
                                  ? `calc(${puesto.width * 100}% + ${(puesto.width - 1) * 11}px)`
                                  : "100%",
                                zIndex: 10,
                                borderRadius: puesto.isMultiDay
                                  ? isFirstDay && isLastDay
                                    ? "6px"
                                    : isFirstDay
                                      ? "6px 0 0 6px"
                                      : isLastDay
                                        ? "0 6px 6px 0"
                                        : "0"
                                  : "6px",
                                height: 36,
                                display: eventEndDate > day ? "flex" : "none",
                                alignItems: "center",
                                px: 1,
                                boxShadow: 1,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleEventClick(event, e);
                              }}
                            >
                              <div className="flex w-full items-center gap-1 truncate">
                                {isFirstDay && puesto.isMultiDay && (
                                  <CalendarMonthOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                                )}
                                <Typography variant="caption" noWrap sx={{ fontWeight: 600 }}>
                                  {event.tituloEvento}
                                </Typography>
                                {puesto.isMultiDay && isFirstDay && (
                                  <Typography
                                    variant="caption"
                                    sx={{ ml: "auto", flexShrink: 0, opacity: 0.75 }}
                                  >
                                    (
                                    {eventEndDate.getDate() -
                                      eventStartDate.getDate()}
                                    d)
                                  </Typography>
                                )}
                              </div>
                              {!puesto.isMultiDay && (
                                <Typography
                                  variant="caption"
                                  noWrap
                                  className="absolute right-1 -bottom-1 left-1"
                                  sx={{ fontSize: 10, opacity: 0.75 }}
                                >
                                  {event.horaInicioEvento}-{event.horaFinEvento}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </div>
              </Box>
            ))}
          </div>
        </div>
      </Paper>

      <SimpleModal
        isOpen={isOpenModal}
        onClose={() => {
          setIsOpenModal(false);
          setSelectedEventDetails(null);
        }}
        title="Detalles del Evento"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: selectedType.color }} />
            <Typography variant="h4" component="p">
              {selectedEventDetails?.tituloEvento}
            </Typography>
            <Chip size="small" label={selectedType.label} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoTile
              icon={<ScheduleOutlinedIcon fontSize="small" />}
              value={format(
                safeParseDate(selectedEventDetails?.fechaInicioEvento),
                "EEEE, dd 'de' MMMM 'de' yyyy",
                { locale: es },
              )}
              label={`Fecha de Inicio · Hora: ${selectedEventDetails?.horaInicioEvento ?? ""}`}
            />
            <InfoTile
              icon={<ScheduleOutlinedIcon fontSize="small" />}
              value={format(
                safeParseDate(selectedEventDetails?.fechaFinEvento),
                "EEEE, dd 'de' MMMM 'de' yyyy",
                { locale: es },
              )}
              label={`Fecha de Fin · Hora: ${selectedEventDetails?.horaFinEvento ?? ""}`}
            />
          </div>

          <InfoTile
            value={`${differenceInDays(
              safeParseDate(selectedEventDetails?.fechaFinEvento),
              safeParseDate(selectedEventDetails?.fechaInicioEvento),
            )} día(s)`}
            label="Duración"
          />
        </div>
      </SimpleModal>
    </div>
  );
}
