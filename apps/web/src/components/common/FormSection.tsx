import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ElementType, ReactNode } from "react";

export const FormSection = ({
  title,
  children,
  description,
  Icon = null,
  Details = null,
}: {
  title: string;
  children: ReactNode;
  description?: string;
  Icon?: ElementType | null;
  Details?: ReactNode | null;
}) => (
  <Paper variant="outlined" className="flex w-full flex-col p-6">
    <div className="flex flex-row items-center justify-between">
      <div>
        <Typography variant="h5" className="flex items-center gap-2">
          {Icon && (
            <Box
              component={Icon}
              sx={{ width: 18, height: 18, color: "primary.main" }}
            />
          )}
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </div>
      {Details}
    </div>
    <div className="mt-4 flex flex-col gap-4">{children}</div>
  </Paper>
);
