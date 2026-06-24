import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import useMouseParticles from "./hooks/useMouseParticles";
import useBgMusic from "./hooks/useBgMusic";
import useClickSound from "./hooks/useClickSound";
const bgMusic = "/sounds/background_music.mp3";
const clickSound = "/sounds/ui/pop.mp3";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import GamePage from "./pages/GamePage";
import AiChatPage from "./pages/AiChatPage";
import StoryPlayerPage from "./pages/StoryPlayerPage";
import CompletionPage from "./pages/CompletionPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ShopPage from "./pages/ShopPage";
import MyHomePage from "./pages/MyHomePage";
import RoomPage from "./pages/RoomPage";
import { AdminOnly, ChildOnly, GuestOrChild, ParentOnly, TeacherOnly } from "./components/guards/RoleRoute";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildProgress from "./pages/parent/ChildProgress";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassroomPage from "./pages/teacher/ClassroomPage";
import TeacherContentsPage from "./pages/teacher/TeacherContentsPage";
import TeacherForum from "./pages/teacher/TeacherForum";
import StudentContentsPage from "./pages/student/StudentContentsPage";
import UserProfilePage from "./pages/UserProfilePage";
import ChildProfilePage from "./pages/child/ChildProfilePage";
import CollectionPage from "./pages/CollectionPage";
import ClassroomsPage from "./pages/ClassroomsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminVideosPage from "./pages/admin/AdminVideosPage";
import VideosPage from "./pages/VideosPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import OAuthVerifyPage from "./pages/OAuthVerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import RoadmapPage from "./pages/RoadmapPage";

const App = () => {
  useMouseParticles();
  useClickSound(clickSound);
  const { muted, toggle: toggleMusic } = useBgMusic(bgMusic);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/oauth/verify" element={<OAuthVerifyPage />} />

          <Route
            path="/"
            element={
              <GuestOrChild>
                <HomePage />
              </GuestOrChild>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <GuestOrChild>
                <GamePage />
              </GuestOrChild>
            }
          />
          <Route
            path="/story/:storyId"
            element={
              <GuestOrChild>
                <StoryPlayerPage />
              </GuestOrChild>
            }
          />
          <Route
            path="/completion"
            element={
              <GuestOrChild>
                <CompletionPage />
              </GuestOrChild>
            }
          />
          <Route
            path="/collection"
            element={
              <ChildOnly>
                <CollectionPage />
              </ChildOnly>
            }
          />
          <Route
            path="/shop"
            element={
              <ChildOnly>
                <ShopPage />
              </ChildOnly>
            }
          />
          <Route
            path="/my-home"
            element={
              <ChildOnly>
                <MyHomePage />
              </ChildOnly>
            }
          />
          <Route
            path="/my-classrooms"
            element={
              <ChildOnly>
                <ClassroomsPage />
              </ChildOnly>
            }
          />
          <Route
            path="/my-content"
            element={
              <ChildOnly>
                <StudentContentsPage />
              </ChildOnly>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ChildOnly>
                <RoomPage />
              </ChildOnly>
            }
          />

          <Route
            path="/parent/dashboard"
            element={
              <ParentOnly>
                <ParentDashboard />
              </ParentOnly>
            }
          />
          <Route
            path="/parent/children"
            element={
              <ParentOnly>
                <Navigate to="/parent/dashboard" replace />
              </ParentOnly>
            }
          />
          <Route
            path="/parent/child/:childId"
            element={
              <ParentOnly>
                <ChildProgress />
              </ParentOnly>
            }
          />
          <Route
            path="/parent/profile"
            element={
              <ParentOnly>
                <UserProfilePage apiBase="/parent" roleLabel="Parent" />
              </ParentOnly>
            }
          />

          <Route
            path="/teacher/dashboard"
            element={
              <TeacherOnly>
                <TeacherDashboard />
              </TeacherOnly>
            }
          />
          <Route
            path="/teacher/classroom/:id"
            element={
              <TeacherOnly>
                <ClassroomPage />
              </TeacherOnly>
            }
          />
          <Route
            path="/teacher/contents"
            element={
              <TeacherOnly>
                <TeacherContentsPage />
              </TeacherOnly>
            }
          />
          <Route
            path="/teacher/forum"
            element={
              <TeacherOnly>
                <TeacherForum />
              </TeacherOnly>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <TeacherOnly>
                <UserProfilePage apiBase="/teacher" roleLabel="Teacher" />
              </TeacherOnly>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminOnly>
                <AdminDashboard />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminOnly>
                <AdminUsers />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <AdminOnly>
                <AdminApprovals />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminOnly>
                <AdminProfile />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/videos"
            element={
              <AdminOnly>
                <AdminVideosPage />
              </AdminOnly>
            }
          />

          <Route path="/chat-with-luna" element={<AiChatPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route
            path="/videos"
            element={
              <GuestOrChild>
                <VideosPage />
              </GuestOrChild>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ChildOnly>
                <DashboardPage />
              </ChildOnly>
            }
          />
          <Route
            path="/child/profile"
            element={
              <ChildOnly>
                <ChildProfilePage />
              </ChildOnly>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <button
          type="button"
          className="music-toggle-btn"
          data-no-click-sound
          onClick={toggleMusic}
          aria-label={muted ? "Unmute background music" : "Mute background music"}
          title={muted ? "Unmute music" : "Mute music"}
        >
          {muted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
