import { createFileRoute } from "@tanstack/react-router";
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
import {
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
} from "lucide-react";
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
  permiso: {
    label: "Permiso",
    color: "bg-yellow-500",
    textColor: "text-white",
  },
  vacaciones: {
    label: "Vacaciones",
    color: "bg-red-500",
    textColor: "text-white",
  },
  incapacidad: {
    label: "Incapacidad",
    color: "bg-blue-500",
    textColor: "text-white",
  },
  default: {
    label: "Desconocido",
    color: "bg-gray-500",
    textColor: "text-white",
  },
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

  return (
    <div className="space-y-4">
      {/* Leyenda de colores */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">
          Tipos de Actividades del Equipo
        </h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(eventTypes).map(([key, type]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-md ${type.color} shadow-sm`}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Controles superiores */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNextWeek}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Hoy
            </button>
            <div className="text-lg font-semibold">
              {format(weekStart, "dd MMM", { locale: es })} -{" "}
              {format(extendedEnd, "dd MMM yyyy", { locale: es })}
            </div>
            {/* <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              <Users className="mr-1 h-3 w-3" />
              {filteredPeople?.data?.length} personal
            </span> */}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTipoPersonal}
              onChange={(e) => setSelectedTipoPersonal(Number(e.target.value))}
              className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="0">Todo el personal</option>
              {tipoPersonalQuery?.data?.data?.map((tipo) => (
                <option key={tipo.idTipoPersonal} value={tipo.idTipoPersonal}>
                  {tipo.descripcion}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendario principal */}
      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px] overflow-x-hidden">
            {/* Encabezado de días */}
            <div className="grid grid-cols-[280px_1fr] border-b border-gray-300">
              <div className="border-r border-gray-300 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4" />
                  Personal
                </div>
              </div>
              <div className="grid grid-cols-14 gap-0">
                {extendedDays.map((day, index) => {
                  const isToday =
                    format(day, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={index}
                      className={`border-r border-gray-300 p-3 text-center text-white last:border-r-0 ${isToday ? "bg-blue-600" : "bg-gray-50"
                        }`}
                    >
                      <div className="text-xs font-medium tracking-wide uppercase">
                        {format(day, "EEE", { locale: es })}
                      </div>
                      <div
                        className={`text-lg font-bold ${isToday ? "text-white" : "text-gray-900"}`}
                      >
                        {format(day, "dd")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(day, "MM-yy")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filas de personas */}
            {filteredPeople?.data?.map((person, personIndex) => (
              <div
                key={person.idPersonal}
                className={`grid grid-cols-[280px_1fr] border-b border-gray-200 hover:bg-gray-50 ${personIndex % 2 === 0 ? "bg-white" : "bg-gray-25"
                  }`}
              >
                <div className="border-r border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {person.nombreCompleto}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                    <span className="font-medium">{person.tipoPersonal}</span>
                    <span className="inline-flex items-center rounded-md border bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {person.numeroIdentificacion}
                    </span>
                  </div>
                </div>
                <div className="relative grid grid-cols-14 gap-0">
                  {extendedDays.map((day, dayIndex) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={dayIndex}
                        className={`relative min-h-[100px] border-r border-gray-200 pt-2 pr-2 *:space-y-2 last:border-r-0 ${isWeekend ? "bg-gray-50" : "bg-white"
                          }`}
                        id={`day-${dayIndex}`}
                      >
                        {getUniqueEventsForPerson(
                          person.idPersonal,
                        )?.eventos?.map((event, eventIndex) => {
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
                            <div
                              key={event.idEvento}
                              className={`${eventType.color} ${eventType.textColor} relative mb-1 cursor-pointer transition-all ${puesto.isMultiDay ? "font-medium" : ""
                                }`}
                              style={{
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
                                height: "36px",
                                display: eventEndDate > day ? "flex" : "none",
                                alignItems: "center",
                                padding: "0 8px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                // marginTop: `${eventIndex * 20}px`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleEventClick(event, e);
                              }}
                            >
                              <div className="flex w-full items-center gap-1 truncate">
                                {isFirstDay && puesto.isMultiDay && (
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                )}
                                <span className="truncate text-xs font-semibold">
                                  {event.tituloEvento}
                                </span>
                                {puesto.isMultiDay && isFirstDay && (
                                  <span className="ml-auto flex-shrink-0 text-xs opacity-75">
                                    (
                                    {eventEndDate.getDate() -
                                      eventStartDate.getDate()}
                                    d)
                                  </span>
                                )}
                              </div>
                              {!puesto.isMultiDay && (
                                <div className="absolute right-1 -bottom-1 left-1 truncate text-[10px] opacity-75">
                                  {event.horaInicioEvento}-{event.horaFinEvento}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SimpleModal
        isOpen={isOpenModal}
        onClose={() => {
          setIsOpenModal(false);
          setSelectedEventDetails(null);
        }}
        title="Detalles del Evento"
      >
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded ${(eventTypes[selectedEventDetails?.tipoEvento as keyof typeof eventTypes] || eventTypes.default).color}`}
              ></div>
              <span className="text-lg font-semibold">
                {selectedEventDetails?.tituloEvento}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {
                  (
                    eventTypes[
                    selectedEventDetails?.tipoEvento as keyof typeof eventTypes
                    ] || eventTypes.default
                  ).label
                }
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Fecha de Inicio
                </label>
                <div className="rounded bg-gray-50 p-2 text-sm">
                  {format(
                    safeParseDate(selectedEventDetails?.fechaInicioEvento),
                    "EEEE, dd 'de' MMMM 'de' yyyy",
                    { locale: es },
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    Hora: {selectedEventDetails?.horaInicioEvento}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Fecha de Fin
                </label>
                <div className="rounded bg-gray-50 p-2 text-sm">
                  {format(
                    safeParseDate(selectedEventDetails?.fechaFinEvento),
                    "EEEE, dd 'de' MMMM 'de' yyyy",
                    { locale: es },
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    Hora: {selectedEventDetails?.horaFinEvento}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duración</label>
              <div className="rounded bg-gray-50 p-2 text-sm">
                {differenceInDays(
                  safeParseDate(selectedEventDetails?.fechaFinEvento),
                  safeParseDate(selectedEventDetails?.fechaInicioEvento),
                )}{" "}
                día(s)
              </div>
            </div>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
