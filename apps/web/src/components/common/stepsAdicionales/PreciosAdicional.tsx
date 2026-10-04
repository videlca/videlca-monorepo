import { StepHeader } from "../../ui/common/StepHeader";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { InputPrice } from "../InputPrice";
import {
  calcularAuiAdicional,
  calcularTotalesAdicional,
} from "../../../utils/calcularTotalesAdicional";
import {
  formatCOPFromNumber,
  reformatCOPInput,
  parseCOPInput,
} from "../../../utils/CurrencyInput";

// Campos que se calculan automaticamente pero el usuario puede sobrescribir a mano. El IVA no esta
// aqui: los adicionales no llevan IVA, se envia siempre en 0 y no se muestra en pantalla
export type CampoCalculadoAdicional =
  | "aui"
  | "costosDirectosSeguroVida"
  | "precioAntesIva"
  | "precioTotal";

type CampoPrecioCalculado = Exclude<CampoCalculadoAdicional, "aui">;

const CAMPOS_CALCULADOS_LABELS: Record<CampoPrecioCalculado, string> = {
  costosDirectosSeguroVida: "Costos Directos + Seguro Vida",
  precioAntesIva: "Precio antes de IVA",
  precioTotal: "Precio Total (cobro mensual)",
};

// Input de precio controlado con formato colombiano en vivo ("." miles, "," decimales). No usa
// register: el valor se empuja al formulario via setValue en cada cambio, y el texto mostrado se
// resincroniza solo cuando el valor externo cambia por algo distinto a lo que el usuario ya escribió
// (recalculo automático, "recalcular" manual, prefill de edición) — asi no se pierde una coma/decimal
// a medio escribir
const CampoPrecioEditable = ({
  label,
  setValue,
  name,
  value,
  onManualChange,
}: {
  label: string;
  setValue: UseFormSetValue<any>;
  name: string;
  value: number;
  onManualChange?: () => void;
}) => {
  const [displayValue, setDisplayValue] = useState(() =>
    formatCOPFromNumber(value),
  );

  useEffect(() => {
    if (parseCOPInput(displayValue) !== value) {
      setDisplayValue(formatCOPFromNumber(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <InputPrice
      label={label}
      size="full"
      value={displayValue}
      onChange={(e) => {
        const formatted = reformatCOPInput(e.target.value);
        setDisplayValue(formatted);
        setValue(name, parseCOPInput(formatted));
        onManualChange?.();
      }}
    />
  );
};

export const PreciosAdicional = ({
  setValue,
  costosDirectos,
  seguroVida,
  aui,
  costosDirectosSeguroVida,
  precioAntesIva,
  precioTotal,
  camposManuales,
  onToggleManual,
  showHeader = true,
}: {
  setValue: UseFormSetValue<any>;
  costosDirectos: number;
  seguroVida: number;
  aui: number;
  costosDirectosSeguroVida: number;
  precioAntesIva: number;
  precioTotal: number;
  camposManuales: Set<CampoCalculadoAdicional>;
  onToggleManual: (campo: CampoCalculadoAdicional, manual: boolean) => void;
  showHeader?: boolean;
}) => {
  // Recalcula en vivo el AUI (costos directos + seguro de vida) y los campos derivados, pero solo los que
  // el usuario no haya editado manualmente (camposManuales) — esos se dejan tal cual el usuario los dejó.
  // El IVA se fuerza siempre a 0
  useEffect(() => {
    const costos = Number.isNaN(costosDirectos) ? 0 : costosDirectos;
    const seguro = Number.isNaN(seguroVida) ? 0 : seguroVida;
    const auiEfectivo = camposManuales.has("aui")
      ? Number.isNaN(aui)
        ? 0
        : aui
      : calcularAuiAdicional(costos, seguro);
    if (!camposManuales.has("aui")) {
      setValue("aui", auiEfectivo);
    }

    const totales = calcularTotalesAdicional(costos, seguro, auiEfectivo);
    (Object.keys(CAMPOS_CALCULADOS_LABELS) as CampoPrecioCalculado[]).forEach(
      (campo) => {
        if (!camposManuales.has(campo)) {
          setValue(campo, totales[campo]);
        }
      },
    );
    setValue("iva", 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costosDirectos, seguroVida, aui, camposManuales]);

  const valoresCalculados: Record<CampoPrecioCalculado, number> = {
    costosDirectosSeguroVida,
    precioAntesIva,
    precioTotal,
  };

  const botonRecalcular = (campo: CampoCalculadoAdicional) =>
    camposManuales.has(campo) && (
      <Button
        size="small"
        color="success"
        startIcon={<RestartAltIcon />}
        onClick={() => onToggleManual(campo, false)}
        sx={{ alignSelf: "flex-start" }}
      >
        Recalcular automáticamente
      </Button>
    );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {showHeader && (
        <StepHeader
          title="Valores del Adicional"
          description="Ingrese los valores del adicional. El AUI (10% de costos directos + seguro de vida) y el desglose se calculan automáticamente y pueden ajustarse manualmente si se requiere"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CampoPrecioEditable
          label="Costos Directos"
          setValue={setValue}
          name="costosDirectos"
          value={costosDirectos}
        />
        <CampoPrecioEditable
          label="Seguro de Vida"
          setValue={setValue}
          name="seguroVida"
          value={seguroVida}
        />
        <div className="flex flex-col gap-1">
          <CampoPrecioEditable
            label="AUI"
            setValue={setValue}
            name="aui"
            value={aui}
            onManualChange={() => onToggleManual("aui", true)}
          />
          {botonRecalcular("aui")}
        </div>
      </div>

      <Box
        className="rounded-lg p-4"
        sx={{
          border: 1,
          borderColor: "success.light",
          bgcolor: (t) => alpha(t.palette.success.main, 0.06),
        }}
      >
        <Typography variant="h4" component="h4" className="flex items-center gap-2" sx={{ mb: 1.5 }}>
          <CalculateOutlinedIcon color="success" />
          Precio Calculado
        </Typography>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            Object.keys(CAMPOS_CALCULADOS_LABELS) as CampoPrecioCalculado[]
          ).map((campo) => (
            <div key={campo} className="flex flex-col gap-1">
              <CampoPrecioEditable
                label={CAMPOS_CALCULADOS_LABELS[campo]}
                setValue={setValue}
                name={campo}
                value={valoresCalculados[campo]}
                onManualChange={() => onToggleManual(campo, true)}
              />
              {botonRecalcular(campo)}
            </div>
          ))}
        </div>
        <Typography
          variant="body2"
          sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "success.light", color: "success.dark" }}
        >
          Precio Total es el valor que se cobrará cada mes mientras el adicional
          esté vigente.
        </Typography>
      </Box>
    </div>
  );
};
