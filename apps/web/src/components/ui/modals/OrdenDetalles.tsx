import { Calendar, CheckCircle2, FileText, MapPin } from "lucide-react";
import { SimpleModal } from "../../common/SimpleModal";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import { OrderStateLabel } from "../../common/OrderStateLabel";

export const OrdenDetalles = ({
  isOpenDetails,
  setIsOpenDetails,
  selectedOrderDetail,
  setSelectedOrderDetail,
}: {
  isOpenDetails: boolean;
  setIsOpenDetails: (isOpen: boolean) => void;
  selectedOrderDetail: OrdenServicio;
  setSelectedOrderDetail: (selectedOrderDetail: OrdenServicio | null) => void;
}) => {
  return (
    <SimpleModal
      isOpen={isOpenDetails}
      onClose={() => {
        setIsOpenDetails(false);
        setSelectedOrderDetail(null);
      }}
      title="Detalles de la orden de servicio"
      size="2xl"
    >
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Sección de Localización */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <MapPin className="h-5 w-5 text-blue-600" />
            Localización
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <p>
                <span className="font-medium">Nombre:</span>{" "}
                {selectedOrderDetail?.idLocacion?.nombre}
              </p>
              <p>
                <span className="font-medium">Empresa:</span>{" "}
                {selectedOrderDetail?.idLocacion?.idCliente?.nombre}
              </p>
              <p>
                <span className="font-medium">Dirección:</span>{" "}
                {selectedOrderDetail?.idLocacion?.direccion}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Contacto:</span>{" "}
                {selectedOrderDetail?.idLocacion?.primerNombreResponsable}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span>{" "}
                {selectedOrderDetail?.idLocacion?.telefono}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Servicio */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-5 w-5 text-blue-600" />
            Servicio{" "}
            {selectedOrderDetail?.tarifas?.length &&
            selectedOrderDetail?.tarifas?.length > 1
              ? "s"
              : ""}
          </h3>
          {selectedOrderDetail?.tarifas?.map((tarifa) => (
            <div
              className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2"
              key={tarifa.idTarifa.idServicio.idServicio}
            >
              <div>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {tarifa.idTarifa?.idServicio?.codigo}
                </p>
                <p>
                  <span className="font-medium">Categoría:</span>{" "}
                  {tarifa.idTarifa?.idServicio?.idTipoServicio?.descripcion}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Precio:</span> ${" "}
                  {tarifa.idTarifa?.precioTotal?.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Descripción:</span>{" "}
                  {tarifa.idTarifa?.idServicio?.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sección de Fechas y Horarios */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-5 w-5 text-blue-600" />
            Fecha orden de servicio
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <p>
                <span className="font-medium">Fecha de Inicio:</span>{" "}
                {new Date(
                  selectedOrderDetail?.fechaInicio || "",
                ).toLocaleDateString("es-ES")}
              </p>
              <p>
                <span className="font-medium">Fecha de Fin:</span>{" "}
                {selectedOrderDetail?.fechaFin
                  ? new Date(
                      selectedOrderDetail?.fechaFin || "",
                    ).toLocaleDateString("es-ES")
                  : "Indefinida"}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Estado */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Estado de la orden de servicio
          </h3>
          <OrderStateLabel
            state={selectedOrderDetail?.idEstadoOrdenServicio?.nombre || ""}
          />
        </div>
      </div>
      <div className="flex items-center justify-end border-t border-gray-200 px-6 pt-6 pb-4">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          onClick={() => setIsOpenDetails(false)}
        >
          Cerrar
        </button>
      </div>
    </SimpleModal>
  );
};
