import { Fragment } from "react";
import { tokenize } from "@/lib/placeholders";
import { Placeholder } from "./Placeholder";

/** Renders a content string as React text, with **bold** runs and visible [[placeholders]]. */
export function Text({ children }: { children: string }) {
  return (
    <>
      {tokenize(children).map((token, i) => {
        if (token.kind === "bold") return <strong key={i}>{token.value}</strong>;
        if (token.kind === "placeholder") return <Placeholder key={i}>{token.value}</Placeholder>;
        return <Fragment key={i}>{token.value}</Fragment>;
      })}
    </>
  );
}
