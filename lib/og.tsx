import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Image de partage commune : carte « puce » sur fond de circuit imprimé.
export function ogImage({ repere, titre, sousTitre }: { repere: string; titre: string; sousTitre: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#07110d",
          backgroundImage:
            "linear-gradient(#12261c 2px, transparent 2px), linear-gradient(90deg, #12261c 2px, transparent 2px)",
          backgroundSize: "60px 60px",
          color: "#e8efe9",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#d9a441" }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: "#3ddc84" }} />
          {repere}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            padding: 48,
            border: "3px solid #d9a441",
            borderRadius: 12,
            background: "#0c1a14",
          }}
        >
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{titre}</div>
          <div style={{ fontSize: 34, color: "#a9bfb2", lineHeight: 1.3 }}>{sousTitre}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a9bfb2" }}>
          <span>{site.nom}</span>
          <span>
            {site.titre} · {site.ecole}
          </span>
        </div>
      </div>
    ),
    ogSize,
  );
}
