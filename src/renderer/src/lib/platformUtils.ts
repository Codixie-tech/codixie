export const getCtrlKey = () => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

  if (isMac) {
    return "⌘";
  }
  return "Ctrl";
};
