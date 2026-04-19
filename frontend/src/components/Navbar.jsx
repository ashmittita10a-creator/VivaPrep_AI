import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Navbar.css";
import logo from "../assets/Logo.png";

export default function Navbar({ showBack = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/");
      }
    }

    getUser();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <header className="top-navbar">
      {/* LEFT SIDE */}
      <div className="nav-left">
        {showBack && (
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ❮
          </button>
        )}

        <img
          src={logo}
          alt="VivaPrep Logo"
          className="nav-logo"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="nav-right">
        {user && (
          <div className="nav-user">
            <img
              src={
                user.user_metadata?.avatar_url ||
                "https://i.pravatar.cc/100"
              }
              alt="Profile"
            />

            <div>
              <h3>
                {user.user_metadata?.full_name ||
                  "User"}
              </h3>

              <p>{user.email}</p>
            </div>
          </div>
        )}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}