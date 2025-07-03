import { useCallback } from "react";
import { usePortal } from "../context/PortalContext";
import { Modal } from "../components/common/Modal";
import type { ReactNode } from "react";

interface UseModalReturn {
  showModal: (
    content: ReactNode,
    title?: string,
    size?: "sm" | "md" | "lg" | "xl",
  ) => void;
  hideModal: () => void;
  isModalVisible: boolean;
}

export const useModal = (modalId: string = "default-modal"): UseModalReturn => {
  const { showPortal, hidePortal, isPortalVisible } = usePortal();

  // FUNCION PARA CREAR UN MODAL
  const showModal = useCallback(
    (
      content: ReactNode,
      title?: string,
      size: "sm" | "md" | "lg" | "xl" = "md",
    ) => {
      const modalContent = (
        <Modal
          isOpen={true}
          onClose={() => hidePortal(modalId)}
          title={title}
          size={size}
        >
          {content}
        </Modal>
      );

      showPortal(modalId, modalContent);
    },
    [showPortal, hidePortal, modalId],
  );

  const hideModal = useCallback(() => {
    hidePortal(modalId);
  }, [hidePortal, modalId]);

  return {
    showModal,
    hideModal,
    isModalVisible: isPortalVisible(modalId),
  };
};
