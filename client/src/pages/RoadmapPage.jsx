import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

// Planet images
import mercuryImg from "../assets/roadmap/planets/mercury.png";
import venusImg   from "../assets/roadmap/planets/venus.png";
import earthImg   from "../assets/roadmap/planets/earth.png";
import marsImg    from "../assets/roadmap/planets/mars.png";
import jupiterImg from "../assets/roadmap/planets/jupiter.png";
import saturnImg  from "../assets/roadmap/planets/saturn.png";
import uranusImg  from "../assets/roadmap/planets/uranus.png";
import neptuneImg from "../assets/roadmap/planets/neptune.png";
import plutoImg   from "../assets/roadmap/planets/pluto.png";

const PLANET_IMAGES = {
  mercury: mercuryImg, venus: venusImg,   earth: earthImg,
  mars:    marsImg,    jupiter: jupiterImg, saturn: saturnImg,
  uranus:  uranusImg,  neptune: neptuneImg, pluto: plutoImg,
};

// ── Fallback units (shown before seed is run) ─────────────────────────────────
const FALLBACK_UNITS = [
  { _id:"fb-1", unitNumber:1, name:"Unit 1", planetName:"Mercury", imageKey:"mercury", order:1, description:"The closest planet to the Sun!" },
  { _id:"fb-2", unitNumber:2, name:"Unit 2", planetName:"Venus",   imageKey:"venus",   order:2, description:"The hottest planet in our solar system!" },
  { _id:"fb-3", unitNumber:3, name:"Unit 3", planetName:"Earth",   imageKey:"earth",   order:3, description:"Our beautiful home planet!" },
  { _id:"fb-4", unitNumber:4, name:"Unit 4", planetName:"Mars",    imageKey:"mars",    order:4, description:"The Red Planet!" },
  { _id:"fb-5", unitNumber:5, name:"Unit 5", planetName:"Jupiter", imageKey:"jupiter", order:5, description:"The largest planet!" },
  { _id:"fb-6", unitNumber:6, name:"Unit 6", planetName:"Saturn",  imageKey:"saturn",  order:6, description:"Famous for its magnificent rings!" },
  { _id:"fb-7", unitNumber:7, name:"Unit 7", planetName:"Uranus",  imageKey:"uranus",  order:7, description:"The ice giant that spins sideways!" },
  { _id:"fb-8", unitNumber:8, name:"Unit 8", planetName:"Neptune", imageKey:"neptune", order:8, description:"The windiest planet!" },
  { _id:"fb-9", unitNumber:9, name:"Unit 9", planetName:"Pluto",   imageKey:"pluto",   order:9, description:"The beloved dwarf planet!" },
];

// ── Vertical zigzag positions (x%, y% in SVG viewBox "0 0 100 100") ──────────
// Odd units: left (x=22), Even units: right (x=78)
// y evenly spaced 10% apart, starting at 10%, ending at 90%
const ZIGZAG_POS = [
  { x: 22, y: 10, label: "START"  }, // 1 Mercury
  { x: 78, y: 20, label: null     }, // 2 Venus
  { x: 22, y: 30, label: null     }, // 3 Earth
  { x: 78, y: 40, label: null     }, // 4 Mars
  { x: 22, y: 50, label: null     }, // 5 Jupiter
  { x: 78, y: 60, label: null     }, // 6 Saturn
  { x: 22, y: 70, label: null     }, // 7 Uranus
  { x: 78, y: 80, label: null     }, // 8 Neptune
  { x: 22, y: 90, label: "FINISH" }, // 9 Pluto
];

// Vertical S-curves: control points share x with each endpoint, y with the other.
// Tangent at each planet goes straight down; path curves horizontally mid-segment.
const ZIGZAG_PATH =
  "M 22,10 " +
  "C 22,20 78,10 78,20 " +
  "C 78,30 22,20 22,30 " +
  "C 22,40 78,30 78,40 " +
  "C 78,50 22,40 22,50 " +
  "C 22,60 78,50 78,60 " +
  "C 78,70 22,60 22,70 " +
  "C 22,80 78,70 78,80 " +
  "C 78,90 22,80 22,90";

// ── Colorful star icon decorations ───────────────────────────────────────────
const STAR_ICON_DECOS = [
  { x:"6%",  y:"6%",  size:22, color:"#FFD700", dur:3.2, delay:0    },
  { x:"14%", y:"18%", size:16, color:"#A78BFA", dur:4.1, delay:0.8  },
  { x:"87%", y:"9%",  size:20, color:"#38BDF8", dur:2.9, delay:1.5  },
  { x:"75%", y:"22%", size:14, color:"#FF6B9D", dur:3.7, delay:0.3  },
  { x:"92%", y:"38%", size:18, color:"#34D399", dur:3.4, delay:1.1  },
  { x:"3%",  y:"43%", size:24, color:"#FBBF24", dur:4.5, delay:2.0  },
  { x:"83%", y:"55%", size:16, color:"#F472B6", dur:3.0, delay:0.6  },
  { x:"8%",  y:"65%", size:20, color:"#FFD700", dur:3.9, delay:1.7  },
  { x:"80%", y:"74%", size:18, color:"#A78BFA", dur:2.8, delay:0.4  },
  { x:"32%", y:"4%",  size:14, color:"#38BDF8", dur:4.2, delay:1.2  },
  { x:"57%", y:"13%", size:18, color:"#FF6B9D", dur:3.5, delay:0.9  },
  { x:"44%", y:"46%", size:12, color:"#FFD700", dur:4.0, delay:1.6  },
  { x:"64%", y:"62%", size:20, color:"#34D399", dur:3.1, delay:2.2  },
  { x:"20%", y:"85%", size:16, color:"#FBBF24", dur:3.6, delay:0.7  },
  { x:"51%", y:"78%", size:22, color:"#F472B6", dur:2.7, delay:1.3  },
  { x:"2%",  y:"30%", size:14, color:"#A78BFA", dur:3.8, delay:0.5  },
  { x:"95%", y:"20%", size:12, color:"#FFD700", dur:4.3, delay:1.8  },
  { x:"47%", y:"91%", size:16, color:"#38BDF8", dur:3.3, delay:0.2  },
  { x:"78%", y:"88%", size:14, color:"#FF6B9D", dur:4.6, delay:1.4  },
  { x:"19%", y:"52%", size:22, color:"#34D399", dur:2.9, delay:0.8  },
  { x:"60%", y:"35%", size:16, color:"#FBBF24", dur:3.7, delay:1.0  },
  { x:"38%", y:"70%", size:18, color:"#FFD700", dur:4.0, delay:1.9  },
  { x:"71%", y:"46%", size:14, color:"#F472B6", dur:3.2, delay:0.3  },
  { x:"90%", y:"64%", size:20, color:"#A78BFA", dur:3.6, delay:2.1  },
  { x:"25%", y:"96%", size:16, color:"#38BDF8", dur:2.8, delay:0.6  },
];


const toId = (v) => (v?._id ?? v)?.toString?.() ?? String(v);
const isFB  = (id) => String(id).startsWith("fb-");

// Maps unitNumber → gameId. Extend as more unit games are built.
const UNIT_GAME_MAP = {
  1: "family-photo",
  2: "school-find",
};

// Static dot stars — computed once at module load to avoid impure render
const BG_DOTS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x:   Math.random() * 100,
  y:   Math.random() * 100,
  s:   Math.random() > 0.75 ? 2 : 1,
  dur: (Math.random() * 3 + 2).toFixed(2),
  del: (Math.random() * 8).toFixed(2),
}));

// ─────────────────────────────────────────────────────────────────────────────

const RoadmapPage = () => {
  const { isChild } = useAuth();
  const navigate = useNavigate();

  const [roadmap,      setRoadmap]      = useState(null);
  const [apiUnits,     setApiUnits]     = useState([]);
  const [progress,     setProgress]     = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitDetail,   setUnitDetail]   = useState(null);
  const [toast,        setToast]        = useState("");
  const [loading,      setLoading]      = useState(true);

  const displayUnits = apiUnits.length > 0 ? apiUnits : FALLBACK_UNITS;

  useEffect(() => {
    api.get("/api/roadmaps")
      .then((res) => {
        const first = res.data?.[0];
        if (!first) return;
        return api.get(`/api/roadmaps/${first._id}`).then((r) => {
          setRoadmap(r.data);
          setApiUnits(r.data.units || []);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!roadmap?._id || !isChild) return;
    api.get(`/api/roadmaps/${roadmap._id}/progress`)
      .then((r) => setProgress(r.data))
      .catch(() => {});
  }, [roadmap?._id, isChild]);

  const getStatus = (unit) => {
    if (!isChild || !progress) return unit.order === 1 ? "unlocked" : "locked";
    const id = toId(unit._id);
    if (progress.completedUnits?.some((u) => toId(u) === id)) return "completed";
    if (progress.unlockedUnits?.some((u) => toId(u) === id))  return "unlocked";
    return "locked";
  };

  const handleUnitClick = (unit) => {
    if (getStatus(unit) === "locked") {
      showToast("Complete the previous unit to unlock this planet! 🔒");
      return;
    }
    setSelectedUnit(unit);
    setUnitDetail(null);
    if (!isFB(unit._id)) {
      api.get(`/api/roadmaps/units/${unit._id}`)
        .then((r) => setUnitDetail(r.data))
        .catch(() => {});
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const handlePlay = (unit) => {
    const gameId = UNIT_GAME_MAP[unit.unitNumber];
    if (gameId) {
      navigate(`/game/${gameId}`, {
        state: { unitId: isFB(unit._id) ? null : String(unit._id) },
      });
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "radial-gradient(circle at top, #2b0a5a 0%, #12002e 40%, #07001a 100%)" }}
    >
      <Navbar />

      {/* ── LAYER 0: tiny CSS dot stars ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {BG_DOTS.map((d) => (
          <span key={d.id} className="absolute rounded-full bg-white"
            style={{
              left:`${d.x}%`, top:`${d.y}%`,
              width:d.s, height:d.s,
              animation:`rmTwinkle ${d.dur}s ${d.del}s ease-in-out infinite alternate`,
              opacity: 0.45,
            }}
          />
        ))}
      </div>

      {/* ── LAYER 1: colorful star icons ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Colorful star icons */}
        {STAR_ICON_DECOS.map((s, i) => (
          <span key={i}
            className="absolute select-none leading-none"
            style={{
              left:s.x, top:s.y,
              fontSize:s.size,
              color:s.color,
              filter:`drop-shadow(0 0 4px ${s.color})`,
              animation:`rmScaleGlow ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
            }}
          >
            ★
          </span>
        ))}
      </div>

      {/* ── LAYER 2: page content ────────────────────────────────────────── */}
      <div className="relative" style={{ zIndex: 2, paddingTop:"80px", paddingBottom:"48px" }}>

        {/* Title */}
        <div className="text-center px-4 mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide mb-2 leading-tight"
            style={{
              background:"linear-gradient(90deg,#ffd700,#ff6b9d,#a78bfa)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              filter:"drop-shadow(0 0 16px rgba(255,215,0,0.4))",
            }}
          >
            {roadmap?.title || "MAP 1 – PLANET ADVENTURE"}
          </h1>
          <p className="text-violet-300 text-sm sm:text-base md:text-lg tracking-wider">
            {roadmap?.description || "Learn English through the Solar System"}&nbsp;·&nbsp;Units 1 – 9
          </p>
        </div>

        {loading && (
          <p className="text-center text-violet-400 text-lg animate-pulse mt-16">
            Loading roadmap…
          </p>
        )}

        {!loading && (
          /*
           * Vertical zigzag roadmap container.
           * paddingBottom: "135%" → height = 1.35 × width (tall, portrait-like).
           * minHeight: 1000px ensures it's tall enough on narrow screens.
           * viewBox "0 0 100 100" + preserveAspectRatio="none" means SVG x/y
           * coords map directly to % of container width/height — same as
           * the left/top % on planet nodes.
           */
          <div className="mx-auto px-4" style={{ maxWidth: 720 }}>
            <div className="relative w-full" style={{ paddingBottom:"135%", minHeight:1000 }}>
              <div className="absolute inset-0">

                {/* SVG dashed yellow path (z-index 1, behind planets) */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                  style={{ zIndex: 1 }}
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="rmYellowGlow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="0.9" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={ZIGZAG_PATH}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="0.75"
                    strokeDasharray="2.2 1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#rmYellowGlow)"
                  />
                </svg>

                {/* Planet nodes (z-index 3, above path) */}
                {displayUnits.map((unit, i) => {
                  const pos = ZIGZAG_POS[i];
                  if (!pos) return null;
                  return (
                    <ZigzagNode
                      key={unit._id}
                      unit={unit}
                      pos={pos}
                      status={getStatus(unit)}
                      img={PLANET_IMAGES[unit.imageKey]}
                      onClick={handleUnitClick}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white font-bold text-sm whitespace-nowrap"
          style={{ background:"linear-gradient(90deg,#7c3aed,#be185d)", boxShadow:"0 0 24px rgba(124,58,237,0.7)" }}
        >
          {toast}
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {selectedUnit && (
        <UnitModal
          unit={selectedUnit}
          detail={unitDetail}
          status={getStatus(selectedUnit)}
          onPlay={handlePlay}
          onClose={() => { setSelectedUnit(null); setUnitDetail(null); }}
        />
      )}

      <style>{`
        @keyframes rmTwinkle   { from{opacity:0.1} to{opacity:0.7} }
        @keyframes rmFloat     { from{transform:translateY(0)} to{transform:translateY(-10px)} }
        @keyframes rmScaleGlow {
          0%  { opacity:0.3;  transform:scale(0.85); }
          50% { opacity:0.9;  transform:scale(1.15); }
          100%{ opacity:0.3;  transform:scale(0.85); }
        }
      `}</style>
    </div>
  );
};

// ─── Zigzag planet node ───────────────────────────────────────────────────────

const ZigzagNode = ({ unit, pos, status, img, onClick }) => {
  const isLocked    = status === "locked";
  const isCompleted = status === "completed";
  const isUnlocked  = status === "unlocked";
  const isRight     = pos.x > 50; // right side node

  const glowStyle = isCompleted
    ? { boxShadow:"0 0 26px rgba(255,215,0,0.7)" }
    : isUnlocked
    ? { boxShadow:"0 0 22px rgba(167,139,250,0.65)" }
    : { boxShadow:"none" };

  return (
    <button
      type="button"
      onClick={() => onClick(unit)}
      className="absolute flex flex-col items-center group focus:outline-none"
      style={{
        left:`${pos.x}%`,
        top:`${pos.y}%`,
        transform:"translate(-50%, -50%)",
        zIndex: 3,
        cursor: isLocked ? "not-allowed" : "pointer",
      }}
      title={isLocked ? "Complete the previous unit first" : unit.planetName}
    >
      {/* START / FINISH badge */}
      {pos.label && (
        <span
          className="mb-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase whitespace-nowrap inline-flex items-center justify-center"
          style={{
            background: pos.label === "START"
              ? "linear-gradient(90deg,#7b2ff7,#06b6d4)"
              : "linear-gradient(90deg,#f59e0b,#ef4444)",
            color:"#fff",
            boxShadow:"0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {pos.label}
        </span>
      )}

      {/* Planet circle — no border ring, just glow */}
      <div
        className={`relative rounded-full overflow-hidden transition-transform duration-200 ${!isLocked ? "group-hover:scale-110" : ""}`}
        style={{
          width:"clamp(95px,16vw,120px)",
          height:"clamp(95px,16vw,120px)",
          ...glowStyle,
        }}
      >
        {img ? (
          <img
            src={img}
            alt={unit.planetName}
            className={`w-full h-full object-cover ${isLocked ? "grayscale-[60%]" : ""}`}
          />
        ) : (
          <span className="text-5xl flex items-center justify-center h-full">🪐</span>
        )}

        {/* Lock icon — centered overlay */}
        {isLocked && (
          <span className="absolute inset-0 flex items-center justify-center text-2xl"
            style={{ background:"rgba(0,0,0,0.35)", textShadow:"0 0 6px rgba(0,0,0,0.9)" }}>🔒</span>
        )}
      </div>

      {/* Label: unit name + planet name */}
      <div className="mt-2 text-center leading-tight">
        <p className="text-[11px] font-black uppercase tracking-widest"
          style={{ color: isLocked ? "#6b7280" : "#c4b5fd" }}>
          {unit.name}
        </p>
        <p className="text-sm font-bold"
          style={{ color: isLocked ? "#4b5563" : "#ffffff" }}>
          {unit.planetName}
        </p>
      </div>
    </button>
  );
};

// ─── Unit modal ───────────────────────────────────────────────────────────────

const UnitModal = ({ unit, detail, status, isChild, completing, onComplete, onPlay, onClose }) => {
  const img       = PLANET_IMAGES[unit.imageKey];
  const done      = status === "completed";
  const fallback  = isFB(unit._id);
  const gameId    = UNIT_GAME_MAP[unit.unitNumber];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.8)", zIndex:50 }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl p-6 overflow-y-auto max-h-[90vh]"
        style={{
          background:"linear-gradient(145deg,#1e0a40,#0f1e50)",
          border:"1.5px solid rgba(167,139,250,0.4)",
          boxShadow:"0 0 52px rgba(124,58,237,0.35), 0 0 20px rgba(255,215,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-violet-300 hover:text-white hover:bg-violet-700 transition-colors focus:outline-none">
          ✕
        </button>

        <div className="flex flex-col items-center mb-5">
          {img && (
            <img src={img} alt={unit.planetName}
              className="w-28 h-28 rounded-full object-cover mb-3"
              style={{
                boxShadow: done ? "0 0 28px rgba(255,215,0,0.55)" : "0 0 24px rgba(167,139,250,0.45)",
              }}
            />
          )}
          <p className="text-violet-400 font-black tracking-widest uppercase text-xs">{unit.name}</p>
          <h2 className="text-2xl font-extrabold mt-1"
            style={{ background:"linear-gradient(90deg,#ffd700,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {unit.planetName}
          </h2>
          {(detail?.description || unit.description) && (
            <p className="text-violet-300 text-sm text-center mt-2 leading-relaxed max-w-sm">
              {detail?.description || unit.description}
            </p>
          )}
          {done && (
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background:"rgba(255,215,0,0.15)", border:"1px solid #ffd700", color:"#ffd700" }}>
              Completed
            </span>
          )}
        </div>

        {gameId && status !== "locked" && (
          <button type="button" onClick={() => onPlay(unit)}
            className="mt-6 w-full py-3 rounded-2xl font-bold text-white transition-all duration-200 hover:scale-105"
            style={{ background:"linear-gradient(90deg,#f59e0b,#ef4444)", boxShadow:"0 0 20px rgba(245,158,11,0.5)" }}>
            ▶ Play Game
          </button>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;
