// Pre-computed once at module load — avoids re-randomising on every render
const BG_DOTS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x:   Math.random() * 100,
  y:   Math.random() * 100,
  s:   Math.random() > 0.75 ? 2 : 1,
  dur: (Math.random() * 3 + 2).toFixed(2),
  del: (Math.random() * 8).toFixed(2),
}));

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

const SpaceBackground = () => (
  <>
    {/* Tiny twinkle dot stars */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {BG_DOTS.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.s, height: d.s,
            animation: `sbTwinkle ${d.dur}s ${d.del}s ease-in-out infinite alternate`,
            opacity: 0.45,
          }}
        />
      ))}
    </div>

    {/* Colorful floating star icons */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      {STAR_ICON_DECOS.map((s, i) => (
        <span
          key={i}
          className="absolute select-none leading-none"
          style={{
            left: s.x, top: s.y,
            fontSize: s.size,
            color: s.color,
            filter: `drop-shadow(0 0 4px ${s.color})`,
            animation: `sbScaleGlow ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
          }}
        >
          ★
        </span>
      ))}
    </div>

    <style>{`
      @keyframes sbTwinkle   { from { opacity: 0.1 } to { opacity: 0.7 } }
      @keyframes sbScaleGlow {
        0%   { opacity: 0.3; transform: scale(0.85); }
        50%  { opacity: 0.9; transform: scale(1.15); }
        100% { opacity: 0.3; transform: scale(0.85); }
      }
    `}</style>
  </>
);

export default SpaceBackground;
