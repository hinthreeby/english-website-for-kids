import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

// ── Inject CSS ────────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("forum-styles")) {
  const s = document.createElement("style");
  s.id = "forum-styles";
  s.textContent = `
    @keyframes tcSlideIn  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes forumFadeUp { from { opacity:0; transform:translateY(6px);  } to { opacity:1; transform:translateY(0); } }

    .forum-card {
      background: rgba(15,5,40,0.72);
      border: 1px solid rgba(123,47,247,0.22);
      border-radius: 18px;
      padding: 1.25rem 1.4rem;
      transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s;
      animation: forumFadeUp 0.38s ease;
    }
    .forum-card:hover {
      border-color: rgba(123,47,247,0.5);
      box-shadow: 0 8px 36px rgba(123,47,247,0.16);
      transform: translateY(-2px);
    }
    .forum-card.highlighted {
      border-color: rgba(124,58,237,0.7) !important;
      box-shadow: 0 0 0 2px rgba(124,58,237,0.4), 0 8px 36px rgba(124,58,237,0.25) !important;
    }

    .forum-action {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: none; cursor: pointer;
      font-size: 12px; font-weight: 600;
      padding: 0.38rem 0.7rem; border-radius: 8px;
      color: #64748b;
      transition: background 0.15s, color 0.15s;
      font-family: var(--font-ui);
    }
    .forum-action:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
    .forum-action.liked  { color: #f9a8d4; }
    .forum-action.liked:hover { background: rgba(249,168,212,0.1); }
    .forum-action.saved  { color: #fcd34d; }
    .forum-action.saved:hover { background: rgba(252,211,77,0.1); }
    .forum-action:disabled { opacity: 0.5; cursor: default; }

    .forum-type-pill {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 700;
      padding: 0.18rem 0.6rem; border-radius: 20px; border: 1px solid;
      letter-spacing: 0.04em; text-transform: uppercase;
    }

    .forum-upload-zone {
      border: 2px dashed rgba(255,255,255,0.18);
      border-radius: 14px; padding: 2.25rem 1rem;
      text-align: center; cursor: pointer;
      transition: border-color 0.18s, background 0.18s;
    }
    .forum-upload-zone:hover, .forum-upload-zone.dragover {
      border-color: rgba(124,58,237,0.7);
      background: rgba(124,58,237,0.06);
    }
    .forum-upload-zone.has-file {
      border-color: rgba(16,185,129,0.55);
      background: rgba(16,185,129,0.05);
    }

    .forum-filter-btn {
      font-size: 12px; padding: 0.38rem 0.9rem; border-radius: 20px; cursor: pointer;
      border: 1.5px solid; transition: all 0.15s; font-family: var(--font-ui); font-weight: 600;
      white-space: nowrap;
    }

    .forum-sidebar-card {
      background: rgba(15,5,40,0.7); backdrop-filter: blur(18px);
      border: 1px solid rgba(123,47,247,0.22); border-radius: 18px;
      padding: 1.1rem 1.25rem;
    }

    .forum-sidebar-h {
      font-family: var(--font-heading); font-size: 13px; font-weight: 700;
      color: #c4b5fd; margin: 0 0 0.85rem;
      display: flex; align-items: center; gap: 0.4rem;
    }

    .forum-tag-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.42rem 0.75rem; border-radius: 9px; cursor: pointer;
      border: 1px solid; font-size: 12px; font-weight: 500;
      transition: all 0.15s; text-align: left; width: 100%; font-family: var(--font-ui);
    }
    .forum-tag-btn.active { font-weight: 700; }

    .forum-follow-btn {
      font-size: 11px; padding: 0.22rem 0.7rem; border-radius: 20px; cursor: pointer;
      border: 1px solid rgba(124,58,237,0.4); color: #c4b5fd;
      font-weight: 600; transition: background 0.15s; font-family: var(--font-ui);
      white-space: nowrap;
    }
    .forum-follow-btn.following {
      background: rgba(124,58,237,0.35); border-color: rgba(124,58,237,0.7);
    }
    .forum-follow-btn:not(.following) { background: rgba(124,58,237,0.15); }
    .forum-follow-btn:hover { background: rgba(124,58,237,0.32); }

    .forum-comment-input {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 10px; padding: 0.6rem 0.9rem;
      color: #e2e8f0; font-size: 13px; resize: none; outline: none;
      font-family: inherit; line-height: 1.6;
      transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    }
    .forum-comment-input:focus {
      border-color: rgba(124,58,237,0.65);
      box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
      background: rgba(124,58,237,0.03);
    }

    /* ── Post action bar ──────────────────────────────────────── */
    .forum-action-bar {
      display: flex; align-items: center; gap: 0.1rem; flex-wrap: wrap;
      padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.07);
    }
    .forum-action.comment-open {
      color: #c4b5fd !important; background: rgba(124,58,237,0.14) !important;
    }
    .forum-action.liked:hover  { box-shadow: 0 0 12px rgba(249,168,212,0.2) inset; }
    .forum-action.saved:hover  { box-shadow: 0 0 12px rgba(252,211,77,0.2) inset; }

    /* ── Comments section ─────────────────────────────────────── */
    .forum-comments-section {
      margin-top: 0.8rem;
      padding: 0.9rem 1rem;
      border-radius: 14px;
      background: rgba(0,0,0,0.18);
      border: 1px solid rgba(255,255,255,0.07);
      animation: forumFadeUp 0.22s ease;
    }

    .forum-comment-item {
      display: flex; gap: 0.6rem; align-items: flex-start;
      padding: 0.6rem 0.7rem; border-radius: 10px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      position: relative; transition: background 0.15s, border-color 0.15s;
    }
    .forum-comment-item:hover {
      background: rgba(124,58,237,0.06); border-color: rgba(124,58,237,0.15);
    }

    .forum-comment-compose {
      display: flex; gap: 0.55rem; align-items: flex-end;
      padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.07);
    }

    .forum-comment-submit {
      flex-shrink: 0; padding: 0.58rem 1rem; border-radius: 10px; cursor: pointer;
      background: rgba(124,58,237,0.25); border: 1.5px solid rgba(124,58,237,0.5);
      color: #c4b5fd; font-size: 12px; font-weight: 700; font-family: var(--font-ui);
      transition: all 0.15s; white-space: nowrap; line-height: 1.4;
    }
    .forum-comment-submit:hover:not(:disabled) {
      background: rgba(124,58,237,0.42); border-color: rgba(124,58,237,0.75);
      box-shadow: 0 0 14px rgba(124,58,237,0.35);
    }
    .forum-comment-submit:disabled { opacity: 0.35; cursor: default; }

    /* ── CreatePost 2-column layout ───────────────────────────── */
    .forum-create-wrap {
      padding: 0 !important;
      overflow: hidden;
      animation: tcSlideIn 0.32s ease;
    }

    .forum-create-header {
      padding: 1.6rem 2rem 1.4rem;
      background: linear-gradient(135deg,rgba(124,58,237,0.14) 0%,rgba(219,39,119,0.05) 55%,transparent 100%);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
      position: relative; overflow: hidden;
    }
    .forum-create-header::before {
      content: ""; position: absolute; top: -40px; right: -30px;
      width: 180px; height: 180px; border-radius: 50%;
      background: radial-gradient(circle,rgba(219,39,119,0.08),transparent 70%);
      pointer-events: none;
    }
    .forum-create-header-title {
      font-size: 1.55rem; font-weight: 800; font-family: var(--font-heading);
      color: #f1f5f9; margin: 0 0 0.2rem; line-height: 1.2;
      background: linear-gradient(135deg,#e2e8f0,#c4b5fd);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .forum-create-body {
      display: grid;
      grid-template-columns: 360px 1fr;
      min-height: 0;
    }
    @media (max-width: 780px) {
      .forum-create-body { grid-template-columns: 1fr; }
      .forum-create-left { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
    }

    .forum-create-left {
      padding: 1.4rem 1.5rem;
      border-right: 1px solid rgba(255,255,255,0.07);
      background: rgba(0,0,0,0.12);
      display: flex; flex-direction: column; gap: 1.1rem;
    }

    .forum-create-right {
      padding: 1.5rem 1.75rem;
      display: flex; flex-direction: column; gap: 1rem;
    }

    .forum-section-label {
      font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
      text-transform: uppercase; color: #7c3aed;
    }

    .forum-type-grid {
      display: grid; grid-template-columns: repeat(3,1fr); gap: 0.4rem;
    }

    .forum-type-card {
      padding: 0.9rem 0.3rem 0.75rem; border-radius: 14px; cursor: pointer;
      background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1);
      color: #64748b; display: flex; flex-direction: column;
      align-items: center; gap: 0.32rem; transition: all 0.18s; outline: none;
    }
    .forum-type-card:hover {
      background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2);
      color: #94a3b8; transform: translateY(-1px);
    }
    .forum-type-card.active {
      background: var(--tc-bg,rgba(124,58,237,0.2));
      border-color: var(--tc-border,rgba(124,58,237,0.55));
      color: var(--tc-text,#c4b5fd);
      box-shadow: 0 0 0 2.5px var(--tc-glow,rgba(124,58,237,0.25)), 0 6px 20px var(--tc-glow,rgba(124,58,237,0.15));
      transform: translateY(-1px);
    }
    .forum-type-icon { font-size: 24px; line-height: 1; }
    .forum-type-label { font-size: 10.5px; font-weight: 700; font-family: var(--font-ui); letter-spacing: 0.02em; }
    .forum-type-desc { font-size: 11.5px; color: #475569; line-height: 1.5; margin: 0; }

    .forum-field-label {
      font-size: 12px; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 0.4rem;
    }
    .forum-input-field, .forum-textarea-field {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 10px; padding: 0.72rem 1rem;
      color: #e2e8f0; font-size: 14px; outline: none;
      font-family: inherit; transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    }
    .forum-input-field:focus, .forum-textarea-field:focus {
      border-color: rgba(124,58,237,0.65);
      box-shadow: 0 0 0 3px rgba(124,58,237,0.14);
      background: rgba(124,58,237,0.03);
    }
    .forum-input-field.err, .forum-textarea-field.err { border-color: rgba(239,68,68,0.6); }
    .forum-textarea-field { resize: vertical; line-height: 1.65; }
    .forum-field-error { color: #f87171; font-size: 12px; margin-top: 0.3rem; }

    .forum-upload-zone-lg {
      border: 2px dashed rgba(255,255,255,0.16); border-radius: 14px;
      padding: 1.65rem 0.75rem; text-align: center; cursor: pointer;
      transition: border-color 0.18s, background 0.18s;
    }
    .forum-upload-zone-lg:hover, .forum-upload-zone-lg.dragover {
      border-color: rgba(124,58,237,0.65); background: rgba(124,58,237,0.05);
    }
    .forum-upload-zone-lg.has-file {
      border-color: rgba(16,185,129,0.5); background: rgba(16,185,129,0.04);
    }

    .forum-btn-publish {
      flex: 1; padding: 0.85rem 1.5rem; border-radius: 12px; border: none;
      cursor: pointer; font-size: 14px; font-weight: 800; font-family: var(--font-heading);
      letter-spacing: 0.02em;
      background: linear-gradient(135deg,#7c3aed,#db2777);
      color: #fff; box-shadow: 0 4px 22px rgba(124,58,237,0.38);
      transition: transform 0.18s, box-shadow 0.18s, opacity 0.15s;
    }
    .forum-btn-publish:hover:not(:disabled) {
      transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124,58,237,0.55);
    }
    .forum-btn-publish:disabled { opacity: 0.5; cursor: default; }

    .forum-btn-outline {
      padding: 0.65rem 1.25rem; border-radius: 10px;
      border: 1.5px solid rgba(255,255,255,0.14); cursor: pointer;
      font-size: 12.5px; font-weight: 600; font-family: var(--font-ui);
      background: transparent; color: #64748b; transition: all 0.15s; white-space: nowrap;
    }
    .forum-btn-outline:hover {
      border-color: rgba(255,255,255,0.28); color: #94a3b8;
      background: rgba(255,255,255,0.04);
    }

    .forum-create-footer {
      display: flex; gap: 0.75rem;
      padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.07);
      margin-top: auto;
    }

    /* ── Trending items ───────────────────────────────── */
    .forum-trending-item {
      display: flex; gap: 0.55rem; align-items: flex-start;
      padding: 0.48rem 0.6rem; border-radius: 10px; cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .forum-trending-item:hover {
      background: rgba(124,58,237,0.09); border-color: rgba(124,58,237,0.22);
      box-shadow: 0 0 12px rgba(124,58,237,0.1);
    }

    /* ── Active teacher cards ─────────────────────────── */
    .forum-teacher-card {
      padding: 0.6rem 0.65rem; border-radius: 12px;
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .forum-teacher-card:hover {
      background: rgba(124,58,237,0.07); border-color: rgba(124,58,237,0.22);
      box-shadow: 0 0 14px rgba(124,58,237,0.1);
    }
    .forum-teacher-badge {
      font-size: 9px; font-weight: 800; padding: 0.08rem 0.42rem;
      border-radius: 20px; letter-spacing: 0.05em; text-transform: uppercase;
      background: rgba(124,58,237,0.2); color: #c4b5fd;
      border: 1px solid rgba(124,58,237,0.4); flex-shrink: 0;
    }
    .forum-online-dot {
      position: absolute; bottom: -1px; right: -1px;
      width: 9px; height: 9px; border-radius: 50%;
      background: #10b981; border: 1.5px solid #0f0528;
      box-shadow: 0 0 6px rgba(16,185,129,0.85);
    }

    /* ── Notification panel ─────────────────────────── */
    .forum-notif-panel {
      background: rgba(15,5,40,0.88); backdrop-filter: blur(22px);
      border: 1px solid rgba(123,47,247,0.32); border-radius: 18px;
      padding: 1.1rem 1.25rem; animation: forumFadeUp 0.22s ease;
      max-height: 400px; overflow-y: auto;
      scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.4) transparent;
    }
    .forum-notif-item {
      display: flex; gap: 0.6rem; padding: 0.65rem 0.75rem;
      border-radius: 10px; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .forum-notif-item:hover { background: rgba(124,58,237,0.12) !important; }

    /* ── Bell button ────────────────────────────────── */
    .forum-bell-btn {
      position: relative;
      background: rgba(124,58,237,0.15); border: 1.5px solid rgba(124,58,237,0.4);
      border-radius: 12px; padding: 0.55rem 0.72rem; cursor: pointer;
      color: #c4b5fd; font-size: 18px; line-height: 1;
      transition: all 0.15s; flex-shrink: 0;
    }
    .forum-bell-btn:hover { background: rgba(124,58,237,0.28); border-color: rgba(124,58,237,0.7); }
    .forum-bell-btn.active { background: rgba(124,58,237,0.32); border-color: rgba(124,58,237,0.8); }
    .forum-bell-badge {
      position: absolute; top: -5px; right: -5px;
      min-width: 18px; height: 18px; border-radius: 9px;
      background: #f43f5e; font-size: 10px; font-weight: 800;
      color: #fff; display: flex; align-items: center; justify-content: center;
      padding: 0 3px; border: 1.5px solid #0f0528;
    }

    /* ── Following card (sidebar) ───────────────────── */
    .forum-following-card {
      padding: 0.6rem 0.65rem; border-radius: 12px;
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
      transition: background 0.15s, border-color 0.15s;
    }
    .forum-following-card:hover {
      background: rgba(124,58,237,0.07); border-color: rgba(124,58,237,0.22);
    }

    /* ── Media upload preview card ──────────────────── */
    .forum-media-preview-card {
      position: relative; border-radius: 14px; overflow: hidden;
      border: 1.5px solid rgba(16,185,129,0.38);
      background: rgba(0,0,0,0.28);
      transition: border-color 0.2s, box-shadow 0.2s;
      animation: forumFadeUp 0.22s ease;
    }
    .forum-media-preview-card:hover {
      border-color: rgba(16,185,129,0.6);
      box-shadow: 0 0 22px rgba(16,185,129,0.12);
    }
    .forum-media-preview-card.audio {
      border-color: rgba(245,158,11,0.38);
    }
    .forum-media-preview-card.audio:hover {
      border-color: rgba(245,158,11,0.65);
      box-shadow: 0 0 22px rgba(245,158,11,0.1);
    }
    .forum-media-preview-card.image {
      border-color: rgba(6,182,212,0.38);
    }
    .forum-media-preview-card.image:hover {
      border-color: rgba(6,182,212,0.65);
      box-shadow: 0 0 22px rgba(6,182,212,0.1);
    }

    .forum-media-remove-btn {
      position: absolute; top: 8px; right: 8px; z-index: 20;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(10,5,25,0.72); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.18);
      color: #94a3b8; cursor: pointer; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
      line-height: 1;
    }
    .forum-media-remove-btn:hover {
      background: rgba(239,68,68,0.75); color: #fff;
      border-color: rgba(239,68,68,0.9); transform: scale(1.1);
    }

    .forum-media-info-bar {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.6rem 0.9rem;
      background: rgba(15,5,40,0.65);
      border-top: 1px solid rgba(255,255,255,0.06);
      cursor: pointer;
    }
    .forum-media-info-bar:hover { background: rgba(15,5,40,0.82); }

    /* ── Dropzone error state ───────────────────────── */
    .forum-upload-zone-lg.err {
      border-color: rgba(239,68,68,0.55) !important;
      background: rgba(239,68,68,0.04) !important;
    }
  `;
  document.head.appendChild(s);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const POST_TYPES = [
  { value: "game",  label: "Game",  icon: "🎮", desc: "Share a game you created with the community" },
  { value: "text",  label: "Text",  icon: "📝", desc: "Share teaching tips or classroom experiences" },
  { value: "image", label: "Image", icon: "🖼️", desc: "Share a photo, chart, or visual resource" },
  { value: "video", label: "Video", icon: "🎬", desc: "Share a video lesson or clip" },
  { value: "audio", label: "Audio", icon: "🎵", desc: "Share an audio resource or recording" },
];

const TC = {
  game:  { bg: "rgba(124,58,237,0.2)",   border: "rgba(124,58,237,0.55)",  text: "#c4b5fd", glow: "rgba(124,58,237,0.3)"  },
  text:  { bg: "rgba(16,185,129,0.16)",  border: "rgba(16,185,129,0.5)",   text: "#6ee7b7", glow: "rgba(16,185,129,0.25)" },
  image: { bg: "rgba(6,182,212,0.16)",   border: "rgba(6,182,212,0.5)",    text: "#67e8f9", glow: "rgba(6,182,212,0.25)"  },
  video: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.45)",   text: "#fca5a5", glow: "rgba(239,68,68,0.25)"  },
  audio: { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.5)",   text: "#fcd34d", glow: "rgba(245,158,11,0.25)" },
};

const ALLOWED_MIMES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-msvideo"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/webm"],
};

const MEDIA_MAX_MB = { image: 5, video: 100, audio: 20 };
const MEDIA_ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm",
};
const MEDIA_HINT = {
  image: "JPG · PNG · GIF · WebP · max 5 MB",
  video: "MP4 · WebM · MOV · max 100 MB",
  audio: "MP3 · WAV · OGG · M4A · max 20 MB",
};

const AVATAR_COLORS = ["#c4b5fd","#6ee7b7","#67e8f9","#fcd34d","#fca5a5","#f9a8d4","#a5f3fc","#bbf7d0"];
const DESC_LIMIT = 1000;

// ── Utilities ─────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 2)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function avatarColor(id) {
  const n = (id || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function authorInitial(post) {
  return (post.author?.displayName || post.author?.username || "?")[0].toUpperCase();
}

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  // In development the Vite plugin at serveUploads() serves /uploads directly
  // from disk — use a relative URL so media loads even when the backend restarts.
  if (import.meta.env.DEV) {
    return url.startsWith("/") ? url : `/${url}`;
  }
  const base = import.meta.env.VITE_API_URL || "https://english-website-for-kids.onrender.com";
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

// Derive audio/video MIME type from file extension for <source type="...">
function mimeFromUrl(url) {
  if (!url) return "";
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  return (
    { mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4", aac: "audio/aac",
      mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", avi: "video/x-msvideo" }[ext] || ""
  );
}

// ── Trending / Active helpers ─────────────────────────────────────────────────

function calculateTrendingScore(post) {
  const likes    = post.likesCount    || 0;
  const comments = post.commentsCount || 0;
  const saves    = post.savesCount    || 0;
  const shares   = post.sharesCount   || 0;
  const views    = post.viewsCount    || 0;
  const ageDays  = (Date.now() - new Date(post.createdAt).getTime()) / 864e5;
  const recency  = Math.max(0, 1 - ageDays / 30);
  return likes * 3 + comments * 4 + saves * 2 + shares * 2 + views * 0.2 + recency * 5;
}

function getTrendingPosts(posts, n = 5) {
  return [...posts]
    .map((p) => ({ ...p, _score: calculateTrendingScore(p) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, n);
}

// Derive active teachers from post authors — fallback when API returns nothing
function getActiveTeachers(posts, n = 5) {
  const map = new Map();
  posts.forEach((p) => {
    const id = p.author?._id?.toString();
    if (!id) return;
    if (!map.has(id)) {
      map.set(id, {
        _id:            p.author._id,
        displayName:    p.author.displayName || p.author.username || "Teacher",
        initial:        (p.author.displayName || p.author.username || "T")[0].toUpperCase(),
        posts:          0,
        lastPostAt:     p.createdAt,
        isFollowing:    false,
        followersCount: 0,
      });
    }
    const t = map.get(id);
    t.posts += 1;
    if (new Date(p.createdAt) > new Date(t.lastPostAt)) t.lastPostAt = p.createdAt;
  });
  return [...map.values()].sort((a, b) => b.posts - a.posts).slice(0, n);
}

function lastActiveLabel(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 10)  return "Active now";
  if (mins < 60)  return "Active today";
  const days = Math.floor(mins / 1440);
  if (days < 1)   return "Active today";
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ── TypeBadge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const meta = POST_TYPES.find((t) => t.value === type) || POST_TYPES[1];
  const col  = TC[type] || TC.text;
  return (
    <span className="forum-type-pill" style={{ background: col.bg, color: col.text, borderColor: col.border }}>
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ post, size = 38 }) {
  const color = avatarColor(post.author?._id || post._id);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${color}28, ${color}55)`,
      border: `1.5px solid ${color}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.38), fontWeight: 800, color,
    }}>
      {authorInitial(post)}
    </div>
  );
}

// ── CommentsSection ───────────────────────────────────────────────────────────

function CommentsSection({ postId, initialCount, open, onCountChange }) {
  const { user } = useAuth();
  const [loaded,   setLoaded]   = useState(false);
  const [comments, setComments] = useState([]);
  const [count,    setCount]    = useState(initialCount || 0);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/forum/posts/${postId}/comments`);
      setComments(res.data.comments || []);
      const n = res.data.total || 0;
      setCount(n);
      onCountChange?.(n);
    } catch {
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [postId, onCountChange]);

  useEffect(() => {
    if (open && !loaded) { load(); setLoaded(true); }
  }, [open, loaded, load]);

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/api/forum/posts/${postId}/comments`, { text: text.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      const n = res.data.commentsCount;
      setCount(n);
      onCountChange?.(n);
      setText("");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/api/forum/comments/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
      const n = Math.max(0, count - 1);
      setCount(n);
      onCountChange?.(n);
    } catch {
      setError("Failed to delete comment.");
    }
  };

  if (!open) return null;

  const userColor   = avatarColor(user?._id || "guest");
  const userInitial = (user?.displayName || user?.username || "?")[0].toUpperCase();

  return (
    <div className="forum-comments-section">
      {/* Header */}
      <p style={{ margin: "0 0 0.7rem", fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        💬 <span>{count} {count === 1 ? "Comment" : "Comments"}</span>
      </p>

      {error && <p style={{ color: "#f87171", fontSize: 12, marginBottom: "0.6rem" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "0.75rem 0" }}>Loading…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "#334155", fontSize: 12, textAlign: "center", padding: "0.5rem 0 0.75rem" }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.85rem" }}>
          {comments.map((c) => {
            const col = avatarColor(c.author?._id);
            const ini = (c.author?.displayName || "?")[0].toUpperCase();
            return (
              <div key={c._id} className="forum-comment-item">
                <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `${col}22`, border: `1.5px solid ${col}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: col }}>
                  {ini}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", marginBottom: "0.18rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{c.author?.displayName || "Anonymous"}</span>
                    <span style={{ fontSize: 11, color: "#334155", fontFamily: "var(--font-ui)" }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.55 }}>{c.text}</p>
                </div>
                {c._isOwn && (
                  <button type="button" onClick={() => deleteComment(c._id)}
                    style={{ position: "absolute", top: "0.45rem", right: "0.55rem", background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: 12, padding: "0.1rem 0.3rem", borderRadius: 5, lineHeight: 1, transition: "color 0.15s, background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; e.currentTarget.style.background = "none"; }}>
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {user ? (
        <div className="forum-comment-compose">
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `${userColor}22`, border: `1.5px solid ${userColor}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: userColor }}>
            {userInitial}
          </div>
          <textarea className="forum-comment-input" rows={2} placeholder="Write a comment…" maxLength={500}
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            style={{ flex: 1 }} />
          <button type="button" className="forum-comment-submit" onClick={submit} disabled={posting || !text.trim()}>
            {posting ? "…" : "Post"}
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "#334155", textAlign: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          Log in to comment.
        </p>
      )}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, onDelete, highlighted, onUnsave }) {
  const col = TC[post.type] || TC.text;
  const [liked,        setLiked]        = useState(post.isLiked || false);
  const [saved,        setSaved]        = useState(post.isSaved || false);
  const [likeCount,    setLikeCount]    = useState(post.likesCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const [commentOpen,  setCommentOpen]  = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [shareMsg,     setShareMsg]     = useState("");
  const [mediaError,   setMediaError]   = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/api/forum/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likesCount);
    } catch { /* keep UI */ }
    setBusy(false);
  };

  const toggleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/api/forum/posts/${post._id}/save`);
      setSaved(res.data.saved);
      if (!res.data.saved) onUnsave?.(post._id);
    } catch { /* keep UI */ }
    setBusy(false);
  };

  const handleShare = async () => {
    try {
      await api.post(`/api/forum/posts/${post._id}/share`);
    } catch { /* non-critical */ }
    const link = `${window.location.origin}/teacher/forum?post=${post._id}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setShareMsg("Link copied!");
    setTimeout(() => setShareMsg(""), 2200);
  };

  return (
    <article ref={cardRef} className={`forum-card${highlighted ? " highlighted" : ""}`}
      style={{ borderLeft: `3px solid ${col.border}` }}>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.85rem" }}>
        <Avatar post={post} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.2 }}>
            {post._isOwn ? "You" : (post.author?.displayName || "Anonymous")}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>{timeAgo(post.createdAt)}</p>
        </div>
        <TypeBadge type={post.type} />
        {post._isOwn && onDelete && (
          <button type="button" onClick={() => onDelete(post._id)} title="Delete post"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: 14, padding: "0.2rem 0.35rem", borderRadius: 6, lineHeight: 1, transition: "color .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; }}>
            ✕
          </button>
        )}
      </div>

      {/* Title + description */}
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.02rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4, fontFamily: "var(--font-heading)" }}>
        {post.title}
      </h3>
      {post.description && (
        <p style={{ margin: "0 0 0.85rem", fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }}>
          {post.description.length > 260 ? post.description.slice(0, 260) + "…" : post.description}
        </p>
      )}

      {/* Media */}
      {post.type === "image" && post.mediaUrl && !mediaError && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${col.border}`, marginBottom: "0.85rem", boxShadow: `0 0 24px ${col.glow}` }}>
          <img
            src={resolveMediaUrl(post.mediaUrl)}
            alt={post.title}
            style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }}
            onError={() => setMediaError(true)}
          />
        </div>
      )}
      {post.type === "image" && post.mediaUrl && mediaError && (
        <div style={{ borderRadius: 12, border: `1px solid rgba(239,68,68,0.25)`, background: "rgba(239,68,68,0.06)", padding: "1.25rem", textAlign: "center", marginBottom: "0.85rem", color: "#f87171", fontSize: 12 }}>
          🖼️ Image could not be loaded
          {import.meta.env.DEV && <div style={{ marginTop: "0.3rem", fontSize: 10, color: "#475569", wordBreak: "break-all" }}>{resolveMediaUrl(post.mediaUrl)}</div>}
        </div>
      )}
      {post.type === "video" && post.mediaUrl && !mediaError && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${col.border}`, marginBottom: "0.85rem" }}>
          <video
            src={resolveMediaUrl(post.mediaUrl)}
            controls
            preload="metadata"
            style={{ width: "100%", maxHeight: 260, display: "block", background: "#000" }}
            onError={() => setMediaError(true)}
          />
        </div>
      )}
      {post.type === "video" && post.mediaUrl && mediaError && (
        <div style={{ borderRadius: 12, border: `1px solid rgba(239,68,68,0.25)`, background: "rgba(239,68,68,0.06)", padding: "1.25rem", textAlign: "center", marginBottom: "0.85rem", color: "#f87171", fontSize: 12 }}>
          🎬 Video could not be loaded
          {import.meta.env.DEV && <div style={{ marginTop: "0.3rem", fontSize: 10, color: "#475569", wordBreak: "break-all" }}>{resolveMediaUrl(post.mediaUrl)}</div>}
        </div>
      )}
      {post.type === "audio" && post.mediaUrl && !mediaError && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.28)", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🎵</span>
          <audio
            src={resolveMediaUrl(post.mediaUrl)}
            controls
            preload="metadata"
            style={{ flex: 1, minWidth: 0 }}
            onError={() => setMediaError(true)}
          />
        </div>
      )}
      {post.type === "audio" && post.mediaUrl && mediaError && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🎵</span>
          <div>
            <p style={{ margin: "0 0 0.1rem", fontSize: 12, color: "#f87171" }}>Audio could not be loaded</p>
            {import.meta.env.DEV && <p style={{ margin: 0, fontSize: 10, color: "#475569", wordBreak: "break-all" }}>{resolveMediaUrl(post.mediaUrl)}</p>}
          </div>
        </div>
      )}
      {post.type === "game" && post.game && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "0.85rem",
          background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.1))",
          border: "1px solid rgba(124,58,237,0.38)", borderRadius: 14,
          padding: "0.85rem 1.1rem", boxShadow: "0 0 20px rgba(124,58,237,0.1)",
        }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: "rgba(124,58,237,0.38)", border: "1.5px solid rgba(124,58,237,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 14px rgba(124,58,237,0.4)" }}>🎮</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 0.12rem", fontWeight: 700, fontSize: 14, color: "#c4b5fd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.game.title}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#7c3aed", textTransform: "capitalize" }}>{post.game.template?.replace(/-/g, " ")}</p>
          </div>
          <span style={{ fontSize: 12, padding: "0.28rem 0.75rem", borderRadius: 20, background: "rgba(124,58,237,0.3)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.55)", fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-ui)" }}>
            ▶ Play
          </span>
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {post.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "0.15rem 0.55rem", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#475569", fontFamily: "var(--font-ui)" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="forum-action-bar">
        <button type="button" className={`forum-action${liked ? " liked" : ""}`} onClick={toggleLike} disabled={busy} title={liked ? "Unlike" : "Like"}>
          <span style={{ fontSize: 14, transition: "transform .15s", display: "inline-block", transform: liked ? "scale(1.2)" : "scale(1)" }}>
            {liked ? "❤" : "🤍"}
          </span>
          <span>{likeCount > 0 ? likeCount : "Like"}</span>
        </button>

        <button type="button"
          className={`forum-action${commentOpen ? " comment-open" : ""}`}
          onClick={() => setCommentOpen((o) => !o)}>
          💬 <span>{commentCount > 0 ? commentCount : ""} {commentOpen ? "Hide" : "Comment"}</span>
        </button>

        <button type="button" className={`forum-action${saved ? " saved" : ""}`} onClick={toggleSave} disabled={busy} title={saved ? "Unsave" : "Save"}>
          🔖 <span>{saved ? "Saved" : "Save"}</span>
        </button>

        <button type="button" className="forum-action" onClick={handleShare} style={{ marginLeft: "auto" }} title="Copy share link">
          📤 <span>{shareMsg || "Share"}</span>
        </button>
      </div>

      {/* ── Comments section ── */}
      <CommentsSection
        postId={post._id}
        initialCount={post.commentsCount || 0}
        open={commentOpen}
        onCountChange={setCommentCount}
      />
    </article>
  );
}

// ── ForumSidebar ──────────────────────────────────────────────────────────────

const RANK_COLORS = ["#fcd34d", "#94a3b8", "#c4b5fd", "#6ee7b7", "#67e8f9"];

function ForumSidebar({ posts, filter, setFilter, suggestedTeachers, onFollowToggle, followBusy, onHighlight, currentUserId, followingTeachers }) {
  const trending = getTrendingPosts(posts, 5);

  // Use API-provided teachers when available; fallback to deriving from posts
  const activeTeachers = suggestedTeachers.length > 0
    ? suggestedTeachers
    : getActiveTeachers(posts, 5);

  const tagCounts = [
    { value: "all", label: "All Posts", icon: "📋", count: posts.length },
    ...POST_TYPES.map((pt) => ({ ...pt, count: posts.filter((p) => p.type === pt.value).length })),
  ];

  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "88px" }}>

      {/* ── Trending ── */}
      <div className="forum-sidebar-card">
        <h3 className="forum-sidebar-h">🔥 Trending</h3>
        {trending.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.1rem 0" }}>
            <span style={{ fontSize: 26 }}>📊</span>
            <p style={{ color: "#334155", fontSize: 12, margin: "0.35rem 0 0" }}>No trending posts yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            {trending.map((p, i) => {
              const rankColor = RANK_COLORS[i] || "#334155";
              const col  = TC[p.type] || TC.text;
              const meta = POST_TYPES.find((t) => t.value === p.type);
              return (
                <div key={p._id} className="forum-trending-item" onClick={() => onHighlight(p._id)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onHighlight(p._id)}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: rankColor, flexShrink: 0, width: 20, paddingTop: 3, fontFamily: "var(--font-ui)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: "0 0 0.2rem", fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.title}
                    </p>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.15rem" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, padding: "0.08rem 0.4rem", borderRadius: 20, background: col.bg, color: col.text, border: `1px solid ${col.border}`, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                        {meta?.icon} {meta?.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#475569" }}>❤ {p.likesCount || 0}</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>💬 {p.commentsCount || 0}</span>
                      {(p.viewsCount || 0) > 0 && <span style={{ fontSize: 11, color: "#475569" }}>👁 {p.viewsCount}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 10.5, color: "#334155" }}>by {p.author?.displayName || "Teacher"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Browse by Type ── */}
      <div className="forum-sidebar-card">
        <h3 className="forum-sidebar-h">🏷️ Browse by Type</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {tagCounts.map((tc) => {
            const isActive = filter === tc.value;
            const col = TC[tc.value] || { bg: "rgba(124,58,237,0.22)", border: "rgba(124,58,237,0.5)", text: "#c4b5fd" };
            return (
              <button key={tc.value} type="button"
                className={`forum-tag-btn${isActive ? " active" : ""}`}
                onClick={() => setFilter(tc.value)}
                style={{ background: isActive ? col.bg : "rgba(255,255,255,0.03)", borderColor: isActive ? col.border : "rgba(255,255,255,0.08)", color: isActive ? col.text : "#94a3b8" }}>
                <span style={{ fontSize: 15 }}>{tc.icon}</span>
                <span style={{ flex: 1 }}>{tc.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: 20, background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)", color: isActive ? col.text : "#475569" }}>
                  {tc.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Teachers ── */}
      <div className="forum-sidebar-card">
        <h3 className="forum-sidebar-h">🟢 Active Teachers</h3>
        {activeTeachers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.1rem 0" }}>
            <span style={{ fontSize: 26 }}>👩‍🏫</span>
            <p style={{ color: "#334155", fontSize: 12, margin: "0.35rem 0 0" }}>No active teachers yet.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {activeTeachers.slice(0, 5).map((teacher) => {
                const color   = avatarColor(teacher._id?.toString());
                const isSelf  = currentUserId && teacher._id?.toString() === currentUserId?.toString();
                const isBusy  = followBusy.has(teacher._id?.toString());
                const actLabel = lastActiveLabel(teacher.lastPostAt);
                const isOnline = actLabel === "Active now" || actLabel === "Active today";
                return (
                  <div key={teacher._id} className="forum-teacher-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>

                      {/* Avatar + online dot */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color }}>
                          {teacher.initial}
                        </div>
                        {isOnline && <span className="forum-online-dot" />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 0.18rem", fontSize: 13.5, fontWeight: 800, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {teacher.displayName}
                        </p>
                        <div style={{ display: "flex", gap: "0.45rem", fontSize: 11, color: "#475569", flexWrap: "wrap" }}>
                          <span>📝 {teacher.posts}</span>
                          {(teacher.followersCount || 0) > 0 && (
                            <span>👥 {teacher.followersCount}</span>
                          )}
                          {actLabel && (
                            <span style={{ color: isOnline ? "#10b981" : "#475569" }}>{actLabel}</span>
                          )}
                        </div>
                      </div>

                      {/* Follow button — hide for self */}
                      {!isSelf && (
                        <button type="button"
                          className={`forum-follow-btn${teacher.isFollowing ? " following" : ""}`}
                          onClick={() => onFollowToggle(teacher._id)}
                          disabled={isBusy}
                          style={{ opacity: isBusy ? 0.65 : 1, flexShrink: 0 }}>
                          {isBusy ? "…" : teacher.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {activeTeachers.length > 5 && (
              <p style={{ margin: "0.55rem 0 0", fontSize: 11.5, textAlign: "center", color: "#475569", letterSpacing: "0.02em" }}>
                + {activeTeachers.length - 5} more teachers active this month
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Following ── */}
      {followingTeachers && followingTeachers.length > 0 && (
        <div className="forum-sidebar-card">
          <h3 className="forum-sidebar-h">👥 Following ({followingTeachers.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {followingTeachers.slice(0, 8).map((teacher) => {
              const color  = avatarColor(teacher._id?.toString());
              const isBusy = followBusy.has(teacher._id?.toString());
              return (
                <div key={teacher._id} className="forum-following-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>
                      {teacher.initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 0.1rem", fontSize: 12.5, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {teacher.displayName}
                      </p>
                      <p style={{ margin: 0, fontSize: 10.5, color: "#475569" }}>
                        📝 {teacher.posts} · 👥 {teacher.followersCount}
                      </p>
                    </div>
                    <button type="button"
                      className="forum-follow-btn following"
                      onClick={() => onFollowToggle(teacher._id)}
                      disabled={isBusy}
                      style={{ opacity: isBusy ? 0.65 : 1, flexShrink: 0, fontSize: 10 }}>
                      {isBusy ? "…" : "Unfollow"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── CreatePostForm ────────────────────────────────────────────────────────────

function CreatePostForm({ games, onSubmit, onCancel }) {
  const [type,           setType]           = useState("text");
  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [tags,           setTags]           = useState("");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [mediaFile,      setMediaFile]      = useState(null);
  const [mediaPreview,   setMediaPreview]   = useState("");
  const [errors,         setErrors]         = useState({});
  const [submitting,     setSubmitting]     = useState(false);
  const [dragOver,       setDragOver]       = useState(false);
  const fileRef = useRef();

  const isMedia = ["image", "video", "audio"].includes(type);
  const isGame  = type === "game";

  const switchType = (t) => {
    setType(t); setMediaFile(null); setMediaPreview(""); setSelectedGameId(""); setErrors({});
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyFile = (file) => {
    const allowed = ALLOWED_MIMES[type] || [];
    if (allowed.length > 0 && file.type && !allowed.includes(file.type)) {
      setErrors((e) => ({ ...e, media: `Invalid file type. Please upload a valid ${type} file.` }));
      return;
    }
    const maxMB = MEDIA_MAX_MB[type] ?? 20;
    if (file.size > maxMB * 1024 * 1024) {
      setErrors((e) => ({ ...e, media: `File too large — max ${maxMB} MB for ${type}.` }));
      return;
    }
    setErrors((e) => ({ ...e, media: undefined }));
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) applyFile(file);
  };

  const validate = () => {
    const e = {};
    if (!title.trim())                         e.title = "Title is required.";
    if (type === "text" && !description.trim()) e.desc = "Content is required for text posts.";
    if (isGame && !selectedGameId)              e.game = "Please select a game.";
    if (isMedia && !mediaFile)                  e.media = `Please upload a ${type} file.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append("type",        type);
      fd.append("title",       title.trim());
      fd.append("description", description.trim());
      fd.append("tags",        JSON.stringify(
        tags.split(",").map((t) => t.trim()).filter(Boolean)
      ));
      if (isGame)             fd.append("gameId", selectedGameId);
      if (isMedia && mediaFile) fd.append("media", mediaFile);

      const res = await api.post("/api/forum/posts", fd);
      await onSubmit(res.data.post);
    } catch (err) {
      setErrors({ submit: err?.response?.data?.error || "Failed to publish post." });
      setSubmitting(false);
    }
  };

  const typeMeta = POST_TYPES.find((pt) => pt.value === type);

  return (
    <section className="glass-card forum-create-wrap">

      {/* ── Header ── */}
      <div className="forum-create-header">
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="forum-create-header-title">✦ Create Post</h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Share something with the teaching community</p>
        </div>
        <button type="button" onClick={onCancel} className="forum-btn-outline" style={{ position: "relative", zIndex: 1 }}>
          ← Back
        </button>
      </div>

      {/* ── 2-column body ── */}
      <form onSubmit={handleSubmit} className="forum-create-body">

        {/* ── LEFT: type picker + upload / game ── */}
        <div className="forum-create-left">

          {/* Type picker */}
          <div>
            <p className="forum-section-label" style={{ marginBottom: "0.65rem" }}>What are you sharing?</p>
            <div className="forum-type-grid">
              {POST_TYPES.map((pt) => {
                const isActive = type === pt.value;
                const col = TC[pt.value];
                return (
                  <button
                    key={pt.value}
                    type="button"
                    className={`forum-type-card${isActive ? " active" : ""}`}
                    onClick={() => switchType(pt.value)}
                    style={isActive ? {
                      "--tc-bg":     col.bg,
                      "--tc-border": col.border,
                      "--tc-text":   col.text,
                      "--tc-glow":   col.glow,
                    } : {}}
                  >
                    <span className="forum-type-icon">{pt.icon}</span>
                    <span className="forum-type-label">{pt.label}</span>
                  </button>
                );
              })}
            </div>
            {typeMeta && (
              <p className="forum-type-desc" style={{ marginTop: "0.55rem" }}>
                💡 {typeMeta.desc}
              </p>
            )}
          </div>

          {/* Media upload */}
          {isMedia && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.55rem" }}>

              {/* Section label */}
              <p className="forum-section-label">
                Upload {type.charAt(0).toUpperCase() + type.slice(1)}{" "}
                <span style={{ color: "#f87171" }}>*</span>
                <span style={{ color: "#475569", fontWeight: 400, textTransform: "none", fontSize: 11, letterSpacing: 0 }}>
                  {" "}· max {MEDIA_MAX_MB[type]} MB
                </span>
              </p>

              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept={MEDIA_ACCEPT[type]}
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files[0]; if (f) applyFile(f); e.target.value = ""; }}
              />

              {/* ── STATE A: no file → dropzone ── */}
              {!mediaFile && (
                <div
                  className={`forum-upload-zone-lg${dragOver ? " dragover" : ""}${errors.media ? " err" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                >
                  <span style={{ fontSize: 34, lineHeight: 1, display: "block", marginBottom: "0.5rem" }}>
                    {type === "image" ? "🖼️" : type === "video" ? "🎬" : "🎵"}
                  </span>
                  <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
                    Drop your {type} here, or{" "}
                    <span style={{ color: "#c4b5fd", textDecoration: "underline" }}>browse files</span>
                  </p>
                  <p style={{ margin: 0, color: "#475569", fontSize: 11 }}>{MEDIA_HINT[type]}</p>
                </div>
              )}

              {/* ── STATE B: file selected → preview card ── */}

              {/* VIDEO preview */}
              {mediaFile && type === "video" && (
                <div className="forum-media-preview-card">
                  {/* Remove button */}
                  <button
                    type="button"
                    className="forum-media-remove-btn"
                    onClick={() => { setMediaFile(null); setMediaPreview(""); }}
                    title="Remove file"
                  >✕</button>

                  {/* 16:9 video player */}
                  <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#000", overflow: "hidden" }}>
                    {mediaPreview ? (
                      <video
                        src={mediaPreview}
                        controls
                        preload="metadata"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 40 }}>🎬</span>
                      </div>
                    )}
                  </div>

                  {/* Info bar — click to replace */}
                  <div className="forum-media-info-bar" onClick={() => fileRef.current?.click()}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: "rgba(239,68,68,0.18)", border: "1.5px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      🎬
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 0.1rem", fontSize: 12.5, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mediaFile.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                        {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                        <span style={{ margin: "0 0.35rem", color: "#1e293b" }}>·</span>
                        <span style={{ color: "#c4b5fd", fontWeight: 600 }}>↻ Click to replace</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGE preview */}
              {mediaFile && type === "image" && (
                <div className="forum-media-preview-card image">
                  <button
                    type="button"
                    className="forum-media-remove-btn"
                    onClick={() => { setMediaFile(null); setMediaPreview(""); }}
                    title="Remove file"
                  >✕</button>

                  {mediaPreview && (
                    <img
                      src={mediaPreview}
                      alt="preview"
                      style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                    />
                  )}

                  <div className="forum-media-info-bar" onClick={() => fileRef.current?.click()}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: "rgba(6,182,212,0.15)", border: "1.5px solid rgba(6,182,212,0.38)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      🖼️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 0.1rem", fontSize: 12.5, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mediaFile.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                        {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                        <span style={{ margin: "0 0.35rem", color: "#1e293b" }}>·</span>
                        <span style={{ color: "#c4b5fd", fontWeight: 600 }}>↻ Click to replace</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIO preview */}
              {mediaFile && type === "audio" && (
                <div className="forum-media-preview-card audio">
                  <button
                    type="button"
                    className="forum-media-remove-btn"
                    onClick={() => { setMediaFile(null); setMediaPreview(""); }}
                    title="Remove file"
                  >✕</button>

                  <div style={{ padding: "1rem 1rem 0.85rem", background: "rgba(245,158,11,0.05)" }}>
                    {/* File identity row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: "rgba(245,158,11,0.16)", border: "1.5px solid rgba(245,158,11,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        🎵
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 0.1rem", fontSize: 13, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {mediaFile.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                          {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                          <span style={{ margin: "0 0.35rem", color: "#1e293b" }}>·</span>
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#c4b5fd", fontSize: 11, fontWeight: 600, padding: 0 }}
                          >↻ Replace</button>
                        </p>
                      </div>
                    </div>
                    {/* Player */}
                    {mediaPreview && (
                      <audio
                        src={mediaPreview}
                        controls
                        preload="metadata"
                        style={{ width: "100%", display: "block" }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Error message */}
              {errors.media && <p className="forum-field-error">⚠ {errors.media}</p>}
            </div>
          )}

          {/* Game selector */}
          {isGame && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p className="forum-section-label">
                Select Game <span style={{ color: "#f87171" }}>*</span>
              </p>
              {games.length === 0 ? (
                <div style={{ background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 12, padding: "1rem", display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>⚠</span>
                  <div>
                    <p style={{ margin: "0 0 0.2rem", color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>No published games found</p>
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Go to <strong style={{ color: "#f59e0b" }}>My Content</strong> to create and publish a game first.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 300, overflowY: "auto", paddingRight: "0.15rem" }}>
                  {games.map((g) => {
                    const isSel = selectedGameId === g._id;
                    return (
                      <label key={g._id} style={{
                        display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer",
                        padding: "0.6rem 0.85rem", borderRadius: 10, transition: "all .15s",
                        background: isSel ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${isSel ? "rgba(124,58,237,0.65)" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isSel ? "0 0 0 2px rgba(124,58,237,0.2)" : "none",
                      }}>
                        <input type="radio" name="forum-game" value={g._id}
                          checked={isSel}
                          onChange={() => { setSelectedGameId(g._id); setErrors((p) => ({ ...p, game: undefined })); }}
                          style={{ accentColor: "#7c3aed", flexShrink: 0 }}
                        />
                        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎮</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 0.05rem", color: "#e2e8f0", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</p>
                          <p style={{ margin: 0, color: "#64748b", fontSize: 11, textTransform: "capitalize" }}>{g.template?.replace(/-/g, " ")}</p>
                        </div>
                        {isSel && <span style={{ color: "#c4b5fd", fontSize: 14, flexShrink: 0 }}>✓</span>}
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.game && <p className="forum-field-error">⚠ {errors.game}</p>}
            </div>
          )}

          {/* Placeholder for text/no-media types to keep left panel filled */}
          {!isMedia && !isGame && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, border: "1.5px dashed rgba(255,255,255,0.08)", color: "#1e1b4b", fontSize: 36 }}>
              ✍️
            </div>
          )}
        </div>

        {/* ── RIGHT: text fields + footer ── */}
        <div className="forum-create-right">

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="forum-field-label">
              Title <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              className={`forum-input-field${errors.title ? " err" : ""}`}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              placeholder="Give your post a clear, descriptive title"
              maxLength={120}
            />
            {errors.title && <p className="forum-field-error">⚠ {errors.title}</p>}
          </div>

          {/* Description / Content */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
              <label className="forum-field-label" style={{ marginBottom: 0 }}>
                {type === "text"
                  ? <><span>Content</span> <span style={{ color: "#f87171" }}>*</span></>
                  : <><span>Description</span> <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></>}
              </label>
              <span style={{ fontSize: 11, color: description.length > DESC_LIMIT * 0.9 ? "#f59e0b" : "#334155", fontFamily: "var(--font-ui)" }}>
                {description.length}/{DESC_LIMIT}
              </span>
            </div>
            <textarea
              className={`forum-textarea-field${errors.desc ? " err" : ""}`}
              value={description}
              onChange={(e) => { if (e.target.value.length <= DESC_LIMIT) { setDescription(e.target.value); setErrors((p) => ({ ...p, desc: undefined })); } }}
              placeholder={type === "text" ? "Share your tips, experiences, or ideas in detail…" : "Briefly describe what you're sharing…"}
              rows={type === "text" ? 10 : 6}
              style={{ flex: 1, minHeight: type === "text" ? 220 : 130 }}
            />
            {errors.desc && <p className="forum-field-error">⚠ {errors.desc}</p>}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="forum-field-label">
              Tags{" "}
              <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated, optional)</span>
            </label>
            <input
              className="forum-input-field"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. phonics, vocabulary, kindergarten"
              maxLength={200}
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.35)", borderRadius: 9, padding: "0.65rem 1rem", color: "#f87171", fontSize: 13 }}>
              {errors.submit}
            </div>
          )}

          {/* Footer buttons */}
          <div className="forum-create-footer">
            <button type="button" className="forum-btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="forum-btn-publish"
              disabled={submitting || (isGame && games.length === 0)}
            >
              {submitting ? "Publishing…" : "🚀 Publish Post"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

// ── TeacherForum ──────────────────────────────────────────────────────────────

const TeacherForum = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [view,         setView]         = useState("list");
  const [posts,        setPosts]        = useState([]);
  const [games,        setGames]        = useState([]);
  const [filter,       setFilter]       = useState("all");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [highlighted,  setHighlighted]  = useState(null);
  const [suggested,    setSuggested]    = useState([]);
  const [followBusy,   setFollowBusy]   = useState(new Set());
  const [savedPosts,   setSavedPosts]   = useState([]);
  const [savedPage,    setSavedPage]    = useState(1);
  const [savedHasMore, setSavedHasMore] = useState(false);
  const [savedLoading,      setSavedLoading]      = useState(false);
  const [notifications,     setNotifications]     = useState([]);
  const [unreadCount,       setUnreadCount]       = useState(0);
  const [notifOpen,         setNotifOpen]         = useState(false);
  const [notifLoading,      setNotifLoading]      = useState(false);
  const [followingTeachers, setFollowingTeachers] = useState([]);
  const [isWide,            setIsWide]            = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);

  useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Load posts from API
  const loadPosts = useCallback(async (currentPage, currentFilter, replace = false) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (currentFilter !== "all") params.set("type", currentFilter);
      const res = await api.get(`/api/forum/posts?${params}`);
      const { posts: newPosts, pages } = res.data;
      setPosts((prev) => replace ? newPosts : [...prev, ...newPosts]);
      setHasMore(currentPage < pages);
    } catch {
      setError("Failed to load forum posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load suggested teachers
  const loadSuggested = useCallback(async () => {
    try {
      const res = await api.get("/api/forum/suggested-teachers");
      setSuggested(res.data.teachers || []);
    } catch { /* non-critical */ }
  }, []);

  // Load games for create form
  const loadGames = useCallback(async () => {
    try {
      const res = await api.get("/api/teacher/contents");
      const all = res.data.contents || [];
      setGames(all.filter((c) => c.isPublished));
    } catch { /* non-critical */ }
  }, []);

  // Load saved posts  (GET /api/forum/saved)
  const loadSavedPosts = useCallback(async (p = 1, replace = false) => {
    setSavedLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      const res = await api.get(`/api/forum/saved?${params}`);
      const { posts: newPosts, pages } = res.data;
      setSavedPosts((prev) => replace ? newPosts : [...prev, ...newPosts]);
      setSavedHasMore(p < (pages || 1));
    } catch { /* non-critical */ }
    finally { setSavedLoading(false); }
  }, []);

  // Load notifications
  const loadNotifs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get("/api/forum/notifications?limit=20");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    } catch { /* non-critical */ }
    finally { setNotifLoading(false); }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/api/forum/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* non-critical */ }
  }, []);

  const markOneRead = useCallback(async (id) => {
    try {
      await api.patch(`/api/forum/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* non-critical */ }
  }, []);

  // Load following teachers list
  const loadFollowing = useCallback(async () => {
    try {
      const res = await api.get("/api/forum/following");
      setFollowingTeachers(res.data.teachers || []);
    } catch { /* non-critical */ }
  }, []);

  // Handle ?post=<id> deep-link
  useEffect(() => {
    const postId = new URLSearchParams(window.location.search).get("post");
    if (!postId) return;
    setHighlighted(postId);
    // Load that specific post and prepend if missing
    api.get(`/api/forum/posts/${postId}`)
      .then((res) => {
        setPosts((prev) => {
          if (prev.some((p) => p._id === postId)) return prev;
          return [res.data.post, ...prev];
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (filter === "saved") {
      setSavedPage(1);
      loadSavedPosts(1, true);
    } else {
      loadPosts(1, filter, true);
      setPage(1);
    }
  }, [filter, loadPosts, loadSavedPosts]);

  useEffect(() => {
    loadSuggested();
    loadGames();
    loadFollowing();
    if (user) loadNotifs();
  }, [loadSuggested, loadGames, loadFollowing, loadNotifs, user]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPosts(next, filter, false);
  };

  const handleSubmit = async (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setView("list");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api.delete(`/api/forum/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError("Failed to delete post.");
    }
  };

  const handleFollowToggle = async (teacherId) => {
    const idStr = teacherId?.toString();
    setFollowBusy((prev) => new Set([...prev, idStr]));
    try {
      const res = await api.post(`/api/forum/teachers/${teacherId}/follow`);
      const isNowFollowing = res.data.following;
      setSuggested((prev) =>
        prev.map((t) => t._id?.toString() === idStr
          ? { ...t, isFollowing: isNowFollowing, followersCount: (t.followersCount || 0) + (isNowFollowing ? 1 : -1) }
          : t
        )
      );
      if (!isNowFollowing) {
        setFollowingTeachers((prev) => prev.filter((t) => t._id?.toString() !== idStr));
      } else {
        loadFollowing();
      }
    } catch { /* non-critical */ }
    finally {
      setFollowBusy((prev) => { const s = new Set(prev); s.delete(idStr); return s; });
    }
  };

  const handleUnsaveFromSaved = (postId) => {
    setSavedPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleLoadMoreSaved = () => {
    const next = savedPage + 1;
    setSavedPage(next);
    loadSavedPosts(next, false);
  };

  const handleHighlight = (postId) => {
    setHighlighted(postId);
    window.history.replaceState(null, "", `${window.location.pathname}?post=${postId}`);
    // PostCard's useEffect scrolls into view when highlighted matches its _id
    // If post isn't in current page, fetch and prepend it
    if (!posts.some((p) => p._id === postId)) {
      api.get(`/api/forum/posts/${postId}`)
        .then((res) => setPosts((prev) => [res.data.post, ...prev]))
        .catch(() => {});
    }
  };

  const filteredPosts = filter === "all" ? posts : filter === "saved" ? savedPosts : posts.filter((p) => p.type === filter);
  const uniqueAuthors = new Set(posts.map((p) => p.author?._id)).size;

  if (view === "create") return (
    <div className="screen with-bg role-page">
      <StarBackground /><Navbar />
      <main className="role-wrap">
        <CreatePostForm games={games} onSubmit={handleSubmit} onCancel={() => setView("list")} />
      </main>
    </div>
  );

  return (
    <div className="screen with-bg role-page">
      <StarBackground /><Navbar />
      <main className="role-wrap" style={{ maxWidth: isWide ? 1200 : undefined }}>

        {/* Hero */}
        <section className="role-hero glass-card" style={{ textAlign: "left", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(124,58,237,0.14) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", position: "relative" }}>
            <div>
              <h1 style={{ margin: "0 0 0.35rem" }}>{t("teacher.forum.title")}</h1>
              <p style={{ color: "#a78bca" }}>{t("teacher.forum.subtitle")}</p>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
                {[
                  { icon: "📝", value: posts.length, label: "posts", color: "#c4b5fd" },
                  { icon: "👩‍🏫", value: uniqueAuthors, label: "teachers sharing", color: "#6ee7b7" },
                  { icon: "❤", value: posts.reduce((s, p) => s + (p.likesCount || 0), 0), label: "total likes", color: "#f9a8d4" },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: 16 }}>{stat.icon}</span>
                    <span style={{ fontSize: 13, color: stat.color, fontWeight: 700, fontFamily: "var(--font-ui)" }}>
                      {stat.value} {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexShrink: 0 }}>
              {user && (
                <button
                  type="button"
                  className={`forum-bell-btn${notifOpen ? " active" : ""}`}
                  title="Notifications"
                  onClick={() => {
                    const opening = !notifOpen;
                    setNotifOpen(opening);
                    if (opening) loadNotifs();
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="forum-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>
              )}
              <button className="btn-register" onClick={() => setView("create")} style={{ alignSelf: "center" }}>
                + {t("teacher.forum.createPost")}
              </button>
            </div>
          </div>
        </section>

        {/* Notification panel */}
        {notifOpen && (
          <div className="forum-notif-panel" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>
                🔔 Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft: "0.4rem", background: "rgba(244,63,94,0.2)", color: "#f87171", fontSize: 10, fontWeight: 800, padding: "0.1rem 0.45rem", borderRadius: 20, border: "1px solid rgba(244,63,94,0.35)" }}>
                    {unreadCount} new
                  </span>
                )}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.45)", borderRadius: 8, padding: "0.28rem 0.65rem", color: "#c4b5fd", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.28rem 0.6rem", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            </div>
            {notifLoading ? (
              <p style={{ color: "#475569", textAlign: "center", fontSize: 13, margin: "1rem 0" }}>Loading…</p>
            ) : notifications.length === 0 ? (
              <p style={{ color: "#475569", textAlign: "center", fontSize: 13, margin: "1rem 0" }}>No notifications yet. Follow teachers to get updates!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {notifications.map((n) => {
                  const typeIcon = n.type === "new_post" ? "📝" : n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : "👤";
                  const msg = n.type === "new_post" ? `posted a new ${n.post?.type || "post"}`
                            : n.type === "like"     ? "liked your post"
                            : n.type === "comment"  ? "commented on your post"
                            : "followed you";
                  const elapsed = (() => {
                    const s = Math.floor((Date.now() - new Date(n.createdAt)) / 1000);
                    if (s < 60)   return `${s}s ago`;
                    if (s < 3600) return `${Math.floor(s/60)}m ago`;
                    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
                    return `${Math.floor(s/86400)}d ago`;
                  })();
                  return (
                    <div
                      key={n._id}
                      className="forum-notif-item"
                      style={{
                        background: n.isRead ? "rgba(255,255,255,0.025)" : "rgba(124,58,237,0.1)",
                        border: `1px solid ${n.isRead ? "rgba(255,255,255,0.06)" : "rgba(124,58,237,0.28)"}`,
                      }}
                      onClick={() => {
                        markOneRead(n._id);
                        if (n.post?._id) setHighlighted(n.post._id);
                        setNotifOpen(false);
                      }}
                    >
                      {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#c4b5fd", flexShrink: 0, marginTop: 5 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 0.1rem", fontSize: 13, color: "#e2e8f0" }}>
                          <strong style={{ color: "#c4b5fd" }}>{n.actor?.displayName || "A teacher"}</strong>{" "}{msg}
                        </p>
                        {n.post && (
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {typeIcon} {n.post.title}
                          </p>
                        )}
                        <p style={{ margin: "0.1rem 0 0", fontSize: 10, color: "#334155" }}>{elapsed}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error ? <p className="error-msg">{error}</p> : null}

        {/* 2-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isWide ? "1fr 280px" : "1fr",
          gap: "1.25rem",
          alignItems: "flex-start",
        }}>

          {/* Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Filter bar */}
            <div style={{
              background: "rgba(15,5,40,0.7)", backdropFilter: "blur(18px)",
              border: "1px solid rgba(123,47,247,0.22)", borderRadius: 16,
              padding: "0.75rem 1rem",
              display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600, fontFamily: "var(--font-ui)", marginRight: "0.15rem" }}>
                Filter:
              </span>
              {[{ value: "all", label: "All", icon: "📋" }, ...POST_TYPES].map((pt) => {
                const isActive = filter === pt.value;
                const col = TC[pt.value] || { bg: "rgba(124,58,237,0.25)", border: "rgba(124,58,237,0.65)", text: "#c4b5fd" };
                return (
                  <button key={pt.value} type="button"
                    className="forum-filter-btn"
                    onClick={() => setFilter(pt.value)}
                    style={{
                      background:  isActive ? col.bg     : "transparent",
                      borderColor: isActive ? col.border : "rgba(255,255,255,0.1)",
                      color:       isActive ? col.text   : "#94a3b8",
                    }}>
                    {pt.icon} {pt.label}
                    {isActive && filter !== "saved" && filteredPosts.length > 0 && (
                      <span style={{ marginLeft: "0.3rem", fontSize: 11, opacity: 0.8 }}>({filteredPosts.length})</span>
                    )}
                  </button>
                );
              })}
              {/* Saved tab */}
              <button type="button" className="forum-filter-btn"
                onClick={() => setFilter("saved")}
                style={{
                  background:  filter === "saved" ? "rgba(252,211,77,0.14)" : "transparent",
                  borderColor: filter === "saved" ? "rgba(252,211,77,0.65)" : "rgba(255,255,255,0.1)",
                  color:       filter === "saved" ? "#fcd34d"               : "#94a3b8",
                  marginLeft: "auto",
                }}>
                🔖 {t("teacher.forum.savedPosts")}
                {filter === "saved" && savedPosts.length > 0 && (
                  <span style={{ marginLeft: "0.3rem", fontSize: 11, opacity: 0.8 }}>({savedPosts.length})</span>
                )}
              </button>
            </div>

            {/* ── Saved Posts feed ── */}
            {filter === "saved" ? (
              savedLoading ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <p style={{ color: "#64748b", fontSize: 14 }}>Loading saved posts…</p>
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
                  <div style={{ fontSize: "2.8rem", marginBottom: "0.75rem" }}>🔖</div>
                  <p style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: "0.3rem" }}>
                    {t("teacher.forum.savedEmptyTitle")}
                  </p>
                  <p style={{ color: "#64748b", fontSize: 13, marginBottom: "1.25rem" }}>
                    {t("teacher.forum.savedEmptySubtitle")}
                  </p>
                  <button className="btn-register" onClick={() => setFilter("all")}>
                    Browse posts
                  </button>
                </div>
              ) : (
                <>
                  {savedPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onDelete={handleDelete}
                      highlighted={highlighted === post._id}
                      onUnsave={handleUnsaveFromSaved}
                    />
                  ))}
                  {savedHasMore && (
                    <button type="button" onClick={handleLoadMoreSaved} disabled={savedLoading}
                      style={{
                        width: "100%", padding: "0.75rem", borderRadius: 12, cursor: savedLoading ? "default" : "pointer",
                        background: "rgba(252,211,77,0.1)", border: "1px solid rgba(252,211,77,0.35)",
                        color: "#fcd34d", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-ui)",
                        opacity: savedLoading ? 0.7 : 1,
                      }}>
                      {savedLoading ? "Loading…" : t("teacher.forum.loadMore")}
                    </button>
                  )}
                </>
              )
            ) : (
              /* ── Regular feed ── */
              loading ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <p style={{ color: "#64748b", fontSize: 14 }}>Loading posts…</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📢</div>
                  <p style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: "0.3rem" }}>{t("teacher.forum.noPosts")}</p>
                  <p style={{ color: "#64748b", fontSize: 13, marginBottom: "1.25rem" }}>{t("teacher.forum.noPostsHint")}</p>
                  <button className="btn-register" onClick={() => setView("create")}>
                    Create the first post
                  </button>
                </div>
              ) : (
                <>
                  {filteredPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onDelete={handleDelete}
                      highlighted={highlighted === post._id}
                    />
                  ))}
                  {hasMore && (
                    <button type="button" onClick={handleLoadMore} disabled={loadingMore}
                      style={{
                        width: "100%", padding: "0.75rem", borderRadius: 12, cursor: loadingMore ? "default" : "pointer",
                        background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.35)",
                        color: "#c4b5fd", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-ui)",
                        opacity: loadingMore ? 0.7 : 1,
                      }}>
                      {loadingMore ? "Loading…" : t("teacher.forum.loadMore")}
                    </button>
                  )}
                </>
              )
            )}
          </div>

          {/* Sidebar */}
          <ForumSidebar
            posts={posts}
            filter={filter}
            setFilter={setFilter}
            suggestedTeachers={suggested}
            onFollowToggle={handleFollowToggle}
            followBusy={followBusy}
            onHighlight={handleHighlight}
            currentUserId={user?._id}
            followingTeachers={followingTeachers}
          />
        </div>

      </main>
    </div>
  );
};

export default TeacherForum;
