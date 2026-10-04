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
}) => (
  <form className="flex flex-col gap-8" onSubmit={onSubmit}>
    {children}
    <FormButtons
      isLoading={isLoading}
      onCancel={onCancel}
      updating={updating}
    />
  </form>
);
