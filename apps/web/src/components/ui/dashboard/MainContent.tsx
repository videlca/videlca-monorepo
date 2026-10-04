import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Outlet, useLocation } from "@tanstack/react-router";
import { linksSideBar } from "../../../LinkPages";
import { usePermissions } from "../../../context/PermissionsContext";

export function MainContent() {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { pathname } = useLocation();
  const module = pathname?.split("/")[2] || "";
  const page = linksSideBar[module as keyof typeof linksSideBar]?.find(
    (link) => link.to === pathname,
  );

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto">
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-4 px-2 pb-8 md:px-6 lg:px-8">
        {(hasPermission(module) || isSuperAdmin) && page && (
          <Typography
            variant="h2"
            component="h1"
            className="flex items-center gap-2"
          >
            <Box
              component="span"
              sx={{ display: "flex", color: "primary.main" }}
            >
              {page.icon}
            </Box>
            {page.label}
          </Typography>
        )}
        <Outlet />
      </div>
    </main>
  );
}
