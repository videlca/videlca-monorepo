import { FormButtons } from "./FormButtons";

export const FormsModal = ({
  children,
  onSubmit,
  isLoading,
  onCancel,
  updating,
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onCancel: () => void;
  updating: boolean;
}) => {
  return (
    <form className="flex flex-col gap-16" onSubmit={onSubmit}>
      {children}
      <FormButtons
        isLoading={isLoading}
        onCancel={onCancel}
        updating={updating}
      />
    </form>
  );
};
