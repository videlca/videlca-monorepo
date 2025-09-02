import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { useProgramacionPersonal } from "../../../api/queryFunctions/programacion-personal";
import Table from "../../../components/common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import type { ProgramacionPersonal } from "../../../api/types";
import { useMemo, useState } from "react";
import { dateFormat } from "../../../utils/DateFormat";
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
  Plus,
  X,
  Calendar,
  Clock,
  Edit2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/programaciones/")({
  component: RouteComponent,
});

interface Event {
  id: string;
  title: string;
  type:
    | "guardia"
    | "standby"
    | "vacaciones"
    | "formacion"
    | "reunion"
    | "personal";
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  personId: string;
  description?: string;
}

interface Person {
  id: string;
  name: string;
  code: string;
  department: string;
}

const eventTypes = {
  guardia: {
    label: "Guardia",
    color: "bg-purple-500",
    textColor: "text-white",
  },
  standby: { label: "Stand By", color: "bg-blue-500", textColor: "text-white" },
  vacaciones: {
    label: "Vacaciones",
    color: "bg-orange-500",
    textColor: "text-white",
  },
  formacion: {
    label: "Formación",
    color: "bg-green-500",
    textColor: "text-white",
  },
  reunion: { label: "Reunión", color: "bg-red-500", textColor: "text-white" },
  personal: {
    label: "Personal",
    color: "bg-gray-500",
    textColor: "text-white",
  },
};

const initialPeople: Person[] = [
  {
    id: "1",
    name: "Juan Carlos Meneses",
    code: "192h",
    department: "Operaciones",
  },
  { id: "2", name: "Vasco Céspedes", code: "176h", department: "Logística" },
  {
    id: "3",
    name: "Reyes Escudero",
    code: "152h",
    department: "Mantenimiento",
  },
  { id: "4", name: "Mario Castro", code: "173h", department: "Operaciones" },
  {
    id: "5",
    name: "Marleny Higuera",
    code: "224h",
    department: "Administración",
  },
  { id: "6", name: "Matarrita Arana", code: "217h", department: "Seguridad" },
  { id: "7", name: "José Vivas", code: "175h", department: "Operaciones" },
  { id: "8", name: "Cantillo Ruiz", code: "192h", department: "Logística" },
  {
    id: "9",
    name: "Hernández Mendoza",
    code: "223h",
    department: "Operaciones",
  },
  {
    id: "10",
    name: "Zelaya Christian",
    code: "237h",
    department: "Mantenimiento",
  },
  { id: "11", name: "Stevens Herman", code: "208h", department: "Seguridad" },
  {
    id: "12",
    name: "Rodríguez Ávila",
    code: "211h",
    department: "Administración",
  },
  { id: "13", name: "Flores López", code: "168h", department: "Logística" },
  {
    id: "14",
    name: "Guerra de Fuentes",
    code: "206h",
    department: "Operaciones",
  },
  {
    id: "15",
    name: "Alonzo Cardona",
    code: "205h",
    department: "Mantenimiento",
  },
];

const initialEvents: Event[] = [
  {
    id: "1",
    title: "Guardia Nocturna",
    type: "guardia",
    startDate: new Date(2025, 0, 15),
    endDate: new Date(2025, 0, 17),
    startTime: "22:00",
    endTime: "06:00",
    personId: "1",
  },
  {
    id: "2",
    title: "Vacaciones Anuales",
    type: "vacaciones",
    startDate: new Date(2025, 0, 20),
    endDate: new Date(2025, 0, 25),
    startTime: "00:00",
    endTime: "23:59",
    personId: "2",
  },
  {
    id: "3",
    title: "Stand By Fin de Semana",
    type: "standby",
    startDate: new Date(2025, 0, 18),
    endDate: new Date(2025, 0, 19),
    startTime: "08:00",
    endTime: "18:00",
    personId: "3",
  },
];

function RouteComponent() {
  const { data: programacionPersonalQuery } = useProgramacionPersonal();

  console.log(programacionPersonalQuery);

  // const columns: ColumnDef<ProgramacionPersonal>[] = [
  //   {
  //     header: "Id. Orden de Servicio",
  //     accessorKey: "idOrdenServicioTarifa",
  //   },
  //   {
  //     header: "Personal",
  //     accessorKey: "personal",
  //     cell: ({ row }) => {
  //       return (
  //         <span className="font-medium whitespace-nowrap text-gray-500">
  //           {row.original.idPersonal.primerNombre}{" "}
  //           {row.original.idPersonal.primerApellido}
  //         </span>
  //       );
  //     },
  //   },
  //   {
  //     header: "Hora Inicio",
  //     accessorKey: "horaInicio",
  //   },
  //   {
  //     header: "Hora Fin",
  //     accessorKey: "horaFin",
  //   },
  // ];

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedPerson, setSelectedPerson] = useState<string>("all");
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] =
    useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "guardia" as keyof typeof eventTypes,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "17:00",
    description: "",
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const extendedEnd = addDays(weekEnd, 7);
  const extendedDays = eachDayOfInterval({
    start: weekStart,
    end: extendedEnd,
  });

  const filteredPeople = useMemo(() => {
    return selectedPerson === "all"
      ? people
      : people.filter((p) => p.id === selectedPerson);
  }, [people, selectedPerson]);

  const getEventsForPersonAndDay = (personId: string, day: Date) => {
    return events.filter(
      (event) =>
        event.personId === personId &&
        day >= event.startDate &&
        day <= event.endDate,
    );
  };

  const getUniqueEventsForPerson = (personId: string) => {
    return events.filter(
      (event) =>
        event.personId === personId &&
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
      13,
      differenceInDays(event.endDate, weekStart),
    );
    const eventDuration = eventEndIndex - eventStartIndex + 1;

    return {
      shouldShow: dayIndex === eventStartIndex,
      width: eventDuration,
      isMultiDay: differenceInDays(event.endDate, event.startDate) > 0,
    };
  };

  const handleAddEvent = () => {
    if (!newEvent.title || selectedPerson === "all") return;

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      type: newEvent.type,
      startDate: new Date(newEvent.startDate),
      endDate: new Date(newEvent.endDate),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      personId: selectedPerson,
      description: newEvent.description,
    };

    setEvents([...events, event]);
    setNewEvent({
      title: "",
      type: "guardia",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      description: "",
    });
    setIsAddingEvent(false);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      type: event.type,
      startDate: format(event.startDate, "yyyy-MM-dd"),
      endDate: format(event.endDate, "yyyy-MM-dd"),
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.description || "",
    });
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;

    const updatedEvent: Event = {
      ...editingEvent,
      title: newEvent.title,
      type: newEvent.type,
      startDate: new Date(newEvent.startDate),
      endDate: new Date(newEvent.endDate),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      description: newEvent.description,
    };

    setEvents(events.map((e) => (e.id === editingEvent.id ? updatedEvent : e)));
    setEditingEvent(null);
    setNewEvent({
      title: "",
      type: "guardia",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      description: "",
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId));
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

  // return (
  //   // <Section>
  //   //   <Table data={programacionPersonalQuery?.data || []} columns={columns} />
  //   // </Section>

  // );

  return (
    <div className="space-y-4">
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
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">Todo el equipo</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} - {person.department}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsAddingEvent(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Programar Actividad
            </button>
          </div>
        </div>
      </div>

      {/* Calendario principal */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Encabezado de días */}
            <div className="grid grid-cols-[250px_1fr] border-b">
              <div className="border-r bg-gray-50 p-3 font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Miembros del Equipo
                </div>
              </div>
              <div className="grid grid-cols-14 gap-0">
                {extendedDays.map((day, index) => (
                  <div
                    key={index}
                    className="border-r bg-gray-50 p-2 text-center text-sm font-medium last:border-r-0"
                  >
                    <div>{format(day, "EEE", { locale: es })}</div>
                    <div className="text-xs text-gray-500">
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filas de personas */}
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="grid grid-cols-[250px_1fr] border-b hover:bg-gray-50"
              >
                <div className="border-r p-3">
                  <div className="text-sm font-medium">{person.name}</div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{person.department}</span>
                    <span className="inline-flex items-center rounded-md border bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                      {person.code}
                    </span>
                  </div>
                </div>
                <div className="relative grid grid-cols-14 gap-0">
                  {extendedDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="relative min-h-[60px] border-r p-1 last:border-r-0"
                    >
                      {getUniqueEventsForPerson(person.id).map((event) => {
                        const eventType = eventTypes[event.type];
                        const position = getEventPosition(event, dayIndex);

                        if (!position.shouldShow) return null;

                        return (
                          <div
                            key={event.id}
                            className={` ${eventType.color} ${eventType.textColor} relative mb-1 cursor-pointer rounded-md p-1 text-xs transition-opacity hover:opacity-90 ${position.isMultiDay ? "font-medium" : ""} `}
                            style={{
                              width: position.isMultiDay
                                ? `${position.width * 100}%`
                                : "100%",
                              minWidth: position.isMultiDay
                                ? `${position.width * 100}%`
                                : "auto",
                              zIndex: 10,
                            }}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            <div className="flex items-center gap-1 truncate font-medium">
                              {position.isMultiDay && (
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                              )}
                              {event.title}
                            </div>
                            {position.isMultiDay && (
                              <div className="truncate text-xs opacity-75">
                                {format(event.startDate, "dd/MM")}{" "}
                                {event.startTime} -{" "}
                                {format(event.endDate, "dd/MM")} {event.endTime}
                              </div>
                            )}
                            {!position.isMultiDay && (
                              <div className="truncate text-xs opacity-75">
                                {event.startTime} - {event.endTime}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para agregar evento */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="bg-opacity-50 fixed inset-0 bg-black"
            onClick={() => setIsAddingEvent(false)}
          ></div>
          <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-lg">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Programar Nueva Actividad
                </h2>
                <button
                  onClick={() => setIsAddingEvent(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Miembro del Equipo
                  </label>
                  <select
                    value={selectedPerson === "all" ? "" : selectedPerson}
                    onChange={(e) => setSelectedPerson(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar miembro del equipo</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} - {person.department} - {person.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    placeholder="Título del evento"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        type: e.target.value as keyof typeof eventTypes,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(eventTypes).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startDate: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endDate: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    placeholder="Descripción opcional"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAddEvent}
                  className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  Programar Actividad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    className={`h-4 w-4 rounded ${eventTypes[selectedEventDetails.type].color}`}
                  ></div>
                  <span className="text-lg font-semibold">
                    {selectedEventDetails.title}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {eventTypes[selectedEventDetails.type].label}
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

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setSelectedEventDetails(null);
                      handleEditEvent(selectedEventDetails);
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar Evento
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteEvent(selectedEventDetails.id);
                      setSelectedEventDetails(null);
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar evento */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="bg-opacity-50 fixed inset-0 bg-black"
            onClick={() => setEditingEvent(null)}
          ></div>
          <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-lg">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Editar Evento</h2>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    placeholder="Título del evento"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        type: e.target.value as keyof typeof eventTypes,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(eventTypes).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startDate: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endDate: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    placeholder="Descripción opcional"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateEvent}
                    className="flex-1 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    Actualizar Evento
                  </button>
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda de colores */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">Tipos de Actividades del Equipo</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(eventTypes).map(([key, type]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded ${type.color}`}></div>
              <span className="text-sm">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
