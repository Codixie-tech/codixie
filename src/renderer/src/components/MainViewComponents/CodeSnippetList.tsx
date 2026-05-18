import CodeSnippetListItem from "@/components/MainViewComponents/CodeSnippetListItem";
import { useResizablePanelWidthStore } from "@/store/store";
import { useLayoutEffect, useRef, useState } from "react";

const CODE_WIDTH = 384;

const gap = 8;

const CodeSnippetList = ({
  codeSnippets,
  shouldHightlightCode,
  isDeletedContainer,
}: {
  codeSnippets: ClientCodeSnippet[];
  shouldHightlightCode: boolean;
  isDeletedContainer: boolean;
}) => {
  const refList = useRef<HTMLDivElement[]>([]);

  const ref = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(ref.current?.offsetWidth);

  const [height, setHeight] = useState(ref.current?.offsetHeight);

  const [isSidebarClosed, setIsSidebarClosed] = useState(false);

  const [preparedCodeSnippets, setPreparedCodeSnippets] = useState<
    {
      codeSnippet: ClientCodeSnippet;
      transformX: number;
      transformY: number;
    }[]
  >([]);

  const sidebarWidth = useResizablePanelWidthStore(
    (state) => state.sidebarWidth,
  );

  useLayoutEffect(() => {
    if (!ref.current) return;

    const localRef = ref.current;

    window.addEventListener("resize", () => {
      setWidth(localRef.offsetWidth);
    });

    return () => {
      window.removeEventListener("resize", () => {
        setWidth(localRef.offsetWidth);
      });
    };
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;

    setWidth(ref.current.offsetWidth);

    if (sidebarWidth === 0) {
      setIsSidebarClosed(true);
    } else {
      setIsSidebarClosed(false);
    }
  }, [sidebarWidth]);

  useLayoutEffect(() => {
    function init() {
      if (!ref.current) return;

      const rowCount = Math.floor(ref.current.offsetWidth / (CODE_WIDTH + gap));

      if (rowCount === 0) return [];

      const windowGap =
        (ref.current.offsetWidth - rowCount * (CODE_WIDTH + gap)) / 2;

      const renderSnippets: {
        codeSnippet: ClientCodeSnippet;
        transformX: number;
        transformY: number;
      }[] = [];

      let counter = 0;
      let maxHeight = 0;
      for (let i = 0; i < refList.current.length; i++) {
        const transformX =
          counter * (CODE_WIDTH + gap) + (isSidebarClosed ? windowGap : 0);
        counter++;
        if (counter >= rowCount) counter = 0;

        const transformY =
          i < rowCount
            ? 0
            : (renderSnippets[i - rowCount]?.transformY ?? 0) +
              (refList.current[i - rowCount]?.offsetHeight ?? 0) +
              gap;

        if (
          maxHeight <
          transformY + (refList.current[i]?.offsetHeight ?? 0) + gap
        ) {
          maxHeight =
            transformY + (refList.current[i]?.offsetHeight ?? 0) + gap;
        }

        renderSnippets.push({
          codeSnippet: codeSnippets[i]!,
          transformX,
          transformY,
        });
      }
      setPreparedCodeSnippets(renderSnippets);
      setHeight(maxHeight);
    }

    init();
    // TODO: check it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeSnippets, width]);

  return (
    <div
      style={{ height }}
      className="relative min-h-full min-w-full"
      ref={ref}
    >
      {isDeletedContainer && (
        <h2 className="p-[6px] pb-5 font-semibold text-red-2 md:p-0">
          Deleted
        </h2>
      )}
      {codeSnippets.map((codeSnippet, index) => (
        <CodeSnippetListItem
          key={codeSnippet.id}
          isDeletedContainer={isDeletedContainer}
          codeSnippet={codeSnippet}
          shouldHightlightCode={shouldHightlightCode}
          // @ts-ignore
          ref={(element) => (refList.current[index] = element!)}
          style={{
            transitionDuration: "0.3s",
            transitionProperty: "transform opacity",
            position: "absolute",
            width: `${CODE_WIDTH}px`,
            transform: `translate(${preparedCodeSnippets[index]?.transformX}px, ${preparedCodeSnippets[index]?.transformY}px)`,
          }}
        />
      ))}
    </div>
  );
};

export default CodeSnippetList;
