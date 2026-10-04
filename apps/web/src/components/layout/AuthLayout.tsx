import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 896,
          overflow: "hidden",
          borderRadius: 4,
        }}
      >
        <div className="grid min-h-[600px] md:grid-cols-2">
          <Box
            className="flex flex-col items-center justify-center gap-6 p-8 text-center"
            sx={{
              color: "primary.contrastText",
              background: (t) =>
                `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldOutlined sx={{ fontSize: 40 }} />
            </Box>
            <div>
              <Typography
                variant="h1"
                component="p"
                sx={{ fontSize: "2.25rem", letterSpacing: "0.05em" }}
              >
                SOFIA
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 320,
                  fontSize: "1.125rem",
                  opacity: 0.85,
                }}
              >
                Sistema de Gestión de Vigilancia y Seguridad
              </Typography>
            </div>
            <Box
              sx={{
                mt: 2,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                fontWeight: 500,
              }}
            >
              Seguridad física y electrónica
            </Box>
          </Box>
          <div className="flex flex-col justify-center p-8">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
              {children}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ pt: 3, textAlign: "center" }}
              >
                © {new Date().getFullYear()} SOFIA. Todos los derechos
                reservados.
              </Typography>
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
}
