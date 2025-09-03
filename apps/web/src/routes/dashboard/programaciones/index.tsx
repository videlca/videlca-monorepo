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

export const Route = createFileRoute("/dashboard/programaciones/")({
  component: RouteComponent,
});

interface Event {
  id: string;
  title: string;
  type: "asignado" | "permiso" | "vacaciones" | "incapacitado";
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  personId: string;
  description?: string;
}

// TODO: Agregar los tipos de programaciones en la base de datos y en este archivo
const eventTypes = {
  asignado: {
    label: "Asignado",
    color: "bg-purple-500",
    textColor: "text-white",
  },
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
  incapacitado: {
    label: "Incapacitado",
    color: "bg-blue-500",
    textColor: "text-white",
  },
};

function RouteComponent() {
  const { data: programacionPersonalQuery } = useProgramacionPersonal();
  const { data: tipoPersonalQuery } = useTipoPersonal();

  const personalAsignado =
    programacionPersonalQuery?.data?.map((item) => ({
      id: item.idPersonal.idPersonal,
      name: item.idPersonal.primerNombre + " " + item.idPersonal.primerApellido,
      department: item.idPersonal.idTipoPersonal.descripcion,
      code: item.idPersonal.numeroIdentificacion,
      idTipoPersonal: item.idPersonal.idTipoPersonal.idTipoPersonal,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin,
    })) || [];

  const [currentWeek, setCurrentWeek] = useState(new Date());
  // TODO: Eliminar este mock, se debe traer de la base de datos las programaciones
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Evento 1",
      type: "asignado",
      startDate: new Date("2025-09-02"),
      endDate: new Date("2025-09-20"),
      startTime: "08:00",
      endTime: "17:00",
      personId: "3",
    },
    {
      id: "2",
      title: "Evento 2",
      type: "vacaciones",
      startDate: new Date("2025-09-20"),
      endDate: new Date("2025-09-28"),
      startTime: "00:00",
      endTime: "23:00",
      personId: "3",
    },
    {
      id: "3",
      title: "Evento 3",
      type: "asignado",
      startDate: new Date("2025-09-02"),
      endDate: new Date("2025-09-03"),
      startTime: "08:00",
      endTime: "17:00",
      personId: "4",
    },
  ]);
  const [selectedTipoPersonal, setSelectedTipoPersonal] = useState<number>(0);
  const [selectedEventDetails, setSelectedEventDetails] =
    useState<Event | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const extendedEnd = addDays(weekEnd, 7);
  const extendedDays = eachDayOfInterval({
    start: weekStart,
    end: extendedEnd,
  });

  const filteredPeople = useMemo(() => {
    return selectedTipoPersonal === 0
      ? personalAsignado
      : personalAsignado?.filter(
          (p) => p.idTipoPersonal === selectedTipoPersonal,
        );
  }, [personalAsignado, selectedTipoPersonal]);

  const getUniqueEventsForPerson = (personId: number) => {
    return events.filter(
      (event) =>
        event.personId === personId.toString() &&
        event.startDate <= extendedEnd &&
        event.endDate >= weekStart,
    );
  };

  const getEventPosition = (event: Event, dayIndex: number) => {
    const eventStartIndex = Math.max(
      0,
      differenceInDays(event.startDate, weekStart),
    );
    const eventEndIndex = Math.min(
      extendedDays.length - 1,
      differenceInDays(event.endDate, weekStart),
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
      isMultiDay: differenceInDays(event.endDate, event.startDate) > 0,
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
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              <Users className="mr-1 h-3 w-3" />
              {filteredPeople.length} miembros
            </span>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTipoPersonal}
              onChange={(e) => setSelectedTipoPersonal(Number(e.target.value))}
              className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="0">Todo el equipo</option>
              {tipoPersonalQuery?.data?.map((tipo) => (
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
          <div className="min-w-[1200px]">
            {/* Encabezado de días */}
            <div className="grid grid-cols-[280px_1fr] border-b border-gray-300">
              <div className="border-r border-gray-300 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4" />
                  Miembros del Equipo
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
                      className={`border-r border-gray-300 p-3 text-center text-white last:border-r-0 ${
                        isToday ? "bg-blue-600" : "bg-gray-50"
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
            {filteredPeople?.map((person, personIndex) => (
              <div
                key={person.idTipoPersonal}
                className={`grid grid-cols-[280px_1fr] border-b border-gray-200 hover:bg-gray-50 ${
                  personIndex % 2 === 0 ? "bg-white" : "bg-gray-25"
                }`}
              >
                <div className="border-r border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {person.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                    <span className="font-medium">{person.department}</span>
                    <span className="inline-flex items-center rounded-md border bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {person.code}
                    </span>
                  </div>
                </div>
                <div className="relative grid grid-cols-14 gap-0">
                  {extendedDays.map((day, dayIndex) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={dayIndex}
                        className={`relative min-h-[100px] border-r border-gray-200 p-2 last:border-r-0 ${
                          isWeekend ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        {getUniqueEventsForPerson(person.id).map((event) => {
                          const eventType =
                            eventTypes[event.type as keyof typeof eventTypes];
                          const position = getEventPosition(event, dayIndex);

                          if (!position.shouldShow) return null;

                          const isFirstDay =
                            dayIndex ===
                            Math.max(
                              0,
                              differenceInDays(event.startDate, weekStart),
                            );
                          const isLastDay =
                            dayIndex ===
                            Math.min(
                              extendedDays.length - 1,
                              differenceInDays(event.endDate, weekStart),
                            );

                          return (
                            <div
                              key={event.id}
                              className={`${eventType.color} ${eventType.textColor} relative mb-1 cursor-pointer transition-all ${
                                position.isMultiDay ? "font-medium" : ""
                              }`}
                              style={{
                                width: position.isMultiDay
                                  ? `calc(${position.width * 100}% + ${(position.width - 1) * 2}px)`
                                  : "100%",
                                zIndex: 10,
                                borderRadius: position.isMultiDay
                                  ? isFirstDay && isLastDay
                                    ? "6px"
                                    : isFirstDay
                                      ? "6px 0 0 6px"
                                      : isLastDay
                                        ? "0 6px 6px 0"
                                        : "0"
                                  : "6px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                padding: "0 8px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid rgba(255,255,255,0.2)",
                              }}
                              onClick={(e) => handleEventClick(event, e)}
                            >
                              <div className="flex w-full items-center gap-1 truncate">
                                {isFirstDay && position.isMultiDay && (
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                )}
                                <span className="truncate text-xs font-semibold">
                                  {event.title}
                                </span>
                                {position.isMultiDay && isFirstDay && (
                                  <span className="ml-auto flex-shrink-0 text-xs opacity-75">
                                    ({position.totalEventDays}d)
                                  </span>
                                )}
                              </div>
                              {!position.isMultiDay && (
                                <div className="absolute right-1 -bottom-1 left-1 truncate text-[10px] opacity-75">
                                  {event.startTime}-{event.endTime}
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

      {/* Modal para detalles del evento */}
      {selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="bg-opacity-50 fixed inset-0 bg-black"
            onClick={() => setSelectedEventDetails(null)}
          ></div>
          <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-lg">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5" />
                  Detalles del Evento
                </h2>
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded ${eventTypes[selectedEventDetails.type as keyof typeof eventTypes].color}`}
                  ></div>
                  <span className="text-lg font-semibold">
                    {selectedEventDetails.title}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {
                      eventTypes[
                        selectedEventDetails.type as keyof typeof eventTypes
                      ].label
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
                        selectedEventDetails.startDate,
                        "EEEE, dd 'de' MMMM 'de' yyyy",
                        { locale: es },
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        Hora: {selectedEventDetails.startTime}
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
                        selectedEventDetails.endDate,
                        "EEEE, dd 'de' MMMM 'de' yyyy",
                        { locale: es },
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        Hora: {selectedEventDetails.endTime}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duración</label>
                  <div className="rounded bg-gray-50 p-2 text-sm">
                    {differenceInDays(
                      selectedEventDetails.endDate,
                      selectedEventDetails.startDate,
                    ) + 1}{" "}
                    día(s)
                  </div>
                </div>

                {selectedEventDetails.description && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción</label>
                    <div className="rounded bg-gray-50 p-2 text-sm">
                      {selectedEventDetails.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
