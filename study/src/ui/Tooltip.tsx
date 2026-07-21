/* ── tooltips ──────────────────────────────────────────────────────────────
   The study used the native `title` attribute in 28 places, several carrying
   real explanatory prose ("Launch <agent> in this repo with nothing typed…").
   Native titles never appear on keyboard focus, can't be styled, truncate at
   the OS's discretion, and sit behind a ~1s delay nobody can tune. This wraps
   Radix so the same text is reachable by keyboard, dismissible with Escape,
   and collision-aware near a window edge.

   Rules of use:
   - A tooltip EXPLAINS; it never carries the only copy of something essential.
     An icon-only control still needs its own `label`/`aria-label`.
   - Keep `title` on nothing. If both were present the browser would render the
     native one over this.
   - Disabled controls swallow pointer events, so the wrapper below re-hosts
     them in a focusable span — several of the study's buttons spend most of
     their life disabled and explaining *why* is exactly when the tip matters. */

import * as RT from "@radix-ui/react-tooltip";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/** One provider at the root. 400ms is long enough not to flicker on a pass-by
 *  and short enough to feel answerable; skipDelay makes a second tip in the
 *  same cluster instant. */
export function TooltipProvider(props: { children: ReactNode }) {
  return (
    <RT.Provider delayDuration={400} skipDelayDuration={200}>
      {props.children}
    </RT.Provider>
  );
}

export function Tooltip(props: {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Widen past the default measure for tips that run to a sentence or two. */
  wide?: boolean;
}) {
  const { content, children, side = "bottom", align = "center", wide } = props;
  if (!content) return children;

  // A disabled control fires no pointer events, so Radix would never see the
  // hover. Re-host it in a span that can: the span takes the focus and the
  // pointer, the control stays genuinely disabled.
  const disabled =
    isValidElement<{ disabled?: boolean }>(children) && children.props.disabled === true;
  const trigger = disabled ? (
    // jsx-a11y is right that a bare focusable span is usually a mistake; here it
    // is a focus surrogate for a control the browser has removed from the tab
    // order, which is precisely the case where the explanation matters most and
    // no truthful role exists to describe it. Deliberate, and narrow.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <span className="tooltip-disabled-host" tabIndex={0}>
      {cloneElement(children, { style: { pointerEvents: "none" } } as never)}
    </span>
  ) : (
    children
  );

  return (
    <RT.Root>
      <RT.Trigger asChild>{trigger}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          className={wide ? "tip tip-wide" : "tip"}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
        >
          {content}
          <RT.Arrow className="tip-arrow" width={10} height={5} />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
