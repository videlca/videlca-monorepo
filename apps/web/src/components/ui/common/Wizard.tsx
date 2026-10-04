import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/** Indicador de pasos de un asistente (pasos numerados desde 1) */
export function WizardStepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <Stepper activeStep={currentStep - 1} sx={{ px: 3, py: 3, maxWidth: 640, mx: "auto" }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Step key={i}>
          <StepLabel />
        </Step>
      ))}
    </Stepper>
  );
}

/** Pie de un asistente: paso actual a la izquierda; Cancelar, Anterior y Siguiente/acción final a la derecha */
export function WizardFooter({
  currentStep,
  totalSteps,
  info,
  onCancel,
  onPrevious,
  onNext,
  nextDisabled = false,
  loading = false,
  finalLabel,
  loadingLabel,
}: {
  currentStep: number;
  totalSteps: number;
  info?: ReactNode;
  onCancel: () => void;
  onPrevious: () => void;
  /** En el último paso es la acción final */
  onNext: () => void;
  nextDisabled?: boolean;
  loading?: boolean;
  finalLabel: string;
  loadingLabel: string;
}) {
  const isLast = currentStep >= totalSteps;
  return (
    <Box
      className="flex items-center justify-between gap-4 px-6 pt-6 pb-4"
      sx={{ borderTop: 1, borderColor: "divider" }}
    >
      <Typography variant="body2" color="text.secondary">
        Paso {currentStep} de {totalSteps}
        {info}
      </Typography>
      <div className="flex items-center gap-3">
        <Button variant="outlined" color="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        {currentStep > 1 && (
          <Button variant="outlined" color="secondary" onClick={onPrevious}>
            Anterior
          </Button>
        )}
        <Button
          variant="contained"
          color={isLast ? "success" : "primary"}
          onClick={onNext}
          disabled={nextDisabled}
          loading={loading}
          loadingPosition="start"
        >
          {loading ? loadingLabel : isLast ? finalLabel : "Siguiente"}
        </Button>
      </div>
    </Box>
  );
}
