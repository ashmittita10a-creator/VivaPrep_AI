import { useState, useRef, useEffect } from "react";
import "./GenerateViva.css";
import bg from "../assets/Background.png";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase";

export default function GenerateViva() {
  const fileRef = useRef(null);

  /* ================= MAIN ================= */
  const [file, setFile] = useState(null);
  const [topics, setTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState([]);

  const [game, setGame] = useState("tic");
  const [level, setLevel] = useState("easy");
  const [celebrate, setCelebrate] = useState(false);

  /* ================= FILE ================= */
  const handleFile = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const openPicker = (e) => {
    e.preventDefault();
    fileRef.current.click();
  };

  /* ================= COPY ================= */
  const copyAll = () => {
    const text = result
      .map((item, i) => `${i + 1}. ${item.question}\n${item.answer}`)
      .join("\n\n");

    navigator.clipboard.writeText(text);
    alert("Copied");
  };

  /* ================= DOWNLOAD ================= */
  const downloadFile = () => {
    const text = result
      .map((item, i) => `${i + 1}. ${item.question}\n${item.answer}`)
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "VivaPrep_Report.txt";
    a.click();
  };

  /* ================= GENERATE ================= */
  async function generateQuestions() {
    try {
      setLoading(true);
      setStatus("Preparing AI engine...");
      setResult([]);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const formData = new FormData();

      if (file) formData.append("file", file);

      formData.append("topic", topics);
      formData.append("user_id", user.id);

      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      pollResult(data.jobId);
    } catch (err) {
      console.log(err);
      setLoading(false);
      setStatus("Failed.");
    }
  }

  function pollResult(jobId) {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:5000/result/${jobId}`);
      const data = await res.json();

      if (data.status === "queued") setStatus("Queued...");
      if (data.status === "reading") setStatus("Reading file...");
      if (data.status === "analyzing") setStatus("Analyzing...");
      if (data.status === "generating") setStatus("Generating...");
      if (data.status === "saving") setStatus("Saving...");

      if (data.status === "done") {
        clearInterval(interval);
        setLoading(false);
        setStatus("");
        formatOutput(data.result);
      }

      if (data.status === "failed") {
        clearInterval(interval);
        setLoading(false);
        setStatus("Failed.");
      }
    }, 2200);
  }

  function formatOutput(text) {
    const lines = text.split("\n").filter(Boolean);

    let arr = [];
    let current = null;

    lines.forEach((line) => {
      if (/^\d+\./.test(line)) {
        if (current) arr.push(current);

        current = {
          question: line.replace(/^\d+\.\s*/, ""),
          answer: "",
        };
      } else {
        if (current) current.answer += line + " ";
      }
    });

    if (current) arr.push(current);
    setResult(arr);
  }

  /* ================= GAMES KEEP SAME ================= */
  const [board, setBoard] = useState(Array(9).fill(""));
  const [ticMsg, setTicMsg] = useState("Best of 3");
  const [ticUser, setTicUser] = useState(0);
  const [ticAi, setTicAi] = useState(0);

  const [rpsText, setRpsText] = useState("Best of 3");
  const [rpsUser, setRpsUser] = useState(0);
  const [rpsAi, setRpsAi] = useState(0);

  const [memoryMsg] = useState("Find all pairs!");

  const memoryCount =
    level === "easy"
      ? 5
      : level === "medium"
      ? 10
      : 15;

  function popCelebrate() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1500);
  }

  /* ================= UI ================= */
  return (
    <div
      className="gv-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="gv-overlay"></div>

      {celebrate && (
        <div className="pop-wrap">
          {[...Array(25)].map((_, i) => (
            <span key={i}></span>
          ))}
        </div>
      )}

      <Navbar showBack={true} />

      <main className="gv-main">
        {/* TOP */}
        <div className="gv-top">
          <div className="top-left">
            <h1>Generate Viva</h1>
            <p>
              Upload your syllabus, notes,
              or enter the topics you'd like
              to generate viva questions for.
            </p>
          </div>

          <div className="powered-box">
            ✦ Powered by Advanced AI
          </div>
        </div>

        {/* GRID */}
        <div className="gv-grid">
          {/* LEFT PANEL */}
          <div className="left-panel">
            <h2>① Upload Document</h2>

            <p className="sub-text">
              Upload your syllabus, notes,
              or study material and our AI
              will analyze it.
            </p>

            <label className="upload-area">
              <input
                type="file"
                hidden
                ref={fileRef}
                onChange={handleFile}
              />

              <div className="upload-icon">
                📄
              </div>

              <h3>
                Drag & Drop your file here
              </h3>

              <span>or</span>

              <button onClick={openPicker}>
                Browse Files
              </button>

              <small>
                Supported Formats:
                PDF, PNG, JPEG
              </small>
            </label>

            {file && (
              <div className="file-box">
                📄 {file.name}
              </div>
            )}

            <div className="or-line">
              — OR —
            </div>

            <h2>② Enter Topics</h2>

            <p className="sub-text">
              Add topics separated by commas.
            </p>

            <textarea
              placeholder="Enter topics separated by commas..."
              value={topics}
              onChange={(e) =>
                setTopics(e.target.value)
              }
            />

            <div className="topic-row">
              <button className="mini-btn">
                + Add More Topics
              </button>

              <button
                className="mini-btn"
                onClick={() =>
                  setTopics("")
                }
              >
                Clear All
              </button>
            </div>

            <button
              className="generate-main-btn"
              onClick={generateQuestions}
              disabled={loading}
            >
              ✦ Generate Questions
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div className="right-panel">
            <div className="right-head">
              <div>
                <h2>AI Generated Viva</h2>
                <p className="sub-text">
                  Here are the viva
                  questions generated from
                  your uploaded content.
                </p>
              </div>

              <div className="right-btns">
                <button
                  className="top-action-btn"
                  onClick={downloadFile}
                >
                  ⬇ Download
                </button>

                <button
                  className="top-action-btn"
                  onClick={copyAll}
                >
                  📋 Copy All
                </button>
              </div>
            </div>

            {loading ? (
              <>
                <div className="live-status">
                  {status}
                </div>

                <h2 className="wait-line-3d">
                  While your viva is being
                  generated, sharpen your
                  mind with mini games.
                </h2>

                <div className="game-tabs">
                  <button
                    onClick={() =>
                      setGame("tic")
                    }
                  >
                    Tic Tac Toe
                  </button>

                  <button
                    onClick={() =>
                      setGame("rps")
                    }
                  >
                    RPS
                  </button>

                  <button
                    onClick={() =>
                      setGame("memory")
                    }
                  >
                    Memory
                  </button>
                </div>

                <div className="level-row">
                  <button
                    onClick={() =>
                      setLevel("easy")
                    }
                  >
                    Easy
                  </button>

                  <button
                    onClick={() =>
                      setLevel("medium")
                    }
                  >
                    Medium
                  </button>

                  <button
                    onClick={() =>
                      setLevel("hard")
                    }
                  >
                    Hard
                  </button>
                </div>

                {game === "tic" && (
                  <>
                    <h3 className="score-big">
                      YOU {ticUser} :{" "}
                      {ticAi} AI
                    </h3>

                    <div className="tic-grid">
                      {board.map(
                        (cell, i) => (
                          <div
                            key={i}
                            className="tic-cell"
                          >
                            {cell}
                          </div>
                        )
                      )}
                    </div>

                    <h2 className="result-big">
                      {ticMsg}
                    </h2>
                  </>
                )}

                {game === "rps" && (
                  <div className="rps-box">
                    <h3 className="score-big">
                      YOU {rpsUser} :{" "}
                      {rpsAi} AI
                    </h3>

                    <div className="rps-row">
                      <button>🪨</button>
                      <button>📄</button>
                      <button>✂️</button>
                    </div>

                    <h1 className="result-super-big">
                      {rpsText}
                    </h1>
                  </div>
                )}

                {game === "memory" && (
                  <div className="memory-box">
                    <div className="memory-grid">
                      {Array.from({
                        length:
                          memoryCount,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="memory-card"
                        >
                          ❔
                        </div>
                      ))}
                    </div>

                    <h2 className="result-big">
                      {memoryMsg}
                    </h2>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="qa-list">
                  {result.length === 0 ? (
                    <div className="empty-box">
                      Generate questions
                      to see output.
                    </div>
                  ) : (
                    result.map(
                      (
                        item,
                        i
                      ) => (
                        <div
                          className="qa-card"
                          key={i}
                        >
                          <h3>
                            Q{i + 1}.{" "}
                            {
                              item.question
                            }
                          </h3>

                          <p>
                            <b>A:</b>{" "}
                            {
                              item.answer
                            }
                          </p>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="bottom-row">
                  <span>
                    Showing{" "}
                    {result.length}{" "}
                    Questions
                  </span>

                  <button
                    className="top-action-btn"
                    onClick={
                      generateQuestions
                    }
                  >
                    ↻ Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}