import "./Settings.css";
import bg from "../assets/Background.png";
import Navbar from "../components/Navbar";

export default function Settings() {
  return (
    <div
      className="settings-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="settings-overlay"></div>

      {/* Updated Navbar */}
      <Navbar showBack={true} />

      {/* Main */}
      <main className="settings-main">
        <h1>Settings</h1>

        <p className="subtext">
          Manage your account, theme preferences and
          other settings.
        </p>

        <div className="settings-card">
          {/* Account */}
          <section className="setting-section">
            <div className="row-head">
              <h2>👤 Account Settings</h2>

              <button className="blue-btn">
                Update Profile
              </button>
            </div>

            <p className="name">
              Ashmit Tita
            </p>

            <p className="email">
              ashmittita10@gmail.com
            </p>
          </section>

          {/* Personalization */}
          <section className="setting-section">
            <div className="row-head">
              <h2>⚙ Personalization</h2>

              <label className="switch">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span className="slider"></span>
              </label>
            </div>

            <p>
              Show VivaPrep AI tips & hints
            </p>
          </section>

          {/* Theme */}
          <section className="setting-section">
            <h2>🎨 Theme Preference</h2>

            <div className="theme-grid">
              <div className="theme-box active">
                🌙 Dark Theme
              </div>

              <div className="theme-box">
                ☀ Light Theme
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="setting-section">
            <h2>🔒 Security</h2>

            <div className="security-actions">
              <button className="yellow-btn">
                Change Password
              </button>

              <button className="delete-btn">
                Delete Account
              </button>
            </div>
          </section>

          {/* Bottom Features */}
          <div className="bottom-features">
            <div className="mini-card">
              <span>👑</span>

              <h4>Full AI Power</h4>

              <p>
                Unlimited reports for all your
                subjects
              </p>
            </div>

            <div className="mini-card">
              <span>☁</span>

              <h4>Easy Cloud Sync</h4>

              <p>
                Access your reports anytime,
                anywhere
              </p>
            </div>

            <div className="mini-card">
              <span>🎧</span>

              <h4>Dedicated Support</h4>

              <p>
                Priority email and chat support
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}