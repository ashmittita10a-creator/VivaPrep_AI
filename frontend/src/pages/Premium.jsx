import "./Premium.css";
import bg from "../assets/Background.png";
import Navbar from "../components/Navbar";

export default function Premium() {
  return (
    <div
      className="premium-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="premium-overlay"></div>

      {/* Updated Navbar */}
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

            <button className="upgrade-btn">
              Upgrade Now
            </button>

            <p className="price-line">
              Try free for 7 days,
              <br />
              then just ₹99/month
            </p>

            <span className="cancel-text">
              Cancel anytime
            </span>
          </div>

          {/* RIGHT SIDE */}
          <div className="right-side">
            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>100 Uploads / Month</h3>

                <p>
                  Upload notes, PDFs and generate up to
                  100 reports monthly.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Faster AI</h3>

                <p>
                  Generate questions in record time with
                  priority speed.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Unlimited Saved Reports</h3>

                <p>
                  Keep all reports stored securely for
                  future revision.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <span>✔</span>

              <div>
                <h3>Priority Support</h3>

                <p>
                  Get faster help whenever you need
                  assistance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="bottom-grid">
          <div className="mini-box">
            <div className="icon">👑</div>

            <h4>Full AI Power</h4>

            <p>
              100 monthly uploads with premium
              generation quality.
            </p>
          </div>

          <div className="mini-box">
            <div className="icon">☁</div>

            <h4>Saved Reports</h4>

            <p>
              Access your reports anytime from your
              account.
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