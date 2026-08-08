// Small simplified flat-SVG flags for Malaysian states/federal territories,
// used as a visual identifier next to state names in AreaPicker.
// Colors/layouts verified against Wikipedia's flag pages for each state.
// A few flags have intricate emblems (Kedah's crest, Kelantan's crossed
// kris+spears, Penang's areca palm, Sabah's Mount Kinabalu silhouette,
// Sarawak's diagonal wedge geometry, Putrajaya's national coat of arms,
// KL's alternating stripe count) that don't read at this size anyway, so
// those are simplified down to their correct dominant colors and basic
// layout rather than attempting fine detail.
const STAR_PATH =
  "M0,-1 L0.2245,-0.309 L0.9511,-0.309 L0.3633,0.118 L0.5878,0.809 L0,0.382 L-0.5878,0.809 L-0.3633,0.118 L-0.9511,-0.309 L-0.2245,-0.309 Z";

function Star({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return <path d={STAR_PATH} fill={color} transform={`translate(${cx} ${cy}) scale(${r})`} />;
}

function Crescent({ cx, cy, r, color, bite }: { cx: number; cy: number; r: number; color: string; bite: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx + r * 0.4} cy={cy} r={r * 0.82} fill={bite} />
    </>
  );
}

function FlagFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/[0.08]">
      {children}
    </svg>
  );
}

const FLAGS: Record<string, () => React.ReactNode> = {
  Selangor: () => (
    <>
      <rect x="0" y="0" width="15" height="10" fill="#DA251D" />
      <rect x="15" y="0" width="15" height="10" fill="#FCD117" />
      <rect x="0" y="10" width="15" height="10" fill="#FCD117" />
      <rect x="15" y="10" width="15" height="10" fill="#DA251D" />
      <Crescent cx={7.5} cy={5} r={2.6} color="#fff" bite="#DA251D" />
      <Star cx={10.2} cy={5} r={1} color="#fff" />
    </>
  ),
  "Kuala Lumpur": () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#00366B" />
      <rect x="0" y="0" width="30" height="1.6" fill="#DC241F" />
      <rect x="0" y="1.6" width="30" height="1.6" fill="#fff" />
      <rect x="0" y="16.8" width="30" height="1.6" fill="#fff" />
      <rect x="0" y="18.4" width="30" height="1.6" fill="#DC241F" />
      <Crescent cx={7} cy={10} r={2.6} color="#FFD100" bite="#00366B" />
      <Star cx={9.6} cy={10} r={1} color="#FFD100" />
    </>
  ),
  Putrajaya: () => (
    <>
      <rect x="0" y="0" width="8" height="20" fill="#000080" />
      <rect x="8" y="0" width="14" height="20" fill="#FFCC00" />
      <rect x="22" y="0" width="8" height="20" fill="#000080" />
      <circle cx="15" cy="10" r="2.6" fill="#7a1f1f" />
    </>
  ),
  Johor: () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#002B7F" />
      <rect x="0" y="0" width="15" height="10" fill="#CE1126" />
      <Crescent cx={7.5} cy={5} r={2.6} color="#fff" bite="#CE1126" />
      <Star cx={10.2} cy={5} r={1} color="#fff" />
    </>
  ),
  Kedah: () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#D71110" />
      <rect x="3" y="3" width="7" height="8" rx="1" fill="#fff" />
      <Crescent cx={6.5} cy={7} r={1.7} color="#0a7a3c" bite="#fff" />
    </>
  ),
  Kelantan: () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#DA251D" />
      <Crescent cx={15} cy={10} r={3.6} color="#fff" bite="#DA251D" />
      <Star cx={19} cy={10} r={1.4} color="#fff" />
    </>
  ),
  Melaka: () => (
    <>
      <rect x="0" y="10" width="30" height="10" fill="#fff" />
      <rect x="15" y="0" width="15" height="10" fill="#C30000" />
      <rect x="0" y="0" width="15" height="10" fill="#002B7F" />
      <Crescent cx={7.5} cy={5} r={2.4} color="#FCD116" bite="#002B7F" />
      <Star cx={9.9} cy={5} r={0.9} color="#FCD116" />
    </>
  ),
  "Negeri Sembilan": () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#FFD100" />
      <polygon points="0,0 12,0 12,8" fill="#DC241F" />
      <polygon points="0,0 12,8 0,8" fill="#000" />
    </>
  ),
  Pahang: () => (
    <>
      <rect x="0" y="0" width="30" height="10" fill="#fff" />
      <rect x="0" y="10" width="30" height="10" fill="#000" />
    </>
  ),
  Perak: () => (
    <>
      <rect x="0" y="0" width="30" height="6.67" fill="#fff" />
      <rect x="0" y="6.67" width="30" height="6.67" fill="#FCD116" />
      <rect x="0" y="13.34" width="30" height="6.66" fill="#000" />
    </>
  ),
  Perlis: () => (
    <>
      <rect x="0" y="0" width="30" height="10" fill="#FBD010" />
      <rect x="0" y="10" width="30" height="10" fill="#002879" />
    </>
  ),
  "Pulau Pinang": () => (
    <>
      <rect x="0" y="0" width="10" height="20" fill="#3472CA" />
      <rect x="10" y="0" width="10" height="20" fill="#fff" />
      <rect x="20" y="0" width="10" height="20" fill="#FFCC00" />
      <rect x="14" y="11" width="2" height="4" fill="#AE523F" />
      <ellipse cx="15" cy="9.5" rx="3.4" ry="2.6" fill="#00902F" />
    </>
  ),
  Sabah: () => (
    <>
      <rect x="0" y="0" width="30" height="6.67" fill="#0484D6" />
      <rect x="0" y="6.67" width="30" height="6.67" fill="#fff" />
      <rect x="0" y="13.34" width="30" height="6.66" fill="#F5362F" />
      <rect x="0" y="0" width="12" height="6.67" fill="#77CCFF" />
      <polygon points="4,6.2 6,2.2 8,6.2" fill="#002B7F" />
    </>
  ),
  Sarawak: () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#FCD20E" />
      <polygon points="0,0 0,10 18,10" fill="#000" />
      <polygon points="0,10 0,20 18,10" fill="#CF0820" />
      <Star cx={5} cy={7} r={1.1} color="#CF0820" />
    </>
  ),
  Terengganu: () => (
    <>
      <rect x="0" y="0" width="30" height="20" fill="#fff" />
      <rect x="1.4" y="1.4" width="27.2" height="17.2" fill="#000" />
      <Crescent cx={15} cy={10} r={3.4} color="#fff" bite="#000" />
      <Star cx={18.6} cy={10} r={1.3} color="#fff" />
    </>
  ),
  Labuan: () => (
    <>
      <rect x="0" y="0" width="30" height="6.67" fill="#DC2210" />
      <rect x="0" y="6.67" width="30" height="6.67" fill="#fff" />
      <rect x="0" y="13.34" width="30" height="6.66" fill="#003573" />
      <Crescent cx={15} cy={10} r={2} color="#FFCC00" bite="#fff" />
      <Star cx={17} cy={10} r={0.8} color="#FFCC00" />
    </>
  ),
};

export default function StateFlag({ state }: { state: string }) {
  const render = FLAGS[state];
  if (!render) return null;
  return <FlagFrame>{render()}</FlagFrame>;
}
