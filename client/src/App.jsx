import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import StoryPlayerPage from "./pages/StoryPlayerPage";
import CompletionPage from "./pages/CompletionPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ShopPage from "./pages/ShopPage";
import MyHomePage from "./pages/MyHomePage";
import RoomPage from "./pages/RoomPage";
import { AdminOnly, ChildOnly, ParentOnly, TeacherOnly } from "./components/guards/RoleRoute";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildProgress from "./pages/parent/ChildProgress";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassroomPage from "./pages/teacher/ClassroomPage";
import WordListEditor from "./pages/teacher/WordListEditor";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApprovals from "./pages/admin/AdminApprovals";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ChildOnly>
                <HomePage />
              </ChildOnly>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ChildOnly>
                <GamePage />
              </ChildOnly>
            }
          />
          <Route
            path="/story/:storyId"
            element={
              <ChildOnly>
                <StoryPlayerPage />
              </ChildOnly>
            }
          />
          <Route
            path="/completion"
            element={
              <ChildOnly>
                <CompletionPage />
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
            path="/dashboard"
            element={
              <ChildOnly>
                <Navigate to="/" replace />
              </ChildOnly>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
