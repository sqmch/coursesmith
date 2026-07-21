/* ── popovers ──────────────────────────────────────────────────────────────
   The terminal's preferences panel was `{open && <Panel/>}` rendered inline: no
   portal (so it could be clipped by the pane it lived in), no outside-click or
   Escape dismissal, no focus return to the gear, and no collision handling near
   the window edge. Radix supplies all of that; the caller keeps owning `open`,
   because the study's panes already reason about whether the panel is showing. */

import * as RP from "@radix-ui/react-popover";
import type { ReactElement, ReactNode } from "react";

export function Popover(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The control that toggles it — rendered as-is, so it keeps its own class,
   *  aria-label, and handlers. */
  trigger: ReactElement;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const { open, onOpenChange, trigger, children, side = "bottom", align = "end" } = props;
  return (
    <RP.Root open={open} onOpenChange={onOpenChange}>
      <RP.Trigger asChild>{trigger}</RP.Trigger>
      <RP.Portal>
        <RP.Content
          className={["pop", props.className].filter(Boolean).join(" ")}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
        >
          {children}
        </RP.Content>
      </RP.Portal>
    </RP.Root>
  );
}
