import MuiLink from "@mui/material/Link";
import { createLink } from "@tanstack/react-router";

/** Link de MUI con navegación de TanStack Router (`to`, `params`, `search`) */
export const RouterLink = createLink(MuiLink);
