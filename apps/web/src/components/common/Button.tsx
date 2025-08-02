import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  className = "",
}) => {
  const baseClasses =
    "h-12 cursor-pointer rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors px-6 py-3 text-base";

  const disabledClass =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={` ${baseClasses} ${disabledClass} ${className} `.trim()}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
