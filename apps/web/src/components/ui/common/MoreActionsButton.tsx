import MoreVertIcon from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { tones } from "../../../theme/tones";

export type ActionColor =
  "default" | "red" | "blue" | "green" | "yellow" | "orange" | "purple";

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

export const MoreActionsButton = ({
  menuId,
  onActionClick,
  actions,
  children,
}: MoreActionsButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const buttonId = `menu-button-${menuId}`;

  const handleActionClick = (action: () => void, label: string) => {
    action();
    setAnchorEl(null);
    onActionClick?.(label);
  };

  return (
    <>
      <Tooltip title="Más acciones">
        <IconButton
          id={buttonId}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: { "aria-labelledby": buttonId, dense: true },
          paper: { sx: { minWidth: 192 } },
        }}
      >
        {actions
          ? actions.map((action, index) => (
              <MenuItem
                key={index}
                onClick={() => handleActionClick(action.onClick, action.label)}
                sx={
                  action.color && action.color !== "default"
                    ? { color: tones[action.color].main }
                    : undefined
                }
              >
                {action.label}
              </MenuItem>
            ))
          : children}
      </Menu>
    </>
  );
};
