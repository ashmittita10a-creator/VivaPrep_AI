const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ===================================
   UPLOAD
=================================== */
const upload = multer({
  dest: "uploads/",
});

/* ===================================
   GROQ
=================================== */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ===================================
   SUPABASE
=================================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===================================
   MEMORY JOB STORE
=================================== */
const jobs = {};

/* ===================================
   HELPERS
=================================== */
function jobId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).slice(2, 8)
  );
}

function safeDelete(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
}

function cleanOutput(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/Question\s*\d*[:.)-]*/gi, "")
    .replace(/Q\s*\d*[:.)-]*/gi, "")
    .replace(/A\s*\d*[:.)-]*/gi, "Answer:")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ===================================
   OCR IMAGE
=================================== */
async function runOCR(filePath) {
  try {
    const result = await Tesseract.recognize(
      filePath,
      "eng"
    );

    return result.data.text || "";
  } catch {
    return "";
  }
}

/* ===================================
   SCANNED PDF OCR
=================================== */
async function scannedPdfOCR(pdfPath) {
  const outputDir = "converted";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const old = fs.readdirSync(outputDir);

  for (const file of old) {
    safeDelete(path.join(outputDir, file));
  }

  const opts = {
    format: "png",
    out_dir: outputDir,
    out_prefix: "page",
    page: null,
  };

  await pdfPoppler.convert(pdfPath, opts);

  const files = fs.readdirSync(outputDir);

  let text = "";

  for (const file of files) {
    const img = path.join(outputDir, file);
    text += await runOCR(img);
    text += "\n";
    safeDelete(img);
  }

  return text;
}

/* ===================================
   EXTRACT TEXT
=================================== */
async function extractContent(filePath, ext) {
  let extractedText = "";

  if (ext === ".pdf") {
    try {
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } catch {}

    if (extractedText.trim().length < 100) {
      extractedText = await scannedPdfOCR(filePath);
    }
  }

  if (
    ext === ".png" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".webp"
  ) {
    extractedText = await runOCR(filePath);
  }

  return extractedText
    .replace(/\s+/g, " ")
    .trim();
}

/* ===================================
   GROQ CALL WITH FALLBACK
=================================== */
async function askGroq(prompt, maxTokens = 1800) {
  try {
    return await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });
  } catch (err) {
    return await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });
  }
}

/* ===================================
   PROCESS JOB
=================================== */
async function processJob(id, filePath, ext) {
  try {
    jobs[id].status = "reading";

    let extractedText = "";

    if (filePath) {
      extractedText = await extractContent(
        filePath,
        ext
      );
    }

    const userTopic = jobs[id].topic || "";

    if (
      extractedText.length < 20 &&
      userTopic.trim().length < 2
    ) {
      jobs[id].status = "failed";
      jobs[id].result =
        "Please upload valid file or enter topics.";
      return;
    }

    /* ==========================
       ANALYSIS
    ========================== */
    jobs[id].status = "analyzing";

    const analysisPrompt = `
Study material and topics:

TOPICS:
${userTopic}

CONTENT:
${extractedText.slice(0, 6000)}

Return only:
1. Subject Name
2. Chapters
3. Important repeated concepts
4. Viva probability topics
5. Exam likely questions
`;

    const analysis = await askGroq(
      analysisPrompt,
      700
    );

    const summary =
      analysis.choices[0]?.message?.content ||
      "";

    /* ==========================
       GENERATION
    ========================== */
    jobs[id].status = "generating";

    const finalPrompt = `
You are elite university professor and viva examiner.

Generate premium preparation content.

STRICT RULES:

1. Generate RANDOM number of important questions.
2. If subject large -> more questions.
3. If small subject -> fewer but quality.
4. Mix short medium long answers.
5. Cover definitions, differences, concepts, numericals, applications.
6. Use numbering only.
7. Never write Q:
8. Never write Marks:
9. Keep formatting beautiful.
10. Separate each answer clearly.

FORMAT:

1. What is DBMS?
Answer:
....

2. Explain normalization.
Answer:
....

TOPICS:
${userTopic}

SUMMARY:
${summary}

CONTENT:
${extractedText.slice(0, 9000)}
`;

    const completion = await askGroq(
      finalPrompt,
      3500
    );

    let result =
      completion.choices[0]?.message?.content ||
      "No output generated.";

    result = cleanOutput(result);

    /* ==========================
       SAVE REPORT
    ========================== */
    await supabase.from("reports").insert([
      {
        user_id: jobs[id].user_id,
        title: "Generated Viva Report",
        content: result,
      },
    ]);

    jobs[id].status = "done";
    jobs[id].result = result;

    safeDelete(filePath);
  } catch (error) {
    console.log(error);

    jobs[id].status = "failed";
    jobs[id].result =
      "Generation failed. Try again.";
  }
}

/* ===================================
   ROUTES
=================================== */

app.get("/", (req, res) => {
  res.send("VivaPrep AI Backend Running");
});

/* ===================================
   UPLOAD
=================================== */
app.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const id = jobId();

      const hasFile = req.file ? true : false;

      const filePath = hasFile
        ? req.file.path
        : null;

      const ext = hasFile
        ? path
            .extname(req.file.originalname)
            .toLowerCase()
        : "";

      jobs[id] = {
        status: "queued",
        result: "",
        user_id: req.body.user_id,
        topic: req.body.topic || "",
      };

      processJob(id, filePath, ext);

      res.json({
        jobId: id,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error: "Upload failed",
      });
    }
  }
);

/* ===================================
   STATUS
=================================== */
app.get("/status/:id", (req, res) => {
  const id = req.params.id;

  if (!jobs[id]) {
    return res.json({
      status: "not_found",
    });
  }

  res.json({
    status: jobs[id].status,
  });
});

/* ===================================
   RESULT
=================================== */
app.get("/result/:id", (req, res) => {
  const id = req.params.id;

  if (!jobs[id]) {
    return res.json({
      status: "not_found",
      result: "",
    });
  }

  res.json({
    status: jobs[id].status,
    result: jobs[id].result,
  });
});

/* ===================================
   START SERVER
=================================== */
app.listen(5000, () => {
  console.log(
    "Backend running on port 5000"
  );
});