export interface DiffLine {
  type: 'added' | 'deleted' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

/**
 * Computes a simple Myers-style line diff between original and modified text
 */
export function computeLineDiff(original: string, modified: string): DiffLine[] {
  const oldLines = original.split('\n');
  const newLines = modified.split('\n');

  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  // Simple LCS / greedy diff algorithm
  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      diff.push({
        type: 'unchanged',
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
        content: oldLines[i],
      });
      i++;
      j++;
    } else {
      // Look ahead to see if oldLines[i] appears soon in newLines
      let foundInNew = -1;
      for (let k = j + 1; k < Math.min(j + 5, newLines.length); k++) {
        if (newLines[k] === oldLines[i]) {
          foundInNew = k;
          break;
        }
      }

      // Look ahead to see if newLines[j] appears soon in oldLines
      let foundInOld = -1;
      for (let k = i + 1; k < Math.min(i + 5, oldLines.length); k++) {
        if (oldLines[k] === newLines[j]) {
          foundInOld = k;
          break;
        }
      }

      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew - j <= foundInOld - i)) {
        // Elements in newLines were added
        while (j < foundInNew) {
          diff.push({
            type: 'added',
            newLineNumber: j + 1,
            content: newLines[j],
          });
          j++;
        }
      } else if (foundInOld !== -1) {
        // Elements in oldLines were removed
        while (i < foundInOld) {
          diff.push({
            type: 'deleted',
            oldLineNumber: i + 1,
            content: oldLines[i],
          });
          i++;
        }
      } else {
        // Substitution: line i deleted, line j added
        diff.push({
          type: 'deleted',
          oldLineNumber: i + 1,
          content: oldLines[i],
        });
        diff.push({
          type: 'added',
          newLineNumber: j + 1,
          content: newLines[j],
        });
        i++;
        j++;
      }
    }
  }

  // Trailing removals
  while (i < oldLines.length) {
    diff.push({
      type: 'deleted',
      oldLineNumber: i + 1,
      content: oldLines[i],
    });
    i++;
  }

  // Trailing additions
  while (j < newLines.length) {
    diff.push({
      type: 'added',
      newLineNumber: j + 1,
      content: newLines[j],
    });
    j++;
  }

  return diff;
}
