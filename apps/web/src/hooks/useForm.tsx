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
    const fieldName = id; // Use name if available, otherwise use id
    const inputValue =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : value;
    setForm((prev) => ({
      ...prev,
      [fieldName]: inputValue,
    }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, name, value } = e.target;
    const fieldName = name || id; // Use name if available, otherwise use id
    setForm((prev) => ({
      ...prev,
      [fieldName]: Number(value) || 0,
    }));
  };

  const handleBooleanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, name, value } = e.target;
    const fieldName = name || id; // Use name if available, otherwise use id
    setForm((prev) => ({
      ...prev,
      [fieldName]: value === "true",
    }));
  };

  const handleChangeTime = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    const fieldName = id;
    const [hours] = value.split(":");
    setForm((prev) => ({
      ...prev,
      [fieldName]: `${hours}:00`,
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
    handleChangeTime,
    setForm,
    resetForm,
  };
};
