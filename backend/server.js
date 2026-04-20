const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");
const axios = require("axios");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

/* =====================================================
   APP
===================================================== */
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* =====================================================
   MULTER
===================================================== */
const upload = multer({
  dest: "uploads/",
});

/* =====================================================
   GROQ FALLBACK
===================================================== */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =====================================================
   SUPABASE
===================================================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =====================================================
   JOB STORE
===================================================== */
const jobs = {};

/* =====================================================
   HELPERS
===================================================== */
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

function cleanText(text = "") {
  return text
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanOutput(text = "") {
  return text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/Question\s*\d*[:.)-]*/gi, "")
    .replace(/Q\s*\d*[:.)-]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitChunks(text, size = 5000) {
  const arr = [];

  for (let i = 0; i < text.length; i += size) {
    arr.push(text.slice(i, i + size));
  }

  return arr;
}

/* =====================================================
   OCR IMAGE
===================================================== */
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

/* =====================================================
   SCANNED PDF OCR
===================================================== */
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

/* =====================================================
   EXTRACT FILE TEXT
===================================================== */
async function extractContent(filePath, ext) {
  let text = "";

  if (ext === ".pdf") {
    try {
      const buffer = fs.readFileSync(filePath);
      const pdf = await pdfParse(buffer);

      text = pdf.text || "";
    } catch {}

    if (cleanText(text).length < 300) {
      text = await scannedPdfOCR(filePath);
    }
  }

  if (
    ext === ".png" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".webp"
  ) {
    text = await runOCR(filePath);
  }

  return cleanText(text);
}

/* =====================================================
   TOGETHER AI MAIN
===================================================== */
async function askTogether(prompt, maxTokens = 3500) {
  const res = await axios.post(
    "https://api.together.xyz/v1/chat/completions",
    {
      model:
        "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization:
          `Bearer ${process.env.TOGETHER_API_KEY}`,
        "Content-Type":
          "application/json",
      },
    }
  );

  return (
    res.data.choices?.[0]?.message
      ?.content || ""
  );
}

/* =====================================================
   GROQ FALLBACK
===================================================== */
async function askGroq(prompt, maxTokens = 3500) {
  const res =
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    });

  return (
    res.choices[0]?.message?.content ||
    ""
  );
}

/* =====================================================
   SMART AI CALL
===================================================== */
async function askAI(prompt, maxTokens = 3500) {
  try {
    return await askTogether(
      prompt,
      maxTokens
    );
  } catch (error) {
    console.log(
      "Together failed -> Groq fallback"
    );

    return await askGroq(
      prompt,
      maxTokens
    );
  }
}

/* =====================================================
   PDF ANALYSIS
===================================================== */
async function analyzeChunks(text, id) {
  const chunks = splitChunks(text, 4500);

  let summary = [];

  for (let i = 0; i < chunks.length; i++) {
    jobs[id].status =
      `Analyzing PDF ${i + 1}/${chunks.length}`;

    const prompt = `
Analyze academic study material.

Return:
1. Subject name
2. Chapters
3. Important concepts
4. Definitions
5. Repeated topics
6. Viva likely questions
7. Formula / numericals

CONTENT:
${chunks[i]}
`;

    const out = await askAI(
      prompt,
      1000
    );

    summary.push(out);
  }

  return summary.join("\n\n");
}

/* =====================================================
   FINAL GENERATION
===================================================== */
async function generatePremium(summary, topic) {
  const prompt = `
You are an expert viva examiner.

Your job is to generate viva questions ONLY from the uploaded study material.

STRICT RULES (VERY IMPORTANT):

1. Use ONLY the provided PDF ANALYSIS.
2. Do NOT use random outside examples.
3. Do NOT add DBMS / Java / C / OS etc unless present in PDF.
4. If user typed topics, include them ONLY if relevant.
5. Generate viva-style oral exam questions.
6. Questions must be relevant to chapters, definitions, concepts, formulas, processes.
7. Generate dynamic number of questions:
   - Small material = 8+
   - Medium = 15+
   - Large = 25+
8. Mix short / medium / long answers.
9. Use numbering only.
10. Format exactly:

1. What is ...
Answer:
...

2. Explain ...
Answer:
...

USER TOPICS:
${topic || "None"}

PDF ANALYSIS:
${summary}

Now generate highly relevant viva questions and answers.
`;

  return await askAI(prompt, 6500);
}

/* =====================================================
   PROCESS JOB
===================================================== */
async function processJob(
  id,
  filePath,
  ext
) {
  try {
    jobs[id].status =
      "Reading file...";

    let extractedText = "";

    if (filePath) {
      extractedText =
        await extractContent(
          filePath,
          ext
        );
    }

    const topic =
      jobs[id].topic || "";

    if (
      extractedText.length < 30 &&
      topic.trim().length < 2
    ) {
      jobs[id].status =
        "failed";
      jobs[id].result =
        "Upload readable file or enter topics.";
      return;
    }

    jobs[id].status =
      "Understanding content...";

    const summary =
      await analyzeChunks(
        extractedText,
        id
      );

    jobs[id].status =
      "Generating premium output...";

    let result =
      await generatePremium(
        summary,
        topic
      );

    result = cleanOutput(result);

    jobs[id].status =
      "Saving report...";

    await supabase
      .from("reports")
      .insert([
        {
          user_id:
            jobs[id].user_id,
          title:
            "Generated Viva Report",
          content: result,
        },
      ]);

    jobs[id].status =
      "done";
    jobs[id].result =
      result;

    safeDelete(filePath);
  } catch (error) {
    console.log(error);

    jobs[id].status =
      "failed";
    jobs[id].result =
      "Generation failed. Try again.";
  }
}

/* =====================================================
   ROUTES
===================================================== */
app.get("/", (req, res) => {
  res.send(
    "VivaPrep AI Backend Running"
  );
});

/* UPLOAD */
app.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const id = jobId();

      const hasFile =
        !!req.file;

      const filePath =
        hasFile
          ? req.file.path
          : null;

      const ext =
        hasFile
          ? path
              .extname(
                req.file
                  .originalname
              )
              .toLowerCase()
          : "";

      jobs[id] = {
        status:
          "queued",
        result: "",
        user_id:
          req.body.user_id,
        topic:
          req.body.topic ||
          "",
      };

      processJob(
        id,
        filePath,
        ext
      );

      res.json({
        jobId: id,
      });
    } catch (error) {
      res.status(500).json({
        error:
          "Upload failed",
      });
    }
  }
);

/* RESULT */
app.get(
  "/result/:id",
  (req, res) => {
    const id =
      req.params.id;

    if (!jobs[id]) {
      return res.json({
        status:
          "not_found",
        result: "",
      });
    }

    res.json({
      status:
        jobs[id].status,
      result:
        jobs[id].result,
    });
  }
);

/* START */
app.listen(PORT, () => {
  console.log(
    `Backend running on port ${PORT}`
  );
});