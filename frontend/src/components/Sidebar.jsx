function Sidebar({ page, setPage, logout }) {
  const itemStyle =
    "w-full text-left px-5 py-4 rounded-xl text-lg transition";

  const active =
    "bg-blue-500/30 border border-blue-400 text-white";

  const normal =
    "hover:bg-white/10 text-gray-300";

  return (
    <div className="w-72 min-h-screen bg-black/30 backdrop-blur-md border-r border-white/10 p-6">

      <h1 className="text-white text-3xl font-bold mb-10">
        AI Exam
      </h1>

      <div className="space-y-3">

        <button
          onClick={() => setPage("dashboard")}
          className={`${itemStyle} ${
            page === "dashboard" ? active : normal
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => setPage("generate")}
          className={`${itemStyle} ${
            page === "generate" ? active : normal
          }`}
        >
          Generate
        </button>

        <button
          onClick={() => setPage("settings")}
          className={`${itemStyle} ${
            page === "settings" ? active : normal
          }`}
        >
          Settings
        </button>

        <button
          onClick={() => setPage("support")}
          className={`${itemStyle} ${
            page === "support" ? active : normal
          }`}
        >
          Support
        </button>

      </div>

      <div className="mt-12">
        <button
          onClick={logout}
          className="w-full bg-red-500 py-4 rounded-xl text-lg font-semibold"
        >
          Logout
        </button>
      </div>

    </div>
  );
}

export default Sidebar;