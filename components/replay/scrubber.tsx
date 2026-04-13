"use client";

interface Props {
  total: number;
  cursor: number;
  playing: boolean;
  onSeek: (n: number) => void;
  onPlayToggle: () => void;
}

export function Scrubber({
  total,
  cursor,
  playing,
  onSeek,
  onPlayToggle
}: Props) {
  const pct = total === 0 ? 0 : Math.round((cursor / total) * 100);
  const disabled = total === 0;

  return (
    <div className="rounded-md border border-border bg-panel p-3 flex items-center gap-3">
      <button
        onClick={() => onSeek(Math.max(0, cursor - 1))}
        disabled={disabled || cursor === 0}
        className="px-2 py-1 font-mono text-sm rounded border border-border hover:border-accent disabled:opacity-30"
        aria-label="step back"
      >
        ◀
      </button>
      <button
        onClick={onPlayToggle}
        disabled={disabled}
        className="px-3 py-1 font-mono text-sm rounded border border-accent bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-30 min-w-[60px]"
      >
        {playing ? "❚❚ pause" : "▶ play"}
      </button>
      <button
        onClick={() => onSeek(Math.min(total, cursor + 1))}
        disabled={disabled || cursor >= total}
        className="px-2 py-1 font-mono text-sm rounded border border-border hover:border-accent disabled:opacity-30"
        aria-label="step forward"
      >
        ▶
      </button>
      <input
        type="range"
        min={0}
        max={total}
        value={cursor}
        disabled={disabled}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
      <div className="font-mono text-xs text-muted min-w-[80px] text-right">
        {cursor}/{total} · {pct}%
      </div>
      <button
        onClick={() => onSeek(0)}
        disabled={disabled}
        className="px-2 py-1 font-mono text-xs rounded border border-border text-muted hover:border-accent hover:text-accent disabled:opacity-30"
      >
        ⟲ reset
      </button>
    </div>
  );
}
