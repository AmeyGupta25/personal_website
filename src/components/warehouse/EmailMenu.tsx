import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown, Copy, Mail } from "lucide-react";

/** The Email button. A bare mailto: does nothing for people without a mail app, so it opens a
    menu instead: compose in Gmail or Outlook on the web, the mail app, or copy the address. */
const EmailMenu = ({ email }: { email: string }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const to = encodeURIComponent(email);

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const outside = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  // ↑ / ↓ move between the choices
  const onMenuKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        close(true);
      }, 1200);
    } catch {
      window.prompt("Copy my email:", email);
    }
  };

  const item =
    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[14px] font-bold hover:bg-wh-soft focus-visible:bg-wh-soft";
  const links = [
    { label: "Open in Gmail", href: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}` },
    { label: "Open in Outlook", href: `https://outlook.office.com/mail/deeplink/compose?to=${to}` },
    { label: "Open my mail app", href: `mailto:${email}`, self: true },
  ];

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="email-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-wh-ink bg-wh-ink px-3.5 py-2 text-[14px] font-bold text-wh-paper transition-colors hover:bg-wh-body"
      >
        <Mail className="h-4 w-4" aria-hidden />
        Email
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div
          ref={menu}
          id="email-menu"
          role="menu"
          aria-label="Email Amey"
          onKeyDown={onMenuKey}
          className="absolute left-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border-2 border-wh-ink bg-wh-paper p-1.5 shadow-[0_12px_28px_-12px_rgb(0_0_0/0.45)]"
        >
          <p className="select-all break-all px-3 pb-2 pt-1.5 font-mono text-[13px] font-semibold text-wh-body">{email}</p>
          <div className="border-t border-wh-line pt-1">
            {links.map((l) => (
              <a
                key={l.label}
                role="menuitem"
                href={l.href}
                target={l.self ? undefined : "_blank"}
                rel="noopener noreferrer"
                onClick={() => close()}
                className={item}
              >
                {l.label}
              </a>
            ))}
            <button type="button" role="menuitem" onClick={copy} className={item}>
              <span aria-live="polite">{copied ? "Copied" : "Copy address"}</span>
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4 text-wh-mute" aria-hidden />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailMenu;
