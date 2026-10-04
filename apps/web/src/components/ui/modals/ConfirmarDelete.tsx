import { TrashIcon, XIcon } from "lucide-react";
import { SimpleModal } from "../../common/SimpleModal";
import { ButtonAction } from "../../common/ButtonAction";

export const ConfirmarDelete = ({
  isOpenDelete,
  text,
  onDelete,
  onClose,
  actionLabel = "Eliminar",
  cancelLabel = "Cerrar",
}: {
  isOpenDelete: boolean;
  text: string;
  onDelete: () => void;
  onClose: () => void;
  actionLabel?: string;
  cancelLabel?: string;
}) => {
  return (
    <SimpleModal isOpen={isOpenDelete} onClose={onClose} size="md">
      <div className="text-center text-lg font-medium">{text}</div>
      <div className="flex justify-center gap-2 pt-4">
        <ButtonAction Icon={XIcon} label={cancelLabel} onClick={() => onClose()} />
        <ButtonAction
          Icon={TrashIcon}
          label={actionLabel}
          onClick={() => {
            onDelete();
          }}
          color="red"
        />
      </div>
    </SimpleModal>
  );
};
