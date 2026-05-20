type Match = {
  indices: number[][];
  key: string;
  value: string;
};

type SearchResult<T> = {
  item: T;
  matches: Match[];
};

const getIndices = (text: string, query: string) => {
  const position = text.search(query);
  if (position === -1) return -1;
  return [position, position + query.length - 1];
};

export const search = <T>(
  query: string,
  clientCodeSnippets: Array<T>,
  keys: string[],
  options?: {
    ignoreCases?: boolean;
  },
) => {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];
  const result: SearchResult<T>[] = [];

  const { ignoreCases = false } = options ?? {};
  const preparedQuery = ignoreCases ? trimmedQuery.toLowerCase() : trimmedQuery;

  for (const codeSnippet of clientCodeSnippets) {
    // prepare result. If nothing founded we will delete last result in the end
    result.push({
      item: codeSnippet,
      matches: [],
    });

    for (const key of keys) {
      const rawValue = (codeSnippet as Record<string, unknown>)[key];
      const value = ignoreCases
        ? String(rawValue).toLowerCase()
        : String(rawValue);

      if (!rawValue || typeof rawValue !== "string") return [];

      const initValue = rawValue;

      const match: Match = { key, value: initValue, indices: [] };

      let index: number[] | -1 = getIndices(value, preparedQuery);
      if (index === -1) continue;
      match.indices.push(index);
      let offset = index[1];
      let tempValue = value;
      let searching = true;
      while (searching) {
        tempValue = tempValue.slice(index[1]);
        index = getIndices(tempValue, preparedQuery);
        if (index === -1) {
          searching = false;
        } else {
          match.indices.push([offset + index[0], offset + index[1]]);
          offset = offset + index[1];
        }
      }
      result[result.length - 1]?.matches.push(match);
    }

    // if nothing found delete last result
    if (result[result.length - 1]?.matches.length === 0) {
      result.pop();
    }
  }

  return result;
};

export const highlight = <T>(
  fuseSearchResult: SearchResult<T>[],
  highlightClassName = "cb-hightlight",
) => {
  const set = (obj: T, path: string, value: string) => {
    const pathValue = path.split(".");
    let i;

    for (i = 0; i < pathValue.length - 1; i++) {
      obj = (obj as Record<string, unknown>)[pathValue[i]] as T;
    }

    (obj as Record<string, unknown>)[pathValue[i]] = value;
  };

  const generateHighlightedText = (inputText: string, regions: number[][]) => {
    let content = "";
    let nextUnhighlightedRegionStartingIndex = 0;

    regions.forEach((region) => {
      const lastRegionNextIndex = region[1] + 1;

      content += [
        inputText.substring(nextUnhighlightedRegionStartingIndex, region[0]),
        `<span class="${highlightClassName}">`,
        inputText.substring(region[0], lastRegionNextIndex),
        "</span>",
      ].join("");

      nextUnhighlightedRegionStartingIndex = lastRegionNextIndex;
    });

    content += inputText.substring(nextUnhighlightedRegionStartingIndex);

    return content;
  };

  return fuseSearchResult
    .filter(({ matches }) => matches?.length)
    .map(({ item, matches }) => {
      const highlightedItem = { ...item };

      matches.forEach((match) => {
        set(
          highlightedItem,
          match.key,
          generateHighlightedText(match.value, match.indices),
        );
      });

      return highlightedItem;
    });
};

const sanitizeHtml = (html: string | undefined) => {
  if (!html) return "";
  return html
    .split("")
    .map((char) => {
      if (char === "<") {
        return "&lt;";
      }
      if (char === ">") {
        return "&gt;";
      }
      return char;
    })
    .join("");
};

export const prepareForRender = (html: string) => {
  // TODO: Thins about another solution without regexes
  // TODO: Needs implement to highlightedLine
  const exception =
    /([^]*?)(<span class="cb-hightlight">)([^]*?)(<\/span>)([^|.]*?)/gm;

  const matches = html.matchAll(exception);

  return Array.from(matches)
    .map((match, index, arr) => {
      if (index === arr.length - 1) {
        const lastElement = arr[index];
        const startPosition = lastElement.index;

        const endPosition = startPosition + match[0].length;

        return (
          sanitizeHtml(match[1]) +
          match[2] +
          sanitizeHtml(match[3]) +
          match[4] +
          sanitizeHtml(match[5]) +
          match.input.slice(endPosition)
        );
      }

      return (
        sanitizeHtml(match[1]) +
        match[2] +
        sanitizeHtml(match[3]) +
        match[4] +
        sanitizeHtml(match[5])
      );
    })
    .join("");
};
