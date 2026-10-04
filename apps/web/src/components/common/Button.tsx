import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";

interface ButtonProps extends Omit<MuiButtonProps, "variant" | "color"> {
  variant?: "primary" | "secondary" | "outlined";
}

const Button = ({
  children,
  type = "button",
  variant = "primary",
  ...rest
}: ButtonProps) => (
  <MuiButton
    type={type}
    variant={variant === "primary" ? "contained" : "outlined"}
    color={variant === "primary" ? "primary" : "secondary"}
    {...rest}
  >
    {children}
  </MuiButton>
);

export default Button;
