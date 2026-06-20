import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <span className="relative grid place-items-center w-9 h-9 rounded-xl brand-gradient shadow-lg shadow-[rgba(124,108,255,0.4)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 5v14l11-7L7 5Z" fill="white" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-[var(--danger)] ring-2 ring-[var(--bg)]" />
      </span>
      <span className="text-[1.15rem] font-semibold tracking-tight">
        Translume
      </span>
    </Link>
  );
}
