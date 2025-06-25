import { useCallback, useState } from "react";

export const useForm = <T,>(initialState: T) => {
  const [form, setForm] = useState<T>(initialState);
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | HTMLDataElement
      >
    ) => {
      setForm({
        ...form,
        [e.target.id]: e.target.value,
      });
    },
    [form]
  );

  const resetForm = useCallback(() => {
    setForm(initialState);
  }, [initialState]);

  return { form, handleChange, setForm, resetForm };
};
