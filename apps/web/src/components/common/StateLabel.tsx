export const StateLabel = ({ state }: { state: boolean }) => {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs ${
        state ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {state ? "Activo" : "Inactivo"}
    </span>
  );
};
