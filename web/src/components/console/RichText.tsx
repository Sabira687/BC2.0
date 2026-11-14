import { toBlocks, type Span } from "@/lib/richtext";

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => (s.bold ? <strong key={i}>{s.text}</strong> : s.code ? <code key={i}>{s.text}</code> : <span key={i}>{s.text}</span>))}
    </>
  );
}

/** Claude's reply with light formatting. Text nodes only (no HTML). */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {toBlocks(text).map((b, i) => {
        switch (b.type) {
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Spans spans={it} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Spans spans={it} />
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={i} style={{ whiteSpace: "pre-wrap" }}>
                <Spans spans={b.spans} />
              </blockquote>
            );
          case "pre":
            return <pre key={i}>{b.text}</pre>;
          default:
            return (
              <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                <Spans spans={b.spans} />
              </p>
            );
        }
      })}
    </div>
  );
}
