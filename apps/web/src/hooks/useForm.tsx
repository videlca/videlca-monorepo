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

  const handleNumericChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: Number(value) || 0,
    }));
  };

  const handleBooleanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value === "true",
    }));
  };

  const resetForm = () => {
    setForm(initialState);
  };

  return {
    form,
    handleChange,
    handleNumericChange,
    handleBooleanChange,
    setForm,
    resetForm,
  };
};
