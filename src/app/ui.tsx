import Link from "next/link";

export const CRITERIA = [
  { key: "task_response", col: "band_tr", short: "TR", label: "Task Response" },
  { key: "coherence_cohesion", col: "band_cc", short: "CC", label: "Coherence & Cohesion" },
  { key: "lexical_resource", col: "band_lr", short: "LR", label: "Lexical Resource" },
  { key: "grammatical_range", col: "band_gra", short: "GRA", label: "Grammar" },
] as const;

export const TARGET_BAND = 7.0;

export const CATEGORY_LABEL: Record<string, string> = {
  article: "Articles",
  tense: "Tense",
  sva: "Subject–verb agreement",
  preposition: "Prepositions",
  collocation: "Collocation",
  word_form: "Word form",
  word_choice: "Word choice",
  punctuation: "Punctuation",
  word_order: "Word order",
  other: "Other",
};

export function formatDate(sqlite: string) {
  return new Date(sqlite.replace(" ", "T") + "Z").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** A band number. Colour has one job: green means the target is met. */
export function Band({ value, size = "md" }: { value: number | null; size?: "sm" | "md" | "lg" | "xl" }) {
  const cls = { sm: "text-base", md: "text-2xl", lg: "text-5xl", xl: "text-7xl" }[size];
  if (value == null) return <span className={`font-mono tabular-nums text-muted ${cls}`}>–</span>;
  const tone = value >= TARGET_BAND ? "text-good" : "text-foreground";
  return (
    <span className={`font-mono font-medium tabular-nums leading-none tracking-tight ${tone} ${cls}`}>
      {value.toFixed(1)}
    </span>
  );
}

/**
 * The band ladder: where you are on 4–9, and where the target sits.
 * Reads at a glance in a way a bare number never does.
 */
export function BandScale({ value, target = TARGET_BAND }: { value: number | null; target?: number }) {
  const min = 4;
  const max = 9;
  const pos = (b: number) => `${((b - min) / (max - min)) * 100}%`;
  return (
    <div className="relative mt-5 h-8 w-full max-w-md">
      <div className="absolute top-3 h-1 w-full rounded-full bg-line" />
      {value != null && (
        <div
          className={`absolute top-3 h-1 rounded-full ${value >= target ? "bg-good" : "bg-foreground"}`}
          style={{ width: pos(Math.min(value, max)) }}
        />
      )}
      {[4, 5, 6, 7, 8, 9].map((b) => (
        <span
          key={b}
          className="absolute top-6 -translate-x-1/2 font-mono text-[10px] text-muted"
          style={{ left: pos(b) }}
        >
          {b}
        </span>
      ))}
      <span
        title={`Target ${target.toFixed(1)}`}
        className="absolute top-[7px] h-4 w-0.5 -translate-x-1/2 bg-accent"
        style={{ left: pos(target) }}
      />
      {value != null && (
        <span
          className={`absolute top-[5px] h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-background ${
            value >= target ? "bg-good" : "bg-foreground"
          }`}
          style={{ left: pos(Math.min(value, max)) }}
        />
      )}
    </div>
  );
}

/** Four tiny bars, one per criterion — the shape of a score at a glance. */
export function CriteriaBars({ bands }: { bands: (number | null)[] }) {
  return (
    <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden>
      {bands.map((b, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm ${b != null && b >= TARGET_BAND ? "bg-good" : "bg-muted/60"}`}
          style={{ height: `${b == null ? 4 : 6 + ((b - 4) / 5) * 18}px` }}
        />
      ))}
    </span>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={`card ${hover ? "card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-3">{children}</h2>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-10 text-center">
      <p className="text-lg font-medium tracking-tight">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      <Link href="/write" className="btn-primary mt-6">
        Start a timed essay <span aria-hidden>→</span>
      </Link>
    </Card>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-foreground" />
      {label}
    </p>
  );
}
