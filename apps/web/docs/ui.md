# UI standard

The web app uses **Material UI v9** for every component and **@mui/icons-material** for every icon. Tailwind is kept only for layout (`flex`, `grid`, `gap-*`, `p-*`, `m-*`, `w-*`). Colors, typography, borders, and shadows come from the theme, never from Tailwind classes.

- Theme: `src/theme/theme.ts` (palette, typography, component defaults, `es` locales). Change look and feel there, not per screen.
- Semantic colors for chips, text buttons, and menu items: `src/theme/tones.ts`.
- Providers: `src/theme/AppThemeProvider.tsx` (CSS layer order: `theme, base, mui, components, utilities`, so Tailwind utilities override MUI). App-wide CSS in `index.css` must stay inside `@layer base`: unlayered CSS beats every layer.
- Dates and times: `@mui/x-date-pickers` with `date-fns` and the `es` locale (provider already mounted).

## Which component to use

Paths are relative to `src/components/`.

### Layout and pages

| Need | Use |
| --- | --- |
| Page title + actions (routes outside the sidebar) | `ui/common/PageHeader` (title accepts a node, e.g. text + chip) |
| Card with title, description, actions | `ui/common/SectionCard` |
| Empty or "no results" state | `ui/common/EmptyState` |
| Read-only data block (icon title + fields) | `ui/common/DetailSection` + `DetailField` |
| Small read-only tile (icon, value, caption) | `ui/common/InfoTile` |
| Clickable option card in a list | `ui/common/SelectableCard` |
| Up/down difference between two values | `ui/common/DiferenciaChip` |
| Multi-step wizard | `ui/common/Wizard` (`WizardStepper`, `WizardFooter`) + `ui/common/StepHeader` at the top of each step |
| Tabs | `ui/common/NavTabs` |
| Link that navigates with the router | `ui/common/RouterLink` |

### Actions

| Need | Use |
| --- | --- |
| Primary/secondary button | `common/Button` (`variant`: `primary`, `secondary`, `outlined`; supports `loading`, `startIcon`) |
| Toolbar action with icon | `common/ButtonAction` |
| Small row/text action | `common/ButtonOrdenes` (`icon` prop for the start icon) |
| Row actions menu | `ui/common/MoreActionsButton` |

### Forms

| Need | Use |
| --- | --- |
| Text/number field | `common/InputForm` (works with `register`) |
| Login field with icon | `common/Input` |
| Money field | `common/InputPrice` |
| Searchable select | `common/InputSelect`: with react-hook-form pass `control` + `name` (+ `valueAsNumber`), never `register`; side effects go in `onOptionChange(option)`. It can't be cleared. |
| Checkbox | `common/CheckboxForm`: with react-hook-form pass `control` + `name`, never `register` |
| Activo/Inactivo select | `common/InputSelectStateBoolean` (native, works with `register`) |
| Hour select | `common/InputTime24H` |
| Coordinates | `common/CoordinateInput` |
| Email list | `common/EmailsInput` |
| Grouped form block | `common/FormSection` |
| Plain MUI `TextField` bound with `register` | spread `muiRegister(register("campo"))` (`utils/muiRegister`) so the ref reaches the input |

### Dialogs, data and status

| Need | Use |
| --- | --- |
| Modal | `common/SimpleModal` (MUI `Dialog`) |
| Create/edit form in a modal | `ui/modals/FormsModal` |
| Delete confirmation | `ui/modals/ConfirmarDelete` |
| Data table | `common/Table` (tanstack logic, MUI rendering) |
| Activo/Inactivo status | `common/StateLabel` |
| Order state | `common/OrderStateLabel`: the only order-state color map (same colors as the dashboard chart) |
| Liquidation group (header + orders) | `common/GrupoLiquidacionCard` |
| Comments list + form | `ui/modals/ObservacionesPanel` |
| Notifications | `sonner` (`toast`), already wired in the query layer |

## Rules

- Don't use raw `<button>`, `<input>`, `<select>`, `<table>`, or hand-built modals in screens. Use the components above or MUI directly.
- Labels: a trailing `*` ("Nombre *") is rendered as MUI's required asterisk; `required` still controls validation.
- Sidebar routes get their page title from `MainContent`; don't add a second one.
- Icons: import from `@mui/icons-material/<Name>`, size with `fontSize="small"` or `sx`, and use theme colors (`color="primary"`).
- MUI v9 removed deprecated APIs: use `slotProps` (not `inputProps`/`InputProps`/`PaperProps`) and `sx` (no system props on `Box`/`Typography`).
- Keep labels and messages in Spanish.
