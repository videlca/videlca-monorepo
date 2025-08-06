export const dateFormat = (date: Date) => {
  return date.toISOString().split("T")[0];
};