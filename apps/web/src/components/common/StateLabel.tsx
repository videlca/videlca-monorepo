export const StateLabel = ({ state }: { state: boolean }) => {
  return (
    <span
      className={`rounded-full px-2 py-1 text-sm font-semibold ${
        state ? "bg-green-200 text-green-600" : "bg-red-200 text-red-600"
      }`}
    >
      {state ? "Activo" : "Inactivo"}
    </span>
  );
};
