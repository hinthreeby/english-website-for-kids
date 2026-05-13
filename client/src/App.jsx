import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import useMouseParticles from "./hooks/useMouseParticles";
import useBgMusic from "./hooks/useBgMusic";
const bgMusic = "/sounds/background_music.mp3";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
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
import WordListEditor from "./pages/teacher/WordListEditor";
import UserProfilePage from "./pages/UserProfilePage";
import CollectionPage from "./pages/CollectionPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminProfile from "./pages/admin/AdminProfile";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import OAuthVerifyPage from "./pages/OAuthVerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

const App = () => {
  useMouseParticles();
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
                <ParentDashboard />
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
            path="/teacher/wordlist"
            element={
              <TeacherOnly>
                <WordListEditor />
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
            path="/dashboard"
            element={
              <ChildOnly>
                <Navigate to="/" replace />
              </ChildOnly>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <button
          type="button"
          className="music-toggle-btn"
          onClick={toggleMusic}
          aria-label={muted ? "Unmute background music" : "Mute background music"}
          title={muted ? "Unmute music" : "Mute music"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
