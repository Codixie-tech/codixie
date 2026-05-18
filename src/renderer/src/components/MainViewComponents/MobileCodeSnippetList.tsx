import CodeSnippetListItem from "@/components/MainViewComponents/CodeSnippetListItem";

const MobileCodeSnippetList = ({
  codeSnippets,
  shouldHightlightCode,
  isDeletedContainer,
}: {
  codeSnippets: ClientCodeSnippet[];
  shouldHightlightCode: boolean;
  isDeletedContainer: boolean;
}) => {
  return (
    <div className="relative h-full w-full">
      {isDeletedContainer && (
        <h2 className="p-[6px] pb-5 font-semibold text-red-2 md:p-0">
          Deleted
        </h2>
      )}
      {codeSnippets.map((codeSnippet) => (
        <CodeSnippetListItem
          isDeletedContainer={isDeletedContainer}
          key={codeSnippet.id}
          codeSnippet={codeSnippet}
          shouldHightlightCode={shouldHightlightCode}
        />
      ))}
    </div>
  );
};

export default MobileCodeSnippetList;
