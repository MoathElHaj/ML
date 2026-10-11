/* eslint-disable @next/next/no-img-element -- article images come from storage with unknown sizes */
import { Fragment, type ReactNode } from "react";

/**
 * Renders the content format used by the blog, projects and services, safely (no raw HTML):
 * blank line = new paragraph · "## " / "### " = headings · "- " = list item · "1. " = numbered item
 * "> " = quote · "![alt](url)" on its own line = image · [text](url) = link · **bold**.
 */
export function Prose({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let ordered: string[] = [];
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
    } else if (ordered.length) {
      out.push(
        <ol key={k}>
          {ordered.map((l, j) => (
            <li key={j}>{inline(l)}</li>
          ))}
        </ol>,
      );
    } else if (quote.length) {
      out.push(<blockquote key={k}>{inline(quote.join(" "))}</blockquote>);
    }
    para = [];
    list = [];
    ordered = [];
    quote = [];
  };

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (!line) {
      flush();
    } else if (image && safeUrl(image[2])) {
      flush();
      out.push(
        <figure key={out.length}>
          <img src={image[2]} alt={image[1]} loading="lazy" decoding="async" />
          {image[1] && <figcaption>{image[1]}</figcaption>}
        </figure>,
      );
    } else if (/^###\s/.test(line)) {
      flush();
      out.push(<h3 key={out.length}>{inline(line.replace(/^###\s+/, ""))}</h3>);
    } else if (/^##\s/.test(line)) {
      flush();
      out.push(<h2 key={out.length}>{inline(line.replace(/^##\s+/, ""))}</h2>);
    } else if (/^[-*•]\s/.test(line)) {
      if (!list.length) flush();
      list.push(line.replace(/^[-*•]\s+/, ""));
    } else if (/^\d+[.)]\s/.test(line)) {
      if (!ordered.length) flush();
      ordered.push(line.replace(/^\d+[.)]\s+/, ""));
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

/** Only http(s) and site-relative URLs: no javascript:, data: or other schemes. */
function safeUrl(url: string) {
  return /^(https?:\/\/|\/(?!\/))/i.test(url);
}

function inline(text: string): ReactNode[] {
  // Links first, then bold inside the remaining text.
  return text.split(/(\[[^\]]+\]\([^)\s]+\))/g).flatMap((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link && safeUrl(link[2])) {
      const external = /^https?:\/\//i.test(link[2]);
      return [
        <a key={`a${i}`} href={link[2]} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {bold(link[1], `a${i}`)}
        </a>,
      ];
    }
    return bold(part, String(i));
  });
}

function bold(text: string, key: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong> : <Fragment key={`${key}-${i}`}>{part}</Fragment>,
    );
}
