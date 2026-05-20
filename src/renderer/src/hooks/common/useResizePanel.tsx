import { useState, useLayoutEffect } from "react";

const MIN_SIZE_IN_PIXELS = 100;
const MAX_SIZE_IN_PIXELS = 230;

export const useResizePanel = (resizeId: string) => {
  const [maxSize, setMaxSize] = useState(230);
  const [minSize, setMinSize] = useState(100);

  useLayoutEffect(() => {
    const panelGroup = document.querySelector(
      `[data-panel-group-id="${resizeId}"]`,
    );
    if (!panelGroup) return;
    const resizeHandles = document.querySelectorAll(
      "[data-panel-resize-handle-id]",
    );
    const observer = new ResizeObserver(() => {
      let width = (panelGroup as HTMLElement).offsetWidth;

      resizeHandles.forEach((resizeHandle) => {
        width -= (resizeHandle as HTMLElement).offsetWidth;
      });

      // Minimum size in pixels is a percentage of the PanelGroup's width,
      // less the (fixed) width of the resize handles.
      setMaxSize((MAX_SIZE_IN_PIXELS / width) * 100);
      setMinSize((MIN_SIZE_IN_PIXELS / width) * 100);
    });
    observer.observe(panelGroup);
    resizeHandles.forEach((resizeHandle) => {
      observer.observe(resizeHandle);
    });

    return () => {
      observer.disconnect();
    };
  }, [resizeId]);

  return { maxSize, minSize };
};
