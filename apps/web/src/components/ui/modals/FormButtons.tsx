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
  const submitText = isLoading
    ? updating
      ? "Actualizando..."
      : "Creando..."
    : updating
      ? "Actualizar"
      : "Agregar";

  return (
    <div className="flex justify-end gap-3">
      <Button onClick={onCancel} disabled={isLoading} variant="secondary">
        Cancelar
      </Button>
      <Button type="submit" loading={isLoading} variant="primary">
        {submitText}
      </Button>
    </div>
  );
};
