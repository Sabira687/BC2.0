/** Concept art for the Set 01 items (placeholder illustrations; final art comes later). Plain JSX, no raw HTML. */
import { useId } from "react";
import type { ItemKind } from "@/lib/types";

function usePrefix(): string {
  return `art${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

function Key() {
  const p = usePrefix();
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" width="92%" height="92%" style={{ position: "relative" }}>
  <defs><linearGradient id={`${p}aigoBrass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF4C2"/><stop offset=".3" stopColor="#F8C65A"/><stop offset=".68" stopColor="#C9841C"/><stop offset="1" stopColor="#6E400C"/></linearGradient><radialGradient id={`${p}aigoKeyGlow`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#BFDBFE" stopOpacity=".7"/><stop offset="1" stopColor="#60A5FA" stopOpacity="0"/></radialGradient>
  <radialGradient id={`${p}aigoKeyGem`} cx=".35" cy=".35" r=".7"><stop offset="0" stopColor="#E0F2FE"/><stop offset=".45" stopColor="#60A5FA"/><stop offset="1" stopColor="#1E3A8A"/></radialGradient></defs>
  <circle cx="100" cy="100" r="84" fill={`url(#${p}aigoKeyGlow)`}/>
  <g transform="rotate(-38 100 100)">
    <rect x="80" y="93" width="96" height="14" rx="5" fill={`url(#${p}aigoBrass)`}/>
    <rect x="86" y="95" width="86" height="3" rx="1.5" fill="#FFFBEB" opacity=".75"/>
    <rect x="128" y="104" width="11" height="24" rx="2" fill={`url(#${p}aigoBrass)`}/>
    <rect x="145" y="104" width="11" height="34" rx="2" fill={`url(#${p}aigoBrass)`}/>
    <rect x="162" y="104" width="11" height="18" rx="2" fill={`url(#${p}aigoBrass)`}/>
    <rect x="74" y="86" width="10" height="28" rx="3" fill={`url(#${p}aigoBrass)`}/>
    <circle cx="48" cy="100" r="27" fill="none" stroke={`url(#${p}aigoBrass)`} strokeWidth="13"/>
    <circle cx="48" cy="100" r="33" fill="none" stroke="#FFF4C2" strokeWidth="1.2" opacity=".55"/>
    <circle cx="48" cy="100" r="10" fill={`url(#${p}aigoKeyGem)`} stroke="#FFF4C2" strokeWidth="2"/>
  </g>
  <path d="M150 41 L151.75 46.25 L157 48 L151.75 49.75 L150 55 L148.25 49.75 L143 48 L148.25 46.25 Z" fill="#FFFFFF" opacity="0.9"/><path d="M42 145 L43.25 148.75 L47 150 L43.25 151.25 L42 155 L40.75 151.25 L37 150 L40.75 148.75 Z" fill="#FFFFFF" opacity="0.7"/><path d="M166 146 L167.0 149.0 L170 150 L167.0 151.0 L166 154 L165.0 151.0 L162 150 L165.0 149.0 Z" fill="#FFFFFF" opacity="0.6"/>
</svg>
  );
}

function Lock() {
  const p = usePrefix();
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" width="92%" height="92%" style={{ position: "relative" }}>
  <defs><radialGradient id={`${p}aigoLockGlow`} cx=".5" cy=".55" r=".5"><stop offset="0" stopColor="#F5D0FE" stopOpacity=".7"/><stop offset="1" stopColor="#E879F9" stopOpacity="0"/></radialGradient>
  <linearGradient id={`${p}aigoSilver`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset=".5" stopColor="#CBD5E1"/><stop offset="1" stopColor="#64748B"/></linearGradient>
  <linearGradient id={`${p}aigoLockBody`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FAE8FF"/><stop offset=".3" stopColor="#E879F9"/><stop offset=".7" stopColor="#A21CAF"/><stop offset="1" stopColor="#4A044E"/></linearGradient></defs>
  <circle cx="100" cy="112" r="86" fill={`url(#${p}aigoLockGlow)`}/>
  <path d="M64 98 V70 a36 36 0 0 1 72 0 V98" fill="none" stroke={`url(#${p}aigoSilver)`} strokeWidth="15" strokeLinecap="round"/>
  <rect x="42" y="88" width="116" height="94" rx="18" fill={`url(#${p}aigoLockBody)`}/>
  <rect x="49" y="95" width="102" height="80" rx="13" fill="none" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="2"/>
  <circle cx="100" cy="136" r="38" fill="#3B0764" opacity=".35"/>
  <circle cx="100.0" cy="107.0" r="5" fill="#FDE68A"/><rect x="98.0" y="109.0" width="4" height="8" rx="1" fill="#FDE68A"/><circle cx="125.7" cy="125.7" r="5" fill="#2E1065"/><rect x="123.7" y="127.7" width="4" height="8" rx="1" fill="#2E1065"/><circle cx="115.9" cy="155.8" r="5" fill="#2E1065"/><rect x="113.9" y="157.8" width="4" height="8" rx="1" fill="#2E1065"/><circle cx="84.1" cy="155.8" r="5" fill="#2E1065"/><rect x="82.1" y="157.8" width="4" height="8" rx="1" fill="#2E1065"/><circle cx="74.3" cy="125.7" r="5" fill="#2E1065"/><rect x="72.3" y="127.7" width="4" height="8" rx="1" fill="#2E1065"/>
  <circle cx="56" cy="102" r="3.5" fill="#FAE8FF"/><circle cx="144" cy="102" r="3.5" fill="#FAE8FF"/><circle cx="56" cy="168" r="3.5" fill="#FAE8FF"/><circle cx="144" cy="168" r="3.5" fill="#FAE8FF"/>
  <path d="M160 39 L161.75 44.25 L167 46 L161.75 47.75 L160 53 L158.25 47.75 L153 46 L158.25 44.25 Z" fill="#FFFFFF" opacity="0.9"/><path d="M36 59 L37.25 62.75 L41 64 L37.25 65.25 L36 69 L34.75 65.25 L31 64 L34.75 62.75 Z" fill="#FFFFFF" opacity="0.7"/>
</svg>
  );
}

function Compass() {
  const p = usePrefix();
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" width="92%" height="92%" style={{ position: "relative" }}>
  <defs><linearGradient id={`${p}aigoBrass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF4C2"/><stop offset=".3" stopColor="#F8C65A"/><stop offset=".68" stopColor="#C9841C"/><stop offset="1" stopColor="#6E400C"/></linearGradient><radialGradient id={`${p}aigoCompGlow`} cx=".5" cy=".55" r=".5"><stop offset="0" stopColor="#BBF7D0" stopOpacity=".65"/><stop offset="1" stopColor="#4ADE80" stopOpacity="0"/></radialGradient>
  <radialGradient id={`${p}aigoCompFace`} cx=".4" cy=".35" r=".75"><stop offset="0" stopColor="#166534"/><stop offset="1" stopColor="#052E16"/></radialGradient>
  <linearGradient id={`${p}aigoNeedle`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F0FDF4"/><stop offset="1" stopColor="#22C55E"/></linearGradient></defs>
  <circle cx="100" cy="108" r="86" fill={`url(#${p}aigoCompGlow)`}/>
  <circle cx="100" cy="30" r="10" fill="none" stroke={`url(#${p}aigoBrass)`} strokeWidth="5"/>
  <circle cx="100" cy="108" r="68" fill={`url(#${p}aigoBrass)`}/>
  <circle cx="100" cy="108" r="58" fill={`url(#${p}aigoCompFace)`}/>
  <line x1="100.0" y1="64.0" x2="100.0" y2="55.0" stroke="#DCFCE7" strokeWidth="2.2" opacity=".85"/><line x1="118.4" y1="63.7" x2="120.3" y2="59.0" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="133.9" y1="74.1" x2="137.5" y2="70.5" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="144.3" y1="89.6" x2="149.0" y2="87.7" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="144.0" y1="108.0" x2="153.0" y2="108.0" stroke="#DCFCE7" strokeWidth="2.2" opacity=".85"/><line x1="144.3" y1="126.4" x2="149.0" y2="128.3" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="133.9" y1="141.9" x2="137.5" y2="145.5" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="118.4" y1="152.3" x2="120.3" y2="157.0" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="100.0" y1="152.0" x2="100.0" y2="161.0" stroke="#DCFCE7" strokeWidth="2.2" opacity=".85"/><line x1="81.6" y1="152.3" x2="79.7" y2="157.0" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="66.1" y1="141.9" x2="62.5" y2="145.5" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="55.7" y1="126.4" x2="51.0" y2="128.3" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="56.0" y1="108.0" x2="47.0" y2="108.0" stroke="#DCFCE7" strokeWidth="2.2" opacity=".85"/><line x1="55.7" y1="89.6" x2="51.0" y2="87.7" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="66.1" y1="74.1" x2="62.5" y2="70.5" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/><line x1="81.6" y1="63.7" x2="79.7" y2="59.0" stroke="#DCFCE7" strokeWidth="1.2" opacity=".85"/>
  <text x="100" y="72" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="12" fill="#F0FDF4">N</text>
  <g transform="rotate(32 100 108)">
    <path d="M100 62 L110 108 L90 108 Z" fill={`url(#${p}aigoNeedle)`}/>
    <path d="M100 154 L110 108 L90 108 Z" fill="#CBD5E1" opacity=".85"/>
  </g>
  <circle cx="100" cy="108" r="7" fill={`url(#${p}aigoBrass)`} stroke="#FFF4C2" strokeWidth="1.5"/>
  <path d="M62 82 A46 46 0 0 1 98 60" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round"/>
  <path d="M162 45 L163.75 50.25 L169 52 L163.75 53.75 L162 59 L160.25 53.75 L155 52 L160.25 50.25 Z" fill="#FFFFFF" opacity="0.9"/><path d="M40 155 L41.25 158.75 L45 160 L41.25 161.25 L40 165 L38.75 161.25 L35 160 L38.75 158.75 Z" fill="#FFFFFF" opacity="0.7"/>
</svg>
  );
}

/** The illustration for an item kind: Three-Tooth Key (learn), Proving Lock (test), Pocket Compass (help). */
export function ItemArt({ kind }: { kind: ItemKind }) {
  return kind === "learn" ? <Key /> : kind === "test" ? <Lock /> : <Compass />;
}
