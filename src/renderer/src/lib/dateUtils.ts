export const generateDeleteAfterDate = (date: string) => {
  return Math.floor(
    (new Date(date).getTime() + 86400000 * 7 - new Date().getTime()) / 86400000,
  );
};
