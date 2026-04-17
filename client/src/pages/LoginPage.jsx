import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import Navbar from "../components/Navbar";

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="screen with-bg">
      <Navbar />
      <LoginModal
        onSuccess={() => {
          navigate("/dashboard");
        }}
        onClose={() => navigate(-1)}
      />
    </div>
  );
};

export default LoginPage;
