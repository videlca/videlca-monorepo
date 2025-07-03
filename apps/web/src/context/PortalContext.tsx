import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalContextType {
  showPortal: (id: string, content: ReactNode) => void;
  hidePortal: (id: string) => void;
  isPortalVisible: (id: string) => boolean;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

// HOOK PARA ACCEDER AL CONTEXTO DEL PORTAL
export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
};

interface PortalProviderProps {
  children: ReactNode;
}

// PROVEDOR DEL CONTEXTO DEL PORTAL EN LA BASE DEL APP
export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  const [portals, setPortals] = useState<Map<string, ReactNode>>(new Map());

  // AGREGAR UN PORTAL
  const showPortal = (id: string, content: ReactNode) => {
    setPortals((prev) => new Map(prev).set(id, content));
  };

  // OCULTAR UN PORTAL
  const hidePortal = (id: string) => {
    setPortals((prev) => {
      const newPortals = new Map(prev);
      newPortals.delete(id);
      return newPortals;
    });
  };

  // VER SI UN PORTAL ESTA VISIBLE
  const isPortalVisible = (id: string) => {
    return portals.has(id);
  };

  return (
    <PortalContext.Provider value={{ showPortal, hidePortal, isPortalVisible }}>
      {children}
      <PortalRenderer portals={portals} />
    </PortalContext.Provider>
  );
};

interface PortalRendererProps {
  portals: Map<string, ReactNode>;
}

const PortalRenderer: React.FC<PortalRendererProps> = ({ portals }) => {
  const portalRoot = document.getElementById("portal-root");

  if (!portalRoot) {
    console.warn("Portal root element not found");
    return null;
  }

  // RENDERIZAR LOS PORTALES CREADOS
  return createPortal(
    <>
      {Array.from(portals.entries()).map(([id, content]) => (
        <div key={id} data-portal-id={id}>
          {content}
        </div>
      ))}
    </>,
    portalRoot,
  );
};
