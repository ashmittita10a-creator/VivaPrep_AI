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

  /* ===================================================
     FILE
  =================================================== */
  const handleFile = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const openPicker = (e) => {
    e.preventDefault();
    if (fileRef.current) fileRef.current.click();
  };

  /* ===================================================
     COPY / DOWNLOAD
  =================================================== */
  const copyAll = () => {
    const text = result
      .map((item, i) => `${i + 1}. ${item.question}\n${item.answer}`)
      .join("\n\n");

    navigator.clipboard.writeText(text);
  };

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

  /* ===================================================
     GENERATE QUESTIONS
  =================================================== */
  async function generateQuestions() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("plan, report_count")
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.log(profileError);
    }

    if (
      profile &&
      profile.plan === "free" &&
      profile.report_count >= 3
    ) {
      alert(
        "Free plan limit reached (3 reports). Upgrade to Premium 🚀"
      );
      return;
    }

    setLoading(true);
    setStatus("Preparing AI engine...");
    setResult([]);

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
  } catch (error) {
    console.log(error);
    setLoading(false);
    setStatus("Failed.");
  }
}

  function pollResult(jobId) {
  const interval = setInterval(async () => {
    const res = await fetch(
      `http://localhost:5000/result/${jobId}`
    );

    const data = await res.json();

    if (data.status === "queued")
      setStatus("Queued...");
    if (data.status === "reading")
      setStatus("Reading file...");
    if (data.status === "analyzing")
      setStatus("Analyzing...");
    if (data.status === "generating")
      setStatus("Generating...");
    if (data.status === "saving")
      setStatus("Saving...");

    if (data.status === "done") {
      clearInterval(interval);
      setLoading(false);
      setStatus("");
      formatOutput(data.result);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } =
          await supabase
            .from("profiles")
            .select("report_count")
            .eq("id", user.id)
            .single();

        await supabase
          .from("profiles")
          .update({
            report_count:
              (profile?.report_count || 0) + 1,
          })
          .eq("id", user.id);
      }
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

  function triggerCelebrate() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1800);
  }

  /* ===================================================
     TIC TAC TOE
     Standard rules only:
     3 in row wins / else draw
  =================================================== */
  const emptyBoard = Array(9).fill("");

  const [board, setBoard] = useState(emptyBoard);
  const [ticMsg, setTicMsg] = useState("Your Turn");

  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function ticWinner(arr) {
    for (let line of wins) {
      const [a, b, c] = line;

      if (arr[a] && arr[a] === arr[b] && arr[b] === arr[c]) {
        return arr[a];
      }
    }

    if (arr.every((cell) => cell !== "")) return "draw";

    return null;
  }

  function resetTic() {
    setBoard(emptyBoard);
    setTicMsg("Your Turn");
  }

  function randomMove(copy) {
    const empty = copy
      .map((v, i) => (v === "" ? i : null))
      .filter((v) => v !== null);

    if (!empty.length) return null;

    return empty[Math.floor(Math.random() * empty.length)];
  }

  function bestMove(copy) {
    for (let i = 0; i < 9; i++) {
      if (copy[i] === "") {
        let test = [...copy];
        test[i] = "O";
        if (ticWinner(test) === "O") return i;
      }
    }

    for (let i = 0; i < 9; i++) {
      if (copy[i] === "") {
        let test = [...copy];
        test[i] = "X";
        if (ticWinner(test) === "X") return i;
      }
    }

    if (copy[4] === "") return 4;

    return randomMove(copy);
  }

  function aiTicMove(copy) {
    let move;

    if (level === "easy") {
      move = randomMove(copy);
    } else if (level === "medium") {
      move = Math.random() < 0.5 ? randomMove(copy) : bestMove(copy);
    } else {
      move = bestMove(copy);
    }

    if (move === null) return;

    copy[move] = "O";

    setBoard([...copy]);

    const win = ticWinner(copy);

    if (win === "O") {
      setTicMsg("AI Won 🤖");
      setTimeout(resetTic, 1400);
      return;
    }

    if (win === "draw") {
      setTicMsg("Draw 🤝");
      setTimeout(resetTic, 1400);
      return;
    }

    setTicMsg("Your Turn");
  }

  function playTic(index) {
    if (!loading) return;
    if (board[index] !== "") return;

    let copy = [...board];
    copy[index] = "X";

    setBoard(copy);

    const win = ticWinner(copy);

    if (win === "X") {
      setTicMsg("You Won 🎉");
      triggerCelebrate();
      setTimeout(resetTic, 1400);
      return;
    }

    if (win === "draw") {
      setTicMsg("Draw 🤝");
      setTimeout(resetTic, 1400);
      return;
    }

    setTicMsg("AI Thinking...");
    setTimeout(() => aiTicMove(copy), 500);
  }

  useEffect(() => {
    resetTic();
  }, [level]);

  /* ===================================================
     ROCK PAPER SCISSORS
     Standard rules only
  =================================================== */
  const [rpsLeft, setRpsLeft] = useState("❔");
  const [rpsRight, setRpsRight] = useState("❔");
  const [rpsText, setRpsText] = useState("Choose your move");

  const rpsChoices = ["🪨", "📄", "✂️"];

  function aiChoice(player) {
    const beat = {
      "🪨": "📄",
      "📄": "✂️",
      "✂️": "🪨",
    };

    const lose = {
      "🪨": "✂️",
      "📄": "🪨",
      "✂️": "📄",
    };

    if (level === "easy") {
      return Math.random() < 0.65
        ? lose[player]
        : rpsChoices[Math.floor(Math.random() * 3)];
    }

    if (level === "medium") {
      return rpsChoices[Math.floor(Math.random() * 3)];
    }

    return Math.random() < 0.7
      ? beat[player]
      : rpsChoices[Math.floor(Math.random() * 3)];
  }

  function playRps(player) {
    if (!loading) return;

    const ai = aiChoice(player);

    setRpsLeft(player);
    setRpsRight(ai);

    if (player === ai) {
      setRpsText("Draw 🤝");
      return;
    }

    const playerWin =
      (player === "🪨" && ai === "✂️") ||
      (player === "📄" && ai === "🪨") ||
      (player === "✂️" && ai === "📄");

    if (playerWin) {
      setRpsText("You Won 🎉");
      triggerCelebrate();
    } else {
      setRpsText("AI Won 🤖");
    }
  }

  /* ===================================================
     MEMORY GAME
  =================================================== */
  const icons = [
    "🍎",
    "🍕",
    "🚗",
    "⚽",
    "🎧",
    "🐶",
    "🌙",
    "🔥",
    "🎁",
    "🍔",
    "🧠",
    "💎",
    "🎮",
    "📚",
    "🚀",
  ];

  const pairCount =
    level === "easy" ? 5 : level === "medium" ? 10 : 15;

  const [memoryCards, setMemoryCards] = useState([]);
  const [opened, setOpened] = useState([]);
  const [memoryMsg, setMemoryMsg] = useState("Find all pairs!");

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function resetMemory() {
    const selected = icons.slice(0, pairCount);
    const cards = shuffle(
      selected.concat(selected).map((icon, i) => ({
        id: i + Math.random(),
        icon,
        open: false,
        matched: false,
      }))
    );

    setMemoryCards(cards);
    setOpened([]);
    setMemoryMsg("Find all pairs!");
  }

  useEffect(() => {
    resetMemory();
  }, [level]);

  function playMemory(index) {
    if (!loading) return;

    const card = memoryCards[index];

    if (!card || card.open || card.matched) return;
    if (opened.length === 2) return;

    let copy = [...memoryCards];
    copy[index].open = true;

    const newOpened = [...opened, index];

    setMemoryCards(copy);
    setOpened(newOpened);

    if (newOpened.length === 2) {
      const first = copy[newOpened[0]];
      const second = copy[newOpened[1]];

      if (first.icon === second.icon) {
        setTimeout(() => {
          let next = [...copy];
          next[newOpened[0]].matched = true;
          next[newOpened[1]].matched = true;

          setMemoryCards(next);
          setOpened([]);

          const allDone = next.every((c) => c.matched);

          if (allDone) {
            setMemoryMsg("You Won 🎉");
            triggerCelebrate();
          } else {
            setMemoryMsg("Matched! ✅");
          }
        }, 500);
      } else {
        setTimeout(() => {
          let next = [...copy];
          next[newOpened[0]].open = false;
          next[newOpened[1]].open = false;

          setMemoryCards(next);
          setOpened([]);
          setMemoryMsg("Try Again");
        }, 700);
      }
    }
  }

  /* ===================================================
     UI
  =================================================== */
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
        <div className="gv-top">
          <div className="top-left">
            <h1>Generate Viva</h1>
            <p>
              Upload your syllabus, notes, or enter topics to generate viva
              questions.
            </p>
          </div>

          <div className="powered-box">✦ Powered by Advanced AI</div>
        </div>

        <div className="gv-grid">
          {/* LEFT */}
          <div className="left-panel">
            <h2>① Upload Document</h2>

            <label className="upload-area">
              <input
                hidden
                type="file"
                ref={fileRef}
                onChange={handleFile}
              />

              <div className="upload-icon">📄</div>

              <h3>Drag & Drop your file here</h3>

              <span>or</span>

              <button onClick={openPicker}>Browse Files</button>

              <small>PDF, PNG, JPEG</small>
            </label>

            {file && <div className="file-box">📄 {file.name}</div>}

            <div className="or-line">— OR —</div>

            <textarea
              placeholder="Enter topics..."
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />

            <button
              className="generate-main-btn"
              onClick={generateQuestions}
              disabled={loading}
            >
              ✦ Generate Questions
            </button>
          </div>

          {/* RIGHT */}
          <div className="right-panel">
            <div className="right-head">
              <h2>AI Generated Viva</h2>

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
                <div className="live-status">{status}</div>

                <h2 className="wait-line-3d">
                  While file is generating, enjoy games.
                </h2>

                <div className="game-tabs">
                  <button onClick={() => setGame("tic")}>
                    Tic Tac Toe
                  </button>

                  <button onClick={() => setGame("rps")}>
                    RPS
                  </button>

                  <button onClick={() => setGame("memory")}>
                    Memory
                  </button>
                </div>

                <div className="level-row">
                  <button onClick={() => setLevel("easy")}>
                    Easy
                  </button>

                  <button onClick={() => setLevel("medium")}>
                    Medium
                  </button>

                  <button onClick={() => setLevel("hard")}>
                    Hard
                  </button>
                </div>

                {/* TIC */}
                {game === "tic" && (
                  <>
                    <div className="tic-grid">
                      {board.map((cell, i) => (
                        <div
                          key={i}
                          className="tic-cell"
                          onClick={() => playTic(i)}
                        >
                          {cell}
                        </div>
                      ))}
                    </div>

                    <h2 className="result-big">{ticMsg}</h2>
                  </>
                )}

                {/* RPS */}
                {game === "rps" && (
                  <div className="rps-box">
                    <div className="rps-big">
                      <div>{rpsLeft}</div>
                      <div>{rpsRight}</div>
                    </div>

                    <div className="rps-row">
                      <button onClick={() => playRps("🪨")}>
                        🪨
                      </button>

                      <button onClick={() => playRps("📄")}>
                        📄
                      </button>

                      <button onClick={() => playRps("✂️")}>
                        ✂️
                      </button>
                    </div>

                    <h1 className="result-super-big">
                      {rpsText}
                    </h1>
                  </div>
                )}

                {/* MEMORY */}
                {game === "memory" && (
                  <div className="memory-box">
                    <div className="memory-grid">
                      {memoryCards.map((card, i) => (
                        <div
                          key={card.id}
                          className="memory-card"
                          onClick={() => playMemory(i)}
                        >
                          {card.open || card.matched
                            ? card.icon
                            : "❔"}
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
                      Generate questions to see output.
                    </div>
                  ) : (
                    result.map((item, i) => (
                      <div className="qa-card" key={i}>
                        <h3>
                          {i + 1}. {item.question}
                        </h3>

                        <p>{item.answer}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="bottom-row">
                  <span>
                    Showing {result.length} Questions
                  </span>

                  <button
                    className="top-action-btn"
                    onClick={generateQuestions}
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