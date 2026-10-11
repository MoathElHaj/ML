import { Fragment, type ReactNode } from "react";

/**
 * Renders the blog's lightweight text format safely (no HTML):
 * blank line = new paragraph, "## " / "### " = headings, "- " = list item,
 * "> " = quote, **bold** inline. Headings and lists don't need blank lines around them.
 */
export function Prose({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];

  const flush = () => {
    const k = out.length;
    if (para.length) {
      out.push(
        <p key={k}>
          {para.map((l, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(l)}
            </Fragment>
          ))}
        </p>,
      );
    } else if (list.length) {
      out.push(
        <ul key={k}>
          {list.map((l, j) => (
            <li key={j}>{inline(l)}</li>
          ))}
        </ul>,
      );
    } else if (quote.length) {
      out.push(<blockquote key={k}>{inline(quote.join(" "))}</blockquote>);
    }
    para = [];
    list = [];
    quote = [];
  };

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (/^###\s/.test(line)) {
      flush();
      out.push(<h3 key={out.length}>{inline(line.replace(/^###\s+/, ""))}</h3>);
    } else if (/^##\s/.test(line)) {
      flush();
      out.push(<h2 key={out.length}>{inline(line.replace(/^##\s+/, ""))}</h2>);
    } else if (/^[-*•]\s/.test(line)) {
      if (!list.length) flush();
      list.push(line.replace(/^[-*•]\s+/, ""));
    } else if (line.startsWith(">")) {
      if (!quote.length) flush();
      quote.push(line.replace(/^>\s?/, ""));
    } else {
      if (!para.length) flush();
      para.push(line);
    }
  }
  flush();

  return <div className="prose-bariq">{out}</div>;
}

function inline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
    );
}
