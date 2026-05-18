export const generateDeleteAfterDate = (date: Date) => {
  return Math.floor(
    (date.getTime() + 86400000 * 7 - new Date().getTime()) / 86400000,
  );
};
