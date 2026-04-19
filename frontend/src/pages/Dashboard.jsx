// Dashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Dashboard.css";
import bg from "../assets/Background.png";
import logo from "../assets/Logo.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      setUser(user);
    }

    loadUser();
  }, [navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const cards = [
    {
      title: "Generate Viva",
      desc: "Upload notes and get AI-generated viva questions & answers.",
      btn: "Open",
      glow: "cyan",
      path: "/generate",
    },
    {
      title: "Saved Reports",
      desc: "Access previously generated reports anytime.",
      btn: "View",
      glow: "green",
      path: "/saved-reports",
    },
    {
      title: "Premium Soon",
      desc: "Unlimited reports, faster AI, cloud sync and more.",
      btn: "Coming Soon",
      glow: "pink",
      path: "/premium",
    },
    {
      title: "Settings",
      desc: "Manage account, themes and preferences.",
      btn: "Open",
      glow: "gold",
      path: "/settings",
    },
    {
      title: "Support",
      desc: "Instagram, LinkedIn, GitHub and contact support.",
      btn: "Open",
      glow: "purple",
      path: "/support",
    },
  ];

  return (
    <div
      className="dashboard-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="dashboard-overlay"></div>

      {/* HEADER */}
      <header className="dashboard-header">
        {/* LEFT */}
        <div className="brand-side">
          <img
            src={logo}
            alt="VivaPrep AI"
            className="dashboard-logo"
          />

          <p className="tagline">
            Smart Last Minute Viva Preparation
          </p>
        </div>

        {/* RIGHT */}
        <div className="right-side">
          <div className="user-box">
            <img
              src={
                user?.user_metadata?.avatar_url ||
                "https://i.pravatar.cc/100"
              }
              alt="profile"
            />

            <div>
              <h3>
                {user?.user_metadata?.full_name ||
                  "User"}
              </h3>

              <span>{user?.email}</span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* CARDS */}
      <section className="cards-grid">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`dash-card ${card.glow}`}
            onClick={() => navigate(card.path)}
          >
            <h2>{card.title}</h2>

            <p>{card.desc}</p>

            <button>{card.btn}</button>
          </div>
        ))}
      </section>
    </div>
  );
}