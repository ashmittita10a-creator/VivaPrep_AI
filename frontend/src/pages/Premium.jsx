import "./Premium.css";
import bg from "../assets/Background.png";
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Premium() {
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, []);

  async function fetchPlan() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setPlan(data.plan || "free");
      }

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  async function upgradePlan() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ plan: "premium" })
      .eq("id", user.id);

    if (error) {
      alert("Upgrade failed.");
      return;
    }

    setPlan("premium");
    alert("You are now Premium 👑");
  }

  return (
    <div
      className="premium-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="premium-overlay"></div>

      {/* Navbar */}
      <Navbar showBack={true} />

      {/* MAIN */}
      <main className="premium-main">
        <h1>Premium</h1>

        <p className="premium-sub">
          Unlock the full power of AI-driven viva prep with our premium features.
        </p>

        <div className="premium-card">
          {/* LEFT SIDE */}
          <div className="left-side">
            <div className="shield-box">⭐</div>

            <button
              className="upgrade-btn"
              onClick={
                plan === "premium"
                  ? null
                  : upgradePlan
              }
            >
              {loading
                ? "Loading..."
                : plan === "premium"
                ? "Already Premium 👑"
                : "Upgrade Now"}
            </button>

            <p className="price-line">
              {loading
                ? "Checking your plan..."
                : plan === "premium"
                ? "Your premium membership is active."
                : "Try free for 7 days, then just ₹99/month"}
            </p>

            <span className="cancel-text">
              {plan === "premium"
                ? "Unlimited reports unlocked"
                : "Cancel anytime"}
            </span>
          </div>

          {/* RIGHT SIDE */}
          <div className="right-side">
            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Unlimited Reports</h3>

                <p>
                  Generate unlimited viva reports without restrictions.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Faster AI</h3>

                <p>
                  Generate questions in record time with priority speed.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Unlimited Saved Reports</h3>

                <p>
                  Keep all reports stored securely for future revision.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Priority Support</h3>

                <p>
                  Get faster help whenever you need assistance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="bottom-grid">
          <div className="mini-box">
            <div className="icon">👑</div>

            <h4>Unlimited Power</h4>

            <p>
              Unlock unlimited uploads and best AI generation quality.
            </p>
          </div>

          <div className="mini-box">
            <div className="icon">☁</div>

            <h4>Saved Reports</h4>

            <p>
              Access your reports anytime from your account.
            </p>
          </div>

          <div className="mini-box">
            <div className="icon">🎧</div>

            <h4>Support</h4>

            <p>
              Dedicated priority help and guidance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}