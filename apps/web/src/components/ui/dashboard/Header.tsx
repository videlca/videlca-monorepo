import { User, ChevronDown, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useGetUsuarioByCookie } from "../../../api/queryFunctions/usuarios";

export function Header() {
  const { data: usuario } = useGetUsuarioByCookie();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    navigate({ to: "/dashboard/perfil-usuario" });
    setIsDropdownOpen(false);
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-end">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <span className="font-medium">{usuario?.data?.primerNombre}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
              <User className="h-4 w-4 text-white" />
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="ring-opacity-5 absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black">
              <button
                onClick={handleProfileClick}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircle className="mr-3 h-4 w-4" />
                Perfil de Usuario
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
