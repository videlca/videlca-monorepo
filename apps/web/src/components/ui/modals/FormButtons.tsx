import Button from "../../common/Button";

export const FormButtons = ({
  isLoading,
  updating,
  onCancel,
}: {
  isLoading: boolean;
  updating: boolean;
  onCancel: () => void;
}) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button
        onClick={onCancel}
        className="w-auto cursor-pointer rounded-lg bg-gray-500 hover:bg-gray-600"
      >
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading} className="w-auto">
        {isLoading && !updating && "Creando..."}
        {isLoading && updating && "Actualizando..."}
        {!isLoading && !updating && "Agregar"}
        {!isLoading && updating && "Actualizar"}
      </Button>
    </div>
  );
};
