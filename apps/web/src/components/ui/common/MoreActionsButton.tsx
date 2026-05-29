import { MoreVertical } from "lucide-react";
import { useRef, useState, useEffect } from "react";
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Calcular posición del menú
  const calculateMenuPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const menuHeight = 200; // Altura aproximada del menú
    const menuWidth = 192; // 48 * 4 (w-48 in pixels)

    let top = buttonRect.bottom + 4; // Posición por defecto abajo
    let left = buttonRect.right - menuWidth; // Posición por defecto a la derecha

    // Si el menú saldría fuera de la vista, posicionar arriba
    if (top + menuHeight > viewportHeight) {
      top = buttonRect.top - menuHeight - 4;
    }

    // Si el menú saldría fuera del borde izquierdo, alinear a la izquierda del botón
    if (left < 0) {
      left = buttonRect.left;
    }

    // Si el menú saldría fuera del borde derecho, alinear al borde derecho de la vista
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 8;
    }

    return { top, left };
  };

  // Actualizar posición del menú cuando se abre
  useEffect(() => {
    if (isOpen) {
      setMenuPosition(calculateMenuPosition());
    }
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
      className={`zoom-in-95 animate-in fade-in-0 fixed z-[9999] w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-2xl ${
        menuPosition.top === 0 && menuPosition.left === 0 ? "hidden" : ""
      }`}
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
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
