import { type DependencyList, useEffect, useRef } from "react";

export const useDidMountEffect = (
  func: () => void,
  deps: DependencyList | undefined,
) => {
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) func();
    else didMount.current = true;
  }, [deps, func]);
};
