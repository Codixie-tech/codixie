export const getCtrlKey = () => {
  const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

  if (isMac) {
    return "⌘";
  }
  return "Ctrl";
};
