import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

const VIDEO_TYPES = [
  { value: "story-series", label: "Story Series", icon: "📺", desc: "Episode-based story series" },
  { value: "quick-video",  label: "Quick Video",  icon: "⚡", desc: "A standalone short clip"    },
  { value: "song",         label: "Song",         icon: "🎵", desc: "Music or sing-along video"  },
];

const TYPE_META = {
  "story-series": { label: "Story Series", icon: "📺", color: "#7c3aed" },
  "quick-video":  { label: "Quick Video",  icon: "⚡", color: "#0891b2" },
  "song":         { label: "Song",         icon: "🎵", color: "#b45309" },
};

const DEFAULT_CATEGORIES = [
  "Alphabet", "Animals", "Colors", "Planets",
  "Numbers", "Shapes", "Food", "Family",
];

const FIELD_EMOJIS = {
  Alphabet: "🔤", Animals: "🐾", Colors: "🌈", Planets: "🪐",
  Numbers: "🔢", Shapes: "🔷", Food: "🍎", Family: "👨‍👩‍👧",
};

const EMPTY_FORM = {
  type: "",
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  field: "",
  episodeNumber: 1,
  isPublished: false,
};

const getYouTubeId = (url) => {
  const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};
const getYouTubeThumbnail = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};
const getEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
};
const displayThumb = (v) => v.thumbnailUrl || getYouTubeThumbnail(v.videoUrl) || null;
const isLocalUrl = (url) => url?.startsWith("/uploads/");

// ── Custom Episode Number Spinner ───────────────────────────
const ChevronUp = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5,3 8,7" />
  </svg>
);
const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,3 5,7 8,3" />
  </svg>
);

const NumberSpinner = ({ value, min = 1, onChange }) => (
  <div className="ep-spinner-wrap">
    <input
      className="ep-spinner-input"
      type="number"
      value={value}
      min={min}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= min) onChange(v);
      }}
      required
      style={{
        flex: 1, width: 0,
        background: "transparent", border: "none", outline: "none",
        color: "#e2e8f0", fontSize: "1rem", fontWeight: 700,
        padding: "0.5rem 0.75rem", fontFamily: "inherit", textAlign: "center",
      }}
    />
    <div style={{
      display: "flex", flexDirection: "column",
      borderLeft: "1px solid rgba(124,58,237,0.25)",
    }}>
      <button
        type="button"
        className="ep-spinner-btn"
        style={{ flex: 1, borderBottom: "1px solid rgba(124,58,237,0.2)" }}
        onClick={() => onChange(value + 1)}
        tabIndex={-1}
        aria-label="Increase"
      >
        <ChevronUp />
      </button>
      <button
        type="button"
        className="ep-spinner-btn"
        style={{ flex: 1 }}
        onClick={() => { if (value > min) onChange(value - 1); }}
        tabIndex={-1}
        aria-label="Decrease"
      >
        <ChevronDown />
      </button>
    </div>
  </div>
);

// ── Chip button ──────────────────────────────────────────────
const Chip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "0.22rem 0.65rem",
      borderRadius: "20px",
      fontSize: "0.78rem", fontWeight: 600,
      border: active ? "1.5px solid #a78bfa" : "1.5px solid rgba(255,255,255,0.12)",
      background: active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)",
      color: active ? "#c4b5fd" : "rgba(255,255,255,0.55)",
      cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.14s",
    }}
  >
    {label}
  </button>
);

// ── Media Mode Toggle ────────────────────────────────────────
const ModeToggle = ({ mode, onChange }) => (
  <div style={{ display: "flex", gap: "0", marginBottom: "0.4rem", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.12)", width: "fit-content" }}>
    {[{ v: "url", label: "🔗 URL" }, { v: "file", label: "📁 Upload" }].map(({ v, label }) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        style={{
          padding: "0.28rem 0.85rem",
          fontSize: "0.78rem",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          background: mode === v ? "rgba(123,47,247,0.55)" : "rgba(255,255,255,0.04)",
          color: mode === v ? "#fff" : "rgba(255,255,255,0.55)",
          transition: "background 0.15s",
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

// ── Upload File Picker ───────────────────────────────────────
const FilePicker = ({ accept, progress, fileName, onFile, hint }) => {
  const ref = useRef(null);
  return (
    <div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
      <button
        type="button"
        onClick={() => ref.current.click()}
        disabled={progress !== null}
        style={{
          width: "100%",
          padding: "0.6rem 1rem",
          background: "rgba(255,255,255,0.05)",
          border: "1.5px dashed rgba(123,47,247,0.45)",
          borderRadius: "10px",
          color: "rgba(255,255,255,0.7)",
          cursor: progress !== null ? "not-allowed" : "pointer",
          fontSize: "0.85rem",
          fontFamily: "inherit",
          textAlign: "left",
          transition: "border-color 0.18s, background 0.18s",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
        onMouseEnter={(e) => { if (progress === null) e.currentTarget.style.borderColor = "rgba(123,47,247,0.8)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(123,47,247,0.45)"; }}
      >
        <span style={{ fontSize: "1.2rem" }}>📁</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName || hint || "Choose file…"}
        </span>
        {progress === null && <span style={{ opacity: 0.5, fontSize: "0.72rem", flexShrink: 0 }}>Browse</span>}
      </button>

      {progress !== null && (
        <div style={{ marginTop: "0.4rem" }}>
          <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7b2ff7,#a78bfa)", borderRadius: "3px", transition: "width 0.2s" }} />
          </div>
          <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>{progress < 100 ? `Uploading… ${progress}%` : "Processing…"}</span>
        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
const AdminVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Upload state
  const [videoMode, setVideoMode] = useState("url");
  const [thumbMode, setThumbMode] = useState("url");
  const [videoProgress, setVideoProgress] = useState(null);
  const [thumbProgress, setThumbProgress] = useState(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [thumbFileName, setThumbFileName] = useState("");

  const [previewVideo, setPreviewVideo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Series & category meta
  const [seriesList, setSeriesList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Merged category chips: defaults + any in DB
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categoryList])];

  // Load videos
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      const { data } = await api.get(`/api/admin/videos?${params}&limit=50`);
      setVideos(data.videos || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterType]);

  // Load series names and existing categories from DB
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [seriesRes, catRes] = await Promise.all([
          api.get("/api/admin/videos/fields?type=story-series"),
          api.get("/api/admin/videos/fields?type=quick-video,song"),
        ]);
        setSeriesList(seriesRes.data.fields || []);
        setCategoryList(catRes.data.fields || []);
      } catch {
        // non-critical
      }
    };
    loadMeta();
  }, []);

  const resetUploadState = () => {
    setVideoMode("url");
    setThumbMode("url");
    setVideoProgress(null);
    setThumbProgress(null);
    setVideoFileName("");
    setThumbFileName("");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setNewCategoryInput("");
    resetUploadState();
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditingId(v._id);
    setForm({
      type: v.type,
      title: v.title,
      description: v.description || "",
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl || "",
      field: v.field || "",
      episodeNumber: v.episodeNumber ?? 1,
      isPublished: v.isPublished,
    });
    setFormError("");
    setVideoMode(isLocalUrl(v.videoUrl) ? "file" : "url");
    setThumbMode(isLocalUrl(v.thumbnailUrl) ? "file" : "url");
    setVideoFileName(isLocalUrl(v.videoUrl) ? v.videoUrl.split("/").pop() : "");
    setThumbFileName(isLocalUrl(v.thumbnailUrl) ? v.thumbnailUrl.split("/").pop() : "");
    setVideoProgress(null);
    setThumbProgress(null);
    // For non-series: pre-fill custom input if field isn't a known chip
    if (v.type !== "story-series") {
      const inKnown = DEFAULT_CATEGORIES.includes(v.field) || categoryList.includes(v.field);
      setNewCategoryInput(inKnown ? "" : (v.field || ""));
    } else {
      setNewCategoryInput("");
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
    setNewCategoryInput("");
    resetUploadState();
  };

  // ── File upload handlers ─────────────────────────────────────
  const uploadThumbnailFile = async (file) => {
    setThumbFileName(file.name);
    setThumbProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/api/upload/thumbnail", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setThumbProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setForm((prev) => ({ ...prev, thumbnailUrl: data.url }));
    } catch (err) {
      setFormError(err?.response?.data?.error || "Thumbnail upload failed");
    } finally {
      setThumbProgress(null);
    }
  };

  const uploadVideoFile = async (file) => {
    setVideoFileName(file.name);
    setVideoProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/api/upload/video", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setVideoProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setForm((prev) => ({ ...prev, videoUrl: data.url }));
    } catch (err) {
      setFormError(err?.response?.data?.error || "Video upload failed");
    } finally {
      setVideoProgress(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (videoProgress !== null || thumbProgress !== null) {
      setFormError("Please wait for uploads to finish.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await api.put(`/api/admin/videos/${editingId}`, form);
      } else {
        await api.post("/api/admin/videos", form);
      }
      // Refresh series/category meta in case a new one was added
      const [seriesRes, catRes] = await Promise.all([
        api.get("/api/admin/videos/fields?type=story-series"),
        api.get("/api/admin/videos/fields?type=quick-video,song"),
      ]).catch(() => [{ data: { fields: seriesList } }, { data: { fields: categoryList } }]);
      setSeriesList(seriesRes.data?.fields || seriesList);
      setCategoryList(catRes.data?.fields || categoryList);
      closeForm();
      load();
    } catch (err) {
      setFormError(err?.response?.data?.error || "Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/videos/${id}`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete video");
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await api.patch(`/api/admin/videos/${id}/publish`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update");
    }
  };

  const displayedVideos = filterType ? videos.filter((v) => v.type === filterType) : videos;
  const formThumbPreview = form.thumbnailUrl || (videoMode === "url" ? getYouTubeThumbnail(form.videoUrl) : null);

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">

        {/* Header */}
        <section className="role-hero glass-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ textAlign: "left" }}>
              <h1>🎬 Video Manager</h1>
              <p>Manage videos that appear in the WATCH &amp; LEARN section.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Link to="/admin/dashboard" className="btn-secondary-glass">← Dashboard</Link>
              <button type="button" className="btn-register" onClick={openAdd}>+ Add Video</button>
            </div>
          </div>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        {/* Filter bar */}
        <section className="glass-card" style={{ padding: "1rem 1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-muted, #aaa)" }}>Show:</span>
            <button type="button" className={filterType === "" ? "btn-register" : "btn-secondary-glass"} onClick={() => setFilterType("")} style={{ padding: "0.28rem 0.85rem", fontSize: "0.82rem" }}>
              All ({total})
            </button>
            {VIDEO_TYPES.map((t) => (
              <button key={t.value} type="button" className={filterType === t.value ? "btn-register" : "btn-secondary-glass"} onClick={() => setFilterType(t.value)} style={{ padding: "0.28rem 0.85rem", fontSize: "0.82rem" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Video grid */}
        <section className="glass-card">
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted, #aaa)" }}>Loading videos…</div>
          ) : displayedVideos.length === 0 ? (
            <div className="admin-videos-empty">
              <span style={{ fontSize: "4rem" }}>🎬</span>
              <h3>No videos yet.</h3>
              <p>Add your first video to get started!</p>
              <button type="button" className="btn-register" onClick={openAdd}>+ Add First Video</button>
            </div>
          ) : (
            <div className="admin-video-grid">
              {displayedVideos.map((v) => {
                const tm = TYPE_META[v.type] || TYPE_META["quick-video"];
                const thumb = displayThumb(v);
                return (
                  <article key={v._id} className="admin-video-card glass-card">
                    <div className="admin-video-thumb" onClick={() => setPreviewVideo(v)}>
                      {thumb ? <img src={thumb} alt={v.title} /> : <div className="admin-video-thumb-placeholder">{tm.icon}</div>}
                      <span className="admin-video-type-badge" style={{ background: tm.color }}>
                        {tm.icon} {tm.label}{v.type === "story-series" && v.episodeNumber ? ` · Ep ${v.episodeNumber}` : ""}
                      </span>
                      <div className="admin-video-play-overlay">▶</div>
                    </div>
                    <div className="admin-video-info">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <strong style={{ fontSize: "0.93rem", lineHeight: 1.3 }}>{v.title}</strong>
                        <span className={v.isPublished ? "badge-ok" : "badge-pending"} style={{ flexShrink: 0 }}>{v.isPublished ? "Live" : "Draft"}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)", marginTop: "0.3rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {v.field ? <span className="video-field-tag">{v.field}</span> : null}
                        {v.type === "story-series" && v.episodeNumber ? <span>Ep {v.episodeNumber}</span> : null}
                        {v.views > 0 ? <span>👁 {v.views}</span> : null}
                        {isLocalUrl(v.videoUrl) ? <span title="Uploaded file" style={{ opacity: 0.6 }}>📁</span> : null}
                      </div>
                    </div>
                    <div className="admin-video-actions">
                      <button type="button" className="btn-secondary-glass" style={{ fontSize: "0.76rem", padding: "0.28rem 0.65rem" }} onClick={() => setPreviewVideo(v)}>Preview</button>
                      <button type="button" className="btn-secondary-glass" style={{ fontSize: "0.76rem", padding: "0.28rem 0.65rem" }} onClick={() => openEdit(v)}>Edit</button>
                      <button type="button" className={v.isPublished ? "btn-secondary-glass" : "btn-register"} style={{ fontSize: "0.76rem", padding: "0.28rem 0.65rem" }} onClick={() => handleTogglePublish(v._id)}>
                        {v.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" className="btn-danger-glass" style={{ fontSize: "0.76rem", padding: "0.28rem 0.65rem" }} onClick={() => setDeleteConfirm(v)}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "95%" }}>

            {/* Step 1 – type picker (add only) */}
            {!editingId && !form.type ? (
              <>
                <h2 style={{ marginBottom: "0.4rem" }}>What type of video?</h2>
                <p style={{ opacity: 0.6, fontSize: "0.88rem", marginBottom: "1.4rem" }}>Choose a type to continue.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
                  {VIDEO_TYPES.map((t) => (
                    <button key={t.value} type="button" className="video-type-picker-btn"
                      onClick={() => setForm((p) => ({ ...p, type: t.value }))}>
                      <span style={{ fontSize: "2.2rem", lineHeight: 1 }}>{t.icon}</span>
                      <strong style={{ fontSize: "0.9rem" }}>{t.label}</strong>
                      <span style={{ fontSize: "0.72rem", opacity: 0.6, lineHeight: 1.3 }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: "1.2rem", textAlign: "right" }}>
                  <button type="button" className="btn-secondary-glass" onClick={closeForm}>Cancel</button>
                </div>
              </>
            ) : (
              /* Step 2 – full form */
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1.2rem" }}>
                  {!editingId && (
                    <button type="button" className="btn-secondary-glass" style={{ padding: "0.28rem 0.65rem", fontSize: "0.82rem" }}
                      onClick={() => { setForm((p) => ({ ...p, type: "", field: "" })); setNewCategoryInput(""); }}>←</button>
                  )}
                  <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span>{TYPE_META[form.type]?.icon}</span>
                    {editingId ? "Edit" : "Add"} {TYPE_META[form.type]?.label}
                  </h2>
                </div>

                {formError && <p className="error-msg" style={{ marginBottom: "0.75rem" }}>{formError}</p>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

                  {/* Title */}
                  <label className="form-label">
                    Title *
                    <input className="form-input" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder={form.type === "story-series" ? "e.g. The Deep Blue" : form.type === "song" ? "e.g. ABC Song" : "e.g. Learn Colors with Panda"}
                      required />
                  </label>

                  {/* ── Story Series: series picker + episode number ── */}
                  {form.type === "story-series" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <span className="form-label" style={{ display: "block", marginBottom: "0.35rem" }}>Series *</span>
                        {seriesList.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                            {seriesList.map((s) => (
                              <Chip key={s} label={`📺 ${s}`} active={form.field === s}
                                onClick={() => setForm((p) => ({ ...p, field: s }))} />
                            ))}
                          </div>
                        )}
                        <input className="form-input"
                          value={form.field}
                          onChange={(e) => setForm({ ...form, field: e.target.value })}
                          placeholder={seriesList.length > 0 ? "Or type a new series name…" : "e.g. Sea Adventure"}
                          required
                        />
                      </div>
                      <label className="form-label">
                        Episode Number *
                        <NumberSpinner
                          value={form.episodeNumber}
                          min={1}
                          onChange={(v) => setForm({ ...form, episodeNumber: v })}
                        />
                      </label>
                    </div>
                  )}

                  {/* ── Quick Video / Song: category chips ── */}
                  {form.type !== "story-series" && (
                    <div>
                      <span className="form-label" style={{ display: "block", marginBottom: "0.35rem" }}>Category / Theme</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                        {allCategories.map((cat) => (
                          <Chip
                            key={cat}
                            label={`${FIELD_EMOJIS[cat] || "🏷️"} ${cat}`}
                            active={form.field === cat && !newCategoryInput}
                            onClick={() => {
                              setForm((p) => ({ ...p, field: p.field === cat && !newCategoryInput ? "" : cat }));
                              setNewCategoryInput("");
                            }}
                          />
                        ))}
                      </div>
                      <input className="form-input"
                        value={newCategoryInput}
                        onChange={(e) => {
                          setNewCategoryInput(e.target.value);
                          setForm((p) => ({ ...p, field: e.target.value }));
                        }}
                        placeholder="Or type a custom category…"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <label className="form-label">
                    Description
                    <textarea className="form-input" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Short description…" rows={2} style={{ resize: "vertical" }} />
                  </label>

                  {/* ── Video source ── */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span className="form-label" style={{ margin: 0 }}>Video *</span>
                      <ModeToggle mode={videoMode} onChange={(m) => { setVideoMode(m); if (m === "url") { setVideoFileName(""); } }} />
                    </div>

                    {videoMode === "url" ? (
                      <input
                        className="form-input"
                        value={form.videoUrl}
                        onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=…"
                        required={videoMode === "url"}
                      />
                    ) : (
                      <>
                        <FilePicker
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          hint="Choose a video file (mp4, webm, mov) — max 500 MB"
                          progress={videoProgress}
                          fileName={videoFileName}
                          onFile={uploadVideoFile}
                        />
                        <input type="text" style={{ display: "none" }} value={form.videoUrl} readOnly required={videoMode === "file"} />
                        {form.videoUrl && videoMode === "file" && (
                          <p style={{ fontSize: "0.75rem", marginTop: "0.3rem", color: "#34d399", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            ✓ Uploaded: <span style={{ opacity: 0.8 }}>{form.videoUrl.split("/").pop()}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* ── Thumbnail / Cover image ── */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span className="form-label" style={{ margin: 0 }}>
                        {form.type === "story-series" ? "Cover Image" : "Thumbnail"}
                        <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: "0.35rem" }}>(optional)</span>
                      </span>
                      <ModeToggle mode={thumbMode} onChange={(m) => { setThumbMode(m); if (m === "url") { setThumbFileName(""); } }} />
                    </div>

                    {thumbMode === "url" ? (
                      <>
                        <input
                          className="form-input"
                          value={form.thumbnailUrl}
                          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                          placeholder="https://… (leave blank to auto-detect from YouTube)"
                        />
                        {!form.thumbnailUrl && videoMode === "url" && getYouTubeThumbnail(form.videoUrl) && (
                          <p style={{ fontSize: "0.72rem", marginTop: "0.3rem", opacity: 0.6 }}>
                            Auto-preview from YouTube will be used.
                          </p>
                        )}
                      </>
                    ) : (
                      <FilePicker
                        accept="image/*"
                        hint="Choose an image (jpg, png, webp) — max 10 MB"
                        progress={thumbProgress}
                        fileName={thumbFileName}
                        onFile={uploadThumbnailFile}
                      />
                    )}

                    {formThumbPreview && (
                      <img
                        src={formThumbPreview}
                        alt="thumbnail preview"
                        onError={(e) => { e.target.style.display = "none"; }}
                        style={{ marginTop: "0.5rem", height: "80px", borderRadius: "0.5rem", objectFit: "cover", display: "block" }}
                      />
                    )}
                  </div>

                  {/* Publish */}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.isPublished}
                      onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                      style={{ width: "1.1rem", height: "1.1rem" }} />
                    <span style={{ fontWeight: 500 }}>Publish immediately (shows on home page)</span>
                  </label>

                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                    <button type="button" className="btn-secondary-glass" onClick={closeForm} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-register" disabled={saving || videoProgress !== null || thumbProgress !== null}>
                      {saving ? "Saving…" : videoProgress !== null ? "Uploading video…" : thumbProgress !== null ? "Uploading image…" : editingId ? "Save Changes" : `Add ${TYPE_META[form.type]?.label}`}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewVideo && (
        <div className="vp-overlay" onClick={() => setPreviewVideo(null)} style={{ zIndex: 800 }}>
          <div className="vp-modal" onClick={(e) => e.stopPropagation()}>

            <div className="vp-accent-bar" style={{ background: TYPE_META[previewVideo.type]?.color || "#7c3aed" }} />

            <div className="vp-header">
              <div className="vp-header-left">
                <span className="vp-type-badge" style={{ background: TYPE_META[previewVideo.type]?.color || "#7c3aed" }}>
                  {TYPE_META[previewVideo.type]?.icon} {TYPE_META[previewVideo.type]?.label}
                </span>
                {previewVideo.type === "story-series" && previewVideo.episodeNumber ? (
                  <span className="vp-ep-badge">Ep {previewVideo.episodeNumber}</span>
                ) : null}
                {previewVideo.field ? (
                  <span className="vp-field-badge">📚 {previewVideo.field}</span>
                ) : null}
                {previewVideo.views > 0 ? (
                  <span className="vp-ep-badge">👁 {previewVideo.views}</span>
                ) : null}
              </div>
              <h2 className="vp-header-title">{previewVideo.title}</h2>
              <div className="vp-header-right">
                <button type="button" className="vp-close-x" onClick={() => setPreviewVideo(null)} aria-label="Đóng">
                  Đóng
                </button>
              </div>
            </div>

            <div className="vp-screen">
              {isLocalUrl(previewVideo.videoUrl) ? (
                <video src={previewVideo.videoUrl} controls autoPlay className="vp-video-el" />
              ) : (
                <iframe
                  src={getEmbedUrl(previewVideo.videoUrl)}
                  title={previewVideo.title}
                  className="vp-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", width: "95%", textAlign: "center" }}>
            <h2>Delete Video?</h2>
            <p style={{ margin: "0.75rem 0 1.5rem" }}>
              Delete <strong>{deleteConfirm.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button type="button" className="btn-secondary-glass" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="btn-danger-glass" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideosPage;
