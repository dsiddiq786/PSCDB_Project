import { useState } from "react";
import { initials } from "../lib/format";

/* Profile picture, or initials on a coloured circle when there is no picture or it fails to load. */
export default function Avatar({ name = "", src = "", size = "md", tone = "emerald", className = "" }) {
  const [failedSrc, setFailedSrc] = useState("");
  const sizes = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg", xl: "h-28 w-28 text-3xl" };
  const tones = { emerald: "bg-emerald-700 text-white", soft: "bg-emerald-50 text-emerald-800", blue: "bg-cyber-50 text-cyber-700", gold: "bg-gold-400 text-emerald-950" };
  const showImage = src && failedSrc !== src;
  return (
    <span className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-bold ${sizes[size]} ${showImage ? "bg-slate-100" : tones[tone]} ${className}`}>
      {showImage ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} /> : initials(name) || "?"}
    </span>
  );
}
