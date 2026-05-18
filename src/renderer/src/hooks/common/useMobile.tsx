import { useMediaQuery } from "usehooks-ts";

export const useMobile = () => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return isMobile;
};
