// Support.jsx

import "./Support.css";
import bg from "../assets/Background.png";
import Navbar from "../components/Navbar";

export default function Support() {
  const openLink = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div
      className="support-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="support-overlay"></div>

      {/* LEFT ARROW ENABLED HERE */}
      <Navbar showBack={true} />

      <main className="support-main">
        <h1>Support</h1>

        <p className="support-sub">
          Need help? Get in touch with us through the following channels.
        </p>

        <div className="support-card">
          <div className="support-title">💬 Support</div>

          {/* Instagram */}
          <div className="support-row">
            <div className="support-left">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                alt="Instagram"
                className="social-logo"
              />

              <div>
                <h3>Instagram</h3>
                <p>Follow us for updates and helpful info.</p>
              </div>
            </div>

            <button
              className="view-btn"
              onClick={() =>
                openLink("https://instagram.com/ashmit.tita")
              }
            >
              View
            </button>
          </div>

          {/* LinkedIn */}
          <div className="support-row">
            <div className="support-left">
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
                className="social-logo"
              />

              <div>
                <h3>LinkedIn</h3>
                <p>Connect with us for professional updates.</p>
              </div>
            </div>

            <button
              className="view-btn"
              onClick={() =>
                openLink(
                  "https://www.linkedin.com/in/ashmit-tita/"
                )
              }
            >
              View
            </button>
          </div>

          {/* GitHub */}
          <div className="support-row">
            <div className="support-left">
              <img
                src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                alt="GitHub"
                className="social-logo"
              />

              <div>
                <h3>GitHub</h3>
                <p>Report issues and request features.</p>
              </div>
            </div>

            <button
              className="view-btn"
              onClick={() =>
                openLink(
                  "https://github.com/ashmittita10a-creator"
                )
              }
            >
              View
            </button>
          </div>

          <p className="support-email">
            Email us at support@vivaprep.ai for any questions or support inquiries.
          </p>
        </div>
      </main>
    </div>
  );
}