import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GameCard from "../components/GameCard";
import StoryCard from "../components/StoryCard";
import SeriesCard from "../components/SeriesCard";
import SeriesDetailModal from "../components/SeriesDetailModal";
import SongCard from "../components/SongCard";
import MascotGreeting from "../components/MascotGreeting";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { games } from "../data/games";
import useSound from "../hooks/useSound";
import api from "../lib/api";
import earthPlanet from "../assets/general/planet/earth.png";
import jupiterPlanet from "../assets/general/planet/jupiter.png";
import marsPlanet from "../assets/general/planet/mars.png";
import starRock from "../assets/general/star/star.png";

const STARS = Array.from({ length: 100 }, (_, index) => ({
  id: index,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() > 0.7 ? 2 : 1,
  duration: (Math.random() * 3 + 2).toFixed(2),
  delay: (Math.random() * 5).toFixed(2),
}));

// ── Helpers ──────────────────────────────────────────────────
const getYouTubeId = (url) => {
  const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const getEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
};


// Transform API video list to the shape SeriesCard + SeriesDetailModal expect
const groupIntoSeries = (episodes) => {
  const map = {};
  episodes.forEach((v) => {
    const key = v.field || v.title;
    if (!map[key]) {
      map[key] = {
        _id: v._id,
        id: key.toLowerCase().replace(/\s+/g, "-"),
        title: v.field || v.title,
        description: v.description || "",
        thumbnail: v.thumbnailUrl || null,
        theme: "#42B8FF",
        characterName: v.characterName || "",
        currentEpisode: 1,
        episodes: [],
      };
    }
    map[key].episodes.push({
      id: v.episodeNumber ?? map[key].episodes.length + 1,
      _id: v._id,
      title: v.title,
      videoPath: v.videoUrl,
      videoUrl: v.videoUrl,
      duration: "",
    });
  });
  Object.values(map).forEach((s) => {
    s.episodes.sort((a, b) => a.id - b.id);
  });
  return Object.values(map);
};

// Transform API video to StoryCard shape
const toStoryCard = (v) => ({
  id: v._id,
  _id: v._id,
  title: v.title,
  description: v.description || "",
  thumbnail: v.thumbnailUrl || null,
  emoji: "🎬",
  theme: "#42B8FF",
  videoPath: v.videoUrl,
  videoUrl: v.videoUrl,
});

// Transform API video to SongCard shape
const toSongCard = (v) => ({
  id: v._id,
  _id: v._id,
  title: v.title,
  thumbnail: v.thumbnailUrl || null,
  emoji: "🎵",
  theme: "#FF6B9D",
  videoUrl: v.videoUrl,
});

const HOME_TYPE_META = {
  series:       { label: "Series",  icon: "📺", color: "rgba(180,83,9,0.9)"   },
  "quick-video":{ label: "Video",   icon: "🎬", color: "rgba(124,58,237,0.9)" },
  song:         { label: "Song",    icon: "🎵", color: "rgba(8,145,178,0.9)"  },
};

// ── VideoPlayerModal ─────────────────────────────────────────
const VideoPlayerModal = ({ video, onClose }) => {
  if (!video) return null;
  const url = video.videoUrl || video.videoPath || "";
  const local = url.startsWith("/uploads/");
  const tm = HOME_TYPE_META[video.type] || HOME_TYPE_META["quick-video"];

  return (
    <div className="vp-overlay" role="dialog" aria-modal="true" aria-label={video.title} onClick={onClose} style={{ zIndex: 700 }}>
      <div className="vp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Accent line */}
        <div className="vp-accent-bar" style={{ background: tm.color }} />

        {/* Header: badges | centered title | close X */}
        <div className="vp-header">
          <div className="vp-header-left">
            <span className="vp-type-badge" style={{ background: tm.color }}>
              {tm.icon} {tm.label}
            </span>
            {video.characterName ? (
              <span className="vp-header-char">🧸 {video.characterName}</span>
            ) : null}
          </div>
          <h2 className="vp-header-title">{video.title}</h2>
          <div className="vp-header-right">
            <button type="button" className="vp-close-x" onClick={onClose} aria-label="Đóng">
              Đóng
            </button>
          </div>
        </div>

        {/* Video */}
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

// ── Main Component ───────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { playPop } = useSound();
  const { t } = useTranslation();

  const [gameTab, setGameTab] = useState("all");
  const [videoTab, setVideoTab] = useState("series");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [playerVideo, setPlayerVideo] = useState(null);

  // Video data from API
  const [seriesList, setSeriesList] = useState([]);
  const [quickVideos, setQuickVideos] = useState([]);
  const [songs, setSongs] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);

  // Track which video IDs have been view-counted this session
  const viewedIds = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    const loadVideos = async () => {
      try {
        const [seriesRes, quickRes, songRes] = await Promise.all([
          api.get("/api/videos?type=story-series"),
          api.get("/api/videos?type=quick-video"),
          api.get("/api/videos?type=song"),
        ]);
        if (cancelled) return;
        setSeriesList(groupIntoSeries(seriesRes.data.videos || []));
        setQuickVideos((quickRes.data.videos || []).map(toStoryCard));
        setSongs((songRes.data.videos || []).map(toSongCard));
      } catch {
        // silent — videos section just stays empty
      } finally {
        if (!cancelled) setVideosLoading(false);
      }
    };
    loadVideos();
    return () => { cancelled = true; };
  }, []);

  const recordView = (id) => {
    if (!id || viewedIds.current.has(String(id))) return;
    viewedIds.current.add(String(id));
    api.post(`/api/videos/${id}/view`).catch(() => {});
  };

  const openPlayer = (video) => {
    setPlayerVideo(video);
    if (video._id) recordView(video._id);
  };

  const closePlayer = () => setPlayerVideo(null);

  return (
    <div className="screen with-bg space-bg">
      <Navbar />

      <div className="star-field" aria-hidden="true">
        {STARS.map((star) => (
          <span
            key={star.id}
            className="space-star"
            style={{
              "--star-x": `${star.x}%`,
              "--star-y": `${star.y}%`,
              "--star-size": `${star.size}px`,
              "--star-duration": `${star.duration}s`,
              "--star-delay": `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="nebula-glow" aria-hidden="true" />

      <div className="floating-decorations" aria-hidden="true">
        <span className="float-star f1">✦</span>
        <span className="float-star f2">★</span>
        <span className="float-star f3">✦</span>
        <span className="float-star f4">★</span>
        <span className="float-star f5">✦</span>
        <span className="float-star f6">★</span>
      </div>

      <main className="home-main">
        <section className="hero">
          <div className="planets-layer" aria-hidden="true">
            <img src={earthPlanet} alt="" className="planet planet-orb" />
            <img src={jupiterPlanet} alt="Jupiter" className="planet planet-jupiter" />
            <img src={marsPlanet} alt="Mars" className="planet planet-mars" />
            <img src={starRock} alt="" className="asteroid a1" />
            <img src={starRock} alt="" className="asteroid a2" />
            <img src={starRock} alt="" className="asteroid a3" />
          </div>

          <div className="hero-title-wrapper">
            <h1 className="space-title">
              <span>FUN</span>
              <span>ENGLISH</span>
            </h1>
            <p className="hero-subtitle">{t("home.heroSubtitle")}</p>
          </div>
        </section>

        {/* ── Games ── */}
        <section className="games-section">
          <h2 className="section-title">{t("home.chooseGame")}</h2>
          <div className="section-divider" />

          <div className="video-tabs">
            <button
              type="button"
              className={`video-tab-btn${gameTab === "all" ? " active" : ""}`}
              onClick={() => setGameTab("all")}
            >
              {t("home.tabAll")}
            </button>
            <button
              type="button"
              className={`video-tab-btn${gameTab === "basic" ? " active" : ""}`}
              onClick={() => setGameTab("basic")}
            >
              {t("home.tabBasic")}
            </button>
            <button
              type="button"
              className={`video-tab-btn${gameTab === "ai" ? " active" : ""}`}
              onClick={() => setGameTab("ai")}
            >
              {t("home.tabFunAi")}
            </button>
          </div>

          <div className="game-grid home-game-grid">
            {games.filter((g) => gameTab === "all" || g.category === gameTab).map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onClick={() => {
                  playPop();
                  navigate(game.route || `/game/${game.id}`);
                }}
              />
            ))}
          </div>
        </section>

        {/* ── Watch & Learn ── */}
        <section className="stories-section">
          <h2 className="section-title">{t("home.watchLearn")}</h2>
          <div className="section-divider" />

          <div className="video-tabs">
            <button
              type="button"
              className={`video-tab-btn${videoTab === "all" ? " active" : ""}`}
              onClick={() => setVideoTab("all")}
            >
              {t("home.tabAll")}
            </button>
            <button
              type="button"
              className={`video-tab-btn${videoTab === "series" ? " active" : ""}`}
              onClick={() => setVideoTab("series")}
            >
              {t("home.tabSeries")}
            </button>
            <button
              type="button"
              className={`video-tab-btn${videoTab === "quick" ? " active" : ""}`}
              onClick={() => setVideoTab("quick")}
            >
              {t("home.tabQuickVideos")}
            </button>
            <button
              type="button"
              className={`video-tab-btn${videoTab === "songs" ? " active" : ""}`}
              onClick={() => setVideoTab("songs")}
            >
              {t("home.tabSongs")}
            </button>
          </div>

          {/* ── All tab ── */}
          {videoTab === "all" && (
            videosLoading ? (
              <VideoTabSkeleton />
            ) : (seriesList.length === 0 && quickVideos.length === 0 && songs.length === 0) ? (
              <VideoEmptyState icon="🎬" label="Videos" />
            ) : (
              <div className="story-grid home-story-grid">
                {seriesList.map((series, index) => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    index={index}
                    onClick={() => { playPop(); setSelectedSeries(series); }}
                  />
                ))}
                {quickVideos.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    index={index}
                    onClick={() => { playPop(); openPlayer(story); }}
                  />
                ))}
                {songs.map((song, index) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    index={index}
                    onClick={() => { playPop(); openPlayer(song); }}
                  />
                ))}
              </div>
            )
          )}

          {/* ── Story Series tab ── */}
          {videoTab === "series" && (
            videosLoading ? (
              <VideoTabSkeleton />
            ) : seriesList.length === 0 ? (
              <VideoEmptyState icon="📺" label="Story Series" />
            ) : (
              <div className="story-grid home-story-grid">
                {seriesList.map((series, index) => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    index={index}
                    onClick={() => {
                      playPop();
                      setSelectedSeries(series);
                    }}
                  />
                ))}
              </div>
            )
          )}

          {/* ── Quick Videos tab ── */}
          {videoTab === "quick" && (
            videosLoading ? (
              <VideoTabSkeleton />
            ) : quickVideos.length === 0 ? (
              <VideoEmptyState icon="⚡" label="Quick Videos" />
            ) : (
              <div className="story-grid home-story-grid">
                {quickVideos.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    index={index}
                    onClick={() => {
                      playPop();
                      openPlayer(story);
                    }}
                  />
                ))}
              </div>
            )
          )}

          {/* ── Songs tab ── */}
          {videoTab === "songs" && (
            videosLoading ? (
              <VideoTabSkeleton />
            ) : songs.length === 0 ? (
              <VideoEmptyState icon="🎵" label="Songs" />
            ) : (
              <div className="story-grid home-story-grid">
                {songs.map((song, index) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    index={index}
                    onClick={() => {
                      playPop();
                      openPlayer(song);
                    }}
                  />
                ))}
              </div>
            )
          )}
        </section>
      </main>

      <MascotGreeting user={user} isAuthLoading={loading} />

      {/* ── Series Detail Modal ── */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlayEpisode={(ep) => {
            setSelectedSeries(null);
            recordView(ep._id);
            openPlayer({ _id: ep._id, title: ep.title, videoUrl: ep.videoPath || ep.videoUrl, description: "" });
          }}
        />
      )}

      {/* ── Video Player Modal ── */}
      <VideoPlayerModal video={playerVideo} onClose={closePlayer} />
    </div>
  );
};

// ── Small helper components ──────────────────────────────────
const VideoTabSkeleton = () => (
  <div className="story-grid home-story-grid">
    {[1, 2, 3].map((i) => (
      <div key={i} className="story-card" style={{ background: "rgba(255,255,255,0.04)", height: "220px", borderRadius: "1.25rem", animation: "pulse 1.5s ease-in-out infinite" }} />
    ))}
  </div>
);

const VideoEmptyState = ({ icon, label }) => {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "rgba(255,255,255,0.5)" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>{icon}</div>
      <p style={{ fontSize: "1rem", margin: 0 }}>{t("home.noContent", { label })}</p>
    </div>
  );
};

export default HomePage;
