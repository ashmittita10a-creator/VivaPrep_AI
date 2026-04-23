import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Login.css";
import bg from "../assets/Background.png";
import logo from "../assets/Logo.png";

export default function Login() {
  const navigate = useNavigate();

  async function createProfileIfNeeded(user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "User",
        avatar_url:
          user.user_metadata?.avatar_url || "",
        plan: "free",
        report_count: 0,
      },
    ]);
  }
}

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/dashboard",
      },
    });
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
  await createProfileIfNeeded(session.user);
  navigate("/dashboard");
}
    }

    checkSession();
  }, [navigate]);

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="login-overlay"></div>

      {/* Header */}
      <header className="login-header">
        <div className="brand">
          <img
            src={logo}
            alt="VivaPrep AI Logo"
            className="site-logo"
          />
        </div>

        <div className="top-links">
          <span>Privacy Policy</span>
          <span className="divider">|</span>
          <span>Need Help?</span>
        </div>
      </header>

      {/* Main */}
      <main className="login-main">
        <div className="outer-card">
          <h2>Welcome to VivaPrep AI</h2>

          <p className="subtitle">
            Sign in to generate intelligent viva
            <br />
            questions powered by AI.
          </p>

          <div className="inner-card">
            <h3>Get started with</h3>

            <button
              className="google-btn"
              onClick={loginWithGoogle}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
              />
              <span>Sign in with Google</span>
            </button>

            <div className="feature-list">
              <div className="feature">
                <span className="tick">✔</span>
                <span>
                  Generate accurate viva questions
                </span>
              </div>

              <div className="feature">
                <span className="tick">✔</span>
                <span>
                  Access saved reports anytime
                </span>
              </div>

              <div className="feature">
                <span className="shield">◉</span>
                <span>
                  Your data is secure & encrypted
                </span>
              </div>
            </div>

            <div className="secure-box">
              🔒 Your data is secure & encrypted
            </div>

            <p className="bottom-text">
              Don't have an account? Contact Support
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}