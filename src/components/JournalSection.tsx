import { useEffect, useRef, useState, type ReactNode } from "react";

export function revealJournalSection(id: string) {
  const element = document.getElementById(id);
  if (element instanceof HTMLDetailsElement) {
    element.open = true;
    element.querySelector("summary")?.focus({ preventScroll: true });
  }
}

// O conteúdo só monta na primeira abertura e permanece montado ao recolher.
export function JournalSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const element = useRef<HTMLDetailsElement>(null);
  const [visited, setVisited] = useState(false);
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === `#${id}` && element.current) {
        element.current.open = true;
        setVisited(true);
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [id]);
  return (
    <details
      ref={element}
      id={id}
      className="journal-fold"
      onToggle={(event) => {
        if (event.currentTarget.open) setVisited(true);
      }}
    >
      <summary className="touch-target journal-fold-summary">
        <span>
          <span className="journal-fold-title">{title}</span>
          <span className="journal-fold-description">{description}</span>
        </span>
        <span className="journal-fold-plus" aria-hidden>
          +
        </span>
      </summary>
      <div className="journal-fold-body">{visited ? children : null}</div>
    </details>
  );
}
