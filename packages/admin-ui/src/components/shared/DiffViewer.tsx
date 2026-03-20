interface DiffViewerProps {
  before: string;
  after: string;
  title?: string;
}

function tokenizeLine(text: string): string[] {
  return text.split(/(\s+)/);
}

function computeLineDiffs(
  beforeLines: string[],
  afterLines: string[],
): { type: 'same' | 'removed' | 'added' | 'changed'; before?: string; after?: string }[] {
  const result: { type: 'same' | 'removed' | 'added' | 'changed'; before?: string; after?: string }[] = [];
  const maxLen = Math.max(beforeLines.length, afterLines.length);

  for (let i = 0; i < maxLen; i++) {
    const b = beforeLines[i];
    const a = afterLines[i];

    if (b === undefined) {
      result.push({ type: 'added', after: a });
    } else if (a === undefined) {
      result.push({ type: 'removed', before: b });
    } else if (b === a) {
      result.push({ type: 'same', before: b, after: a });
    } else {
      result.push({ type: 'changed', before: b, after: a });
    }
  }

  return result;
}

export default function DiffViewer({ before, after, title }: DiffViewerProps) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const diffs = computeLineDiffs(beforeLines, afterLines);

  return (
    <div className="card overflow-hidden">
      {title && (
        <div className="card-header">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="grid grid-cols-2 divide-x divide-healthcare-border">
        {/* Before */}
        <div>
          <div className="px-4 py-2 bg-red-50 text-xs font-medium text-red-700 border-b border-healthcare-border">
            Before
          </div>
          <div className="text-sm font-mono">
            {diffs.map((d, i) => {
              if (d.type === 'added') {
                return (
                  <div key={i} className="px-4 py-0.5 bg-gray-50 text-gray-300 select-none">
                    &nbsp;
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className={`px-4 py-0.5 ${
                    d.type === 'removed'
                      ? 'bg-red-50 text-red-800'
                      : d.type === 'changed'
                      ? 'bg-amber-50 text-amber-900'
                      : ''
                  }`}
                >
                  <span className="text-xs text-gray-400 mr-3 select-none">
                    {String(i + 1).padStart(3)}
                  </span>
                  {d.before}
                </div>
              );
            })}
          </div>
        </div>

        {/* After */}
        <div>
          <div className="px-4 py-2 bg-emerald-50 text-xs font-medium text-emerald-700 border-b border-healthcare-border">
            After
          </div>
          <div className="text-sm font-mono">
            {diffs.map((d, i) => {
              if (d.type === 'removed') {
                return (
                  <div key={i} className="px-4 py-0.5 bg-gray-50 text-gray-300 select-none">
                    &nbsp;
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className={`px-4 py-0.5 ${
                    d.type === 'added'
                      ? 'bg-emerald-50 text-emerald-800'
                      : d.type === 'changed'
                      ? 'bg-amber-50 text-amber-900'
                      : ''
                  }`}
                >
                  <span className="text-xs text-gray-400 mr-3 select-none">
                    {String(i + 1).padStart(3)}
                  </span>
                  {d.after}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
