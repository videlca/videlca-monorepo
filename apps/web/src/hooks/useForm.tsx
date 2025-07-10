import { useState } from "react";

export const useForm = <T,>(initialState: T) => {
  const [form, setForm] = useState<T>(initialState);

  const handleChange = (
    e: React.ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | HTMLDataElement
    >,
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialState);
  };

  return { form, handleChange, setForm, resetForm };
};
