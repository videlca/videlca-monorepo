import { MoreVertical } from "lucide-react";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export type ActionColor = "default" | "red" | "blue" | "green" | "yellow" | "orange" | "purple";

export interface MoreActionsButtonProps {
  menuId: string;
  onActionClick?: (action: string) => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    color?: ActionColor;
  }>;
  children?: React.ReactNode;
}

const getColorClasses = (color?: ActionColor) => {
  switch (color) {
    case "red": return "text-red-600 hover:bg-red-50 focus:bg-red-50";
    case "blue": return "text-blue-600 hover:bg-blue-50 focus:bg-blue-50";
    case "green": return "text-green-600 hover:bg-green-50 focus:bg-green-50";
    case "yellow": return "text-yellow-600 hover:bg-yellow-50 focus:bg-yellow-50";
    case "orange": return "text-orange-600 hover:bg-orange-50 focus:bg-orange-50";
    case "purple": return "text-purple-600 hover:bg-purple-50 focus:bg-purple-50";
    default: return "text-gray-700 hover:bg-gray-50 focus:bg-gray-50";
  }
};

export const MoreActionsButton = ({
  menuId,
  onActionClick,
  actions,
  children,
}: MoreActionsButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Se mide el menú ya renderizado (menuRef) en vez de asumir una altura fija: con listas de acciones largas
  // (ej. 7 acciones en ordenes-servicio) una altura estimada de 200px subestima el alto real y el menu no
  // se volteaba hacia arriba cuando debia, quedando cortado contra el borde inferior del viewport
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current || !menuRef.current) {
      if (!isOpen) setMenuPosition(null);
      return;
    }

    const margin = 8;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = buttonRect.bottom + 4; // Posición por defecto abajo
    let left = buttonRect.right - menuRect.width; // Posición por defecto a la derecha

    // Si el menú saldría fuera de la vista, posicionar arriba
    if (top + menuRect.height > viewportHeight - margin) {
      top = buttonRect.top - menuRect.height - 4;
    }
    // El menú es mas alto que el viewport (aun volteado no cabe): pegarlo al borde superior
    if (top < margin) {
      top = margin;
    }

    // Si el menú saldría fuera del borde izquierdo, alinear a la izquierda del botón
    if (left < margin) {
      left = buttonRect.left;
    }

    // Si el menú saldría fuera del borde derecho, alinear al borde derecho de la vista
    if (left + menuRect.width > viewportWidth - margin) {
      left = viewportWidth - menuRect.width - margin;
    }

    setMenuPosition({ top, left });
  }, [isOpen]);

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickOnButton = buttonRef.current?.contains(target);
      const isClickOnMenu = menuRef.current?.contains(target);

      if (!isClickOnButton && !isClickOnMenu) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Cerrar menú con la tecla escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Manejar clic en acción
  const handleActionClick = (action: () => void, label: string) => {
    action();
    setIsOpen(false);
    onActionClick?.(label);
  };

  const menuElement = isOpen ? (
    <div
      ref={menuRef}
      className={`zoom-in-95 animate-in fade-in-0 fixed z-[9999] max-h-[calc(100vh-1rem)] w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-2xl ${
        menuPosition === null ? "invisible" : ""
      }`}
      style={{
        top: `${menuPosition?.top ?? 0}px`,
        left: `${menuPosition?.left ?? 0}px`,
      }}
      role="menu"
      aria-labelledby={`menu-button-${menuId}`}
    >
      {actions
        ? actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action.onClick, action.label)}
              className={`w-full cursor-pointer px-4 py-2 text-left text-sm focus:outline-none ${getColorClasses(action.color)}`}
              role="menuitem"
            >
              {action.label}
            </button>
          ))
        : children}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer rounded-full p-2 hover:bg-gray-100 ${
          isOpen ? "bg-gray-100" : ""
        }`}
        title="Más acciones"
        aria-expanded={isOpen}
        aria-haspopup="true"
        id={`menu-button-${menuId}`}
      >
        <MoreVertical size={18} className="text-gray-600" />
      </button>

      {menuElement && createPortal(menuElement, document.body)}
    </>
  );
};
