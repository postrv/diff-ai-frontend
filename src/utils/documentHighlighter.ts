// File: src/utils/documentHighlighter.ts

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    line: string;
}

interface DiffResult {
    diff_lines: DiffLine[];
    stats: any;
    ai_summary: string;
}

/**
 * Highlights changes in the merged document based on the diff result
 * Returns HTML string with highlighted content
 */
export const highlightMergedContent = (
    mergedContent: string,
    diffResult: DiffResult
): string => {
    if (!mergedContent || !diffResult) {
        return mergedContent;
    }

    // Split content into lines for processing
    const mergedLines = mergedContent.split('\n');
    const highlightedLines: string[] = [];

    // Track which lines were added in the diff
    const addedLines = new Set<string>();
    diffResult.diff_lines.forEach(line => {
        if (line.type === 'added') {
            addedLines.add(line.line.trim());
        }
    });

    // Process each merged line to see if it matches any added lines
    mergedLines.forEach(line => {
        const trimmedLine = line.trim();
        if (addedLines.has(trimmedLine)) {
            // This is a newly added line - highlight it green
            highlightedLines.push(`<span class="added-content">${escapeHtml(line)}</span>`);
        } else if (line.includes('<<<') && line.includes('>>>')) {
            // This is a conflict marker - highlight it orange
            highlightedLines.push(`<span class="conflict-content">${escapeHtml(line)}</span>`);
        } else {
            // Regular unchanged line
            highlightedLines.push(escapeHtml(line));
        }
    });

    return highlightedLines.join('\n');
};

/**
 * Creates CSS styles for highlighted content
 */
export const getHighlightStyles = (): string => {
    return `
    .added-content {
      background-color: rgba(76, 175, 80, 0.15);
      display: block;
      border-left: 3px solid #4caf50;
      padding-left: 8px;
    }
    
    .conflict-content {
      background-color: rgba(255, 152, 0, 0.15);
      display: block;
      border-left: 3px solid #ff9800;
      padding-left: 8px;
    }
  `;
};

/**
 * Escape HTML special characters to prevent XSS
 */
const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export default {
    highlightMergedContent,
    getHighlightStyles
};