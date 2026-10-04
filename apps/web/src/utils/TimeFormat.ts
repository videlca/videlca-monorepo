export const timeFormat = (time: string) => {
  if (time.includes(":")) {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}:00`;
  }
  return `${time}:00:00`;
};