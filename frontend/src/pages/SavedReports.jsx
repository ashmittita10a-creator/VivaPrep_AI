import "./SavedReports.css";
import bg from "../assets/Background.png";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function SavedReports() {
  const [reports] = useState([
    {
      id: 1,
      title: "Physics Viva Report",
      file: "Physics_Syllabus.pdf",
      topics: "Newton's Laws, Thermodynamics",
      date: "April 24, 2024",
      questions: 15,
      type: "pdf",
    },
    {
      id: 2,
      title: "Chapter 5 Exam Prep",
      file: "Biology_Syllabus.docx",
      topics: "Photosynthesis, Cell Division",
      date: "April 23, 2024",
      questions: 11,
      type: "doc",
    },
    {
      id: 3,
      title: "Organic Chemistry Questions",
      file: "OrganicChemistry.pdf",
      topics: "Functional Groups",
      date: "April 21, 2024",
      questions: 20,
      type: "pdf",
    },
    {
      id: 4,
      title: "History Viva",
      file: "AncientCivilization.docx",
      topics: "Indus Valley, Maurya Empire",
      date: "April 20, 2024",
      questions: 8,
      type: "doc",
    },
  ]);

  const [search, setSearch] = useState("");

  const filtered = reports.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="saved-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="saved-overlay"></div>

      {/* Updated Navbar */}
      <Navbar showBack={true} />

      {/* BODY */}
      <main className="saved-main">
        <div className="saved-card">
          <h1>Saved Reports</h1>

          <p className="saved-sub">
            View and access your previously generated viva practice reports
          </p>

          {/* Search */}
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

          {/* Reports */}
          {filtered.length > 0 ? (
            <div className="report-list">
              {filtered.map((item) => (
                <div
                  className="report-row"
                  key={item.id}
                >
                  <div className="file-icon">
                    {item.type === "pdf"
                      ? "PDF"
                      : "DOC"}
                  </div>

                  <div className="report-info">
                    <h3>{item.title}</h3>

                    <p>
                      {item.file} •{" "}
                      {item.topics}
                    </p>

                    <span>
                      Created: {item.date} •{" "}
                      {item.questions} Questions
                    </span>
                  </div>

                  <button className="view-btn">
                    View Report
                  </button>

                  <div className="dots">
                    ⋮
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