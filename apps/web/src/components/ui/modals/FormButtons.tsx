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
  const getSubmitButtonText = () => {
    if (isLoading) {
      return updating ? "Actualizando..." : "Creando...";
    }
    return updating ? "Actualizar" : "Agregar";
  };

  const cancelButtonClasses = "w-auto";
  const submitButtonClasses = "w-auto";

  return (
    <div className="flex justify-end gap-3">
      <Button
        onClick={onCancel}
        className={cancelButtonClasses}
        disabled={isLoading}
        variant="secondary"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        className={submitButtonClasses}
        loading={isLoading}
        variant="primary"
      >
        {getSubmitButtonText()}
      </Button>
    </div>
  );
};
