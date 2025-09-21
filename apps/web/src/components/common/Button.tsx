import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "outlined";
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  variant = "primary",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center cursor-pointer rounded-md font-medium transition-colors duration-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    outlined: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  };

  const disabledClass =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={` ${baseClasses} ${variantClasses[variant]} ${disabledClass} ${className} `.trim()}
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
