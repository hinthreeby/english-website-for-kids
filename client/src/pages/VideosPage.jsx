import { useEffect, useState } from "react";
import api from "../lib/api";
import Navbar from "../components/Navbar";
import StarBackground from "../components/StarBackground";

const FIELD_EMOJIS = {
  Alphabet: "🔤", Animals: "🐾",  Colors: "🌈",   Planets: "🪐",
  Numbers:  "🔢", Shapes:  "🔷",  Food:   "🍎",   Family:  "👨‍👩‍👧",
};

const FIELD_COLORS = {
  Alphabet: "#7c3aed", Animals: "#059669", Colors: "#d97706",
  Planets:  "#2563eb", Numbers: "#dc2626", Shapes: "#7c3aed",
  Food:     "#ea580c", Family:  "#db2777",
};

// Must match backend enum: "story-series" | "quick-video" | "song"
const TYPE_META = {
  "story-series": { label: "Series",      icon: "📺", color: "rgba(180,83,9,0.85)"   },
  "quick-video":  { label: "Video",       icon: "🎬", color: "rgba(124,58,237,0.85)" },
  "song":         { label: "Song",        icon: "🎵", color: "rgba(8,145,178,0.85)"  },
};

const TYPE_FILTERS = [
  { value: null,           label: "All"       },
  { value: "story-series", label: "📺 Series" },
  { value: "quick-video",  label: "🎬 Videos" },
  { value: "song",         label: "🎵 Songs"  },
];

const isLocalUrl = (url) => url?.startsWith("/uploads/");

const getYouTubeId = (url) => {
  const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const getEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
};

const autoThumb = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

// ── Video Player Modal ───────────────────────────────────────
const VideoPlayerModal = ({ video, onClose }) => {
  if (!video) return null;

  const url   = video.videoUrl || "";
  const local = isLocalUrl(url);
  const tm    = TYPE_META[video.type] || TYPE_META["quick-video"];
  const emoji = FIELD_EMOJIS[video.field] || "📚";

  return (
    <div className="vp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={video.title}>
      <div className="vp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Accent line — colored per type */}
        <div className="vp-accent-bar" style={{ background: tm.color }} />

        {/* Header: badges | centered title | close X */}
        <div className="vp-header">
          <div className="vp-header-left">
            <span className="vp-type-badge" style={{ background: tm.color }}>
              {tm.icon} {tm.label}
            </span>
            {video.type === "story-series" && video.episodeNumber ? (
              <span className="vp-ep-badge">Tập {video.episodeNumber}</span>
            ) : null}
            {video.field ? (
              <span className="vp-field-badge">{emoji} {video.field}</span>
            ) : null}
          </div>
          <h2 className="vp-header-title">{video.title}</h2>
          <div className="vp-header-right">
            <button type="button" className="vp-close-x" onClick={onClose} aria-label="Đóng">
              Đóng
            </button>
          </div>
        </div>

        {/* Video — fills all remaining space */}
        <div className="vp-screen">
          {local ? (
            <video src={url} controls autoPlay className="vp-video-el" />
          ) : (
            <iframe
              src={getEmbedUrl(url)}
              title={video.title}
              className="vp-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────
const VideosPage = () => {
  const [videos,      setVideos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [activeField, setActiveField] = useState(null);
  const [activeType,  setActiveType]  = useState(null);
  const [playing,     setPlaying]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get("/api/videos");
        if (!cancelled) setVideos(data.videos || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "Failed to load videos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const fields = [...new Set(videos.map((v) => v.field).filter(Boolean))].sort();

  const filtered = videos.filter((v) => {
    if (activeField && v.field !== activeField) return false;
    if (activeType  && v.type  !== activeType)  return false;
    return true;
  });

  const videosByField = fields.reduce((acc, f) => {
    acc[f] = filtered.filter((v) => v.field === f);
    return acc;
  }, {});

  // Also bucket videos that have no field
  const noField = filtered.filter((v) => !v.field);

  const visibleFields = activeField
    ? (videosByField[activeField]?.length ? [activeField] : [])
    : fields.filter((f) => videosByField[f]?.length > 0);

  const hasTypes = [...new Set(videos.map((v) => v.type).filter(Boolean))].length > 1;

  const getCharacterForField = (field) =>
    videos.find((v) => v.field === field && v.characterName)?.characterName || null;

  const displayThumb = (v) => v.thumbnailUrl || autoThumb(v.videoUrl) || null;

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />

      <main className="role-wrap">
        {/* Hero */}
        <section className="role-hero glass-card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem" }}>🎬 Fun Videos!</h1>
          <p style={{ fontSize: "1.05rem" }}>Watch and learn with your favorite characters!</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        {loading ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</div>
            <p>Loading videos…</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎬</div>
            <h3>No videos yet!</h3>
            <p style={{ opacity: 0.7 }}>Check back soon — more fun is coming!</p>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <section className="glass-card" style={{ padding: "1rem 1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {hasTypes && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.6, minWidth: "3.2rem" }}>Type:</span>
                    {TYPE_FILTERS.map((t) => (
                      <button key={String(t.value)} type="button"
                        className={activeType === t.value ? "btn-register" : "btn-secondary-glass"}
                        onClick={() => setActiveType(t.value)}
                        style={{ borderRadius: "2rem", padding: "0.3rem 0.9rem", fontSize: "0.82rem" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.6, minWidth: "3.2rem" }}>Topic:</span>
                  <button type="button"
                    className={!activeField ? "btn-register" : "btn-secondary-glass"}
                    onClick={() => setActiveField(null)}
                    style={{ borderRadius: "2rem", padding: "0.3rem 0.9rem", fontSize: "0.82rem" }}>
                    All
                  </button>
                  {fields.map((f) => (
                    <button key={f} type="button"
                      className={activeField === f ? "btn-register" : "btn-secondary-glass"}
                      onClick={() => setActiveField(activeField === f ? null : f)}
                      style={{ borderRadius: "2rem", padding: "0.3rem 0.9rem", fontSize: "0.82rem" }}>
                      {FIELD_EMOJIS[f] || "📚"} {f}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Video sections */}
            {visibleFields.length === 0 && noField.length === 0 ? (
              <div className="glass-card" style={{ textAlign: "center", padding: "3rem", opacity: 0.7 }}>
                No videos match your filter.
              </div>
            ) : (
              <>
                {visibleFields.map((field) => (
                  <section key={field} className="glass-card">
                    <FieldSection
                      field={field}
                      videos={videosByField[field]}
                      character={getCharacterForField(field)}
                      onPlay={setPlaying}
                      displayThumb={displayThumb}
                    />
                  </section>
                ))}

                {/* Videos with no field */}
                {noField.length > 0 && (
                  <section className="glass-card">
                    <FieldSection
                      field={null}
                      videos={noField}
                      character={null}
                      onPlay={setPlaying}
                      displayThumb={displayThumb}
                    />
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      <VideoPlayerModal video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
};

// ── Field Section ────────────────────────────────────────────
const FieldSection = ({ field, videos, character, onPlay, displayThumb }) => (
  <div>
    <div className="role-section-header" style={{ marginBottom: "1.1rem" }}>
      <div>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{FIELD_EMOJIS[field] || (field ? "📚" : "🎬")}</span>
          {field || "More Videos"}
        </h2>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", opacity: 0.5 }}>
          {character ? `🧸 ${character} · ` : ""}
          {videos.length} video{videos.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>

    <div className="video-card-grid">
      {videos.map((v) => {
        const tm    = TYPE_META[v.type] || TYPE_META["quick-video"];
        const thumb = displayThumb(v);
        const accentColor = FIELD_COLORS[v.field] || "#7c3aed";

        return (
          <button key={v._id} type="button" className="video-card" onClick={() => onPlay(v)}>
            <div className="video-card-thumb">
              {thumb ? (
                <img src={thumb} alt={v.title} />
              ) : (
                <div
                  className="video-card-thumb-placeholder"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}44 0%, ${accentColor}18 100%)`,
                    borderBottom: `3px solid ${accentColor}55`,
                  }}
                >
                  <span style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
                    {FIELD_EMOJIS[v.field] || tm.icon}
                  </span>
                </div>
              )}

              {/* Type chip */}
              <span className="video-type-chip" style={{ background: tm.color }}>
                {tm.icon} {tm.label}
                {v.type === "story-series" && v.episodeNumber ? ` · Tập ${v.episodeNumber}` : ""}
              </span>

              {/* Circular play button */}
              <div className="video-card-play">
                <div className="video-card-play-icon">▶</div>
              </div>
            </div>

            <div className="video-card-body">
              <strong>{v.title}</strong>
              <div className="video-card-subline">
                {v.field ? <span className="video-field-tag">{FIELD_EMOJIS[v.field] || ""} {v.field}</span> : null}
                {v.characterName ? (
                  <span className="video-card-char">🧸 {v.characterName}</span>
                ) : null}
                {v.unit ? (
                  <span className="video-card-char">Unit {v.unit}</span>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default VideosPage;
