import "./SavedReports.css";
import bg from "../assets/Background.png";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase";

export default function SavedReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setReports(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  function downloadReport(item) {
    const blob = new Blob([item.content || ""], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = item.title || "VivaPrep_Report.txt";
    a.click();
  }

  async function deleteReport(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Failed to delete report.");
      return;
    }

    setReports(
      reports.filter((item) => item.id !== id)
    );

    setMenuOpen(null);
  }

  const filtered = reports.filter(
    (item) =>
      item.title
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      item.subject
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div
      className="saved-page"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <div className="saved-overlay"></div>

      <Navbar showBack={true} />

      <main className="saved-main">
        <div className="saved-card">
          <h1>Saved Reports</h1>

          <p className="saved-sub">
            View and access your previously generated viva practice reports
          </p>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {loading ? (
            <div className="no-reports">
              <h2>Loading...</h2>
            </div>
          ) : filtered.length > 0 ? (
            <div className="report-list">
              {filtered.map((item, index) => (
                <div
                  className="report-row"
                  key={item.id || index}
                >
                  <div className="file-icon">
                    {item.file_name
                      ?.toLowerCase()
                      .includes(".pdf")
                      ? "PDF"
                      : "DOC"}
                  </div>

                  <div className="report-info">
                    <h3>
                      {item.title ||
                        "Generated Report"}
                    </h3>

                    <p>
                      {item.file_name ||
                        "Topic Input"}{" "}
                      •{" "}
                      {item.subject ||
                        "General"}
                    </p>

                    <span>
                      Created:{" "}
                      {new Date(
                        item.created_at
                      ).toLocaleDateString()}{" "}
                      •{" "}
                      {item.content
                        ?.split("\n")
                        .filter(Boolean)
                        .length || 0}{" "}
                      Questions
                    </span>
                  </div>

                  <button
                    className="view-btn"
                    onClick={() =>
                      downloadReport(item)
                    }
                  >
                    Download
                  </button>

                  <div className="menu-wrap">
                    <div
                      className="dots"
                      onClick={() =>
                        setMenuOpen(
                          menuOpen === item.id
                            ? null
                            : item.id
                        )
                      }
                    >
                      ⋮
                    </div>

                    {menuOpen === item.id && (
                      <div className="menu-box">
                        <div
                          className="menu-item delete-item"
                          onClick={() =>
                            deleteReport(
                              item.id
                            )
                          }
                        >
                          Delete
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reports">
              <h2>No Saved Reports</h2>

              <p>
                Your generated reports
                will appear here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}