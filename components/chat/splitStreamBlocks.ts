/** Split streamed markdown into animatable blocks (keeps table rows together). */
export function splitStreamBlocks(content: string): string[] {
  if (!content) return [];

  const lines = content.split("\n");
  const blocks: string[] = [];
  let tableLines: string[] = [];

  const flushTable = () => {
    if (tableLines.length > 0) {
      blocks.push(tableLines.join("\n"));
      tableLines = [];
    }
  };

  for (const line of lines) {
    const isTableRow = /^\s*\|/.test(line);
    if (isTableRow) {
      tableLines.push(line);
      continue;
    }
    flushTable();
    blocks.push(line);
  }
  flushTable();

  return blocks.length > 0 ? blocks : [content];
}
