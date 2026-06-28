"use client";

import { useEffect, useState } from "react";
import { IconLink, IconCheck, IconDownload } from "./icons";

export function ShareDialog({
  open,
  onClose,
  recId,
  title,
  downloadUrl,
  allowDownload = true,
  mimeType = "video/webm",
}: {
  open: boolean;
  onClose: () => void;
  recId: string;
  title: string;
  downloadUrl: string | null;
  allowDownload?: boolean;
  mimeType?: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const link = `${origin}/v/${recId}`;
  const embed = `<iframe src="${origin}/embed/${recId}" width="640" height="360" style="border:0;border-radius:12px" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

  // Save with the real container extension (mp4 when recorded as MP4, else webm).
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const fileName = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "translume"}.${ext}`;
  // For cross-origin (cloud) URLs, ask the server to force a download with this
  // name via the ?download param; the local blob URL uses the download attr.
  const href =
    downloadUrl && /^https?:/i.test(downloadUrl)
      ? `${downloadUrl}${downloadUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(fileName)}`
      : downloadUrl;

  function copy(text: string, which: "link" | "embed") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="glass-strong w-full max-w-lg rounded-2xl p-6 fade-up"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Share “{title}”</h2>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Anyone with the link can watch.
        </p>

        {/* Link */}
        <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Link
        </label>
        <div className="mt-1.5 flex gap-2">
          <input readOnly value={link} className="input flex-1 text-sm" />
          <button onClick={() => copy(link, "link")} className="btn btn-primary px-4">
            {copied === "link" ? <IconCheck width={16} height={16} /> : <IconLink width={16} height={16} />}
            {copied === "link" ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Embed */}
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Embed
        </label>
        <textarea
          readOnly
          value={embed}
          rows={3}
          className="input mt-1.5 resize-none font-mono text-xs"
        />
        <button
          onClick={() => copy(embed, "embed")}
          className="btn btn-ghost mt-2 px-4 py-2 text-sm"
        >
          {copied === "embed" ? <IconCheck width={16} height={16} /> : <IconLink width={16} height={16} />}
          {copied === "embed" ? "Copied embed code" : "Copy embed code"}
        </button>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
          {href && allowDownload ? (
            <a
              href={href}
              download={fileName}
              className="btn btn-ghost px-4 py-2 text-sm"
            >
              <IconDownload width={16} height={16} />
              Download {ext.toUpperCase()}
            </a>
          ) : (
            <span />
          )}
          <button onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
