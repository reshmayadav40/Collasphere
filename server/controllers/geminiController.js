const { GoogleGenerativeAI } = require("@google/generative-ai");

// FIXED INIT (IMPORTANT)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// 🔥 MULTI MODEL LIST (fallback system)
const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];
// Helper function (tries multiple models)
const generateWithFallback = async (prompt) => {
  let lastError;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text(); // success
    } catch (err) {
      lastError = err;
      console.warn(`Model failed: ${modelName}`);
    }
  }

  throw lastError;
};

// @desc Explain text or code
const explainContent = async (req, res) => {
  try {
    const { content, type } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const prompt =
      type === "code"
        ? `Explain this code clearly:\n\n${content}`
        : `Explain this text clearly:\n\n${content}`;

    const text = await generateWithFallback(prompt);

    res.json({ explanation: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: "Failed to generate explanation from AI" });
  }
};

// @desc Suggest improvements
const suggestImprovements = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const prompt = `Suggest improvements:\n\n${content}`;

    const text = await generateWithFallback(prompt);

    res.json({ suggestions: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: "Failed to generate suggestions from AI" });
  }
};

// @desc Generate docs
const generateDocs = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code content is required" });
    }

    const prompt = `Generate documentation:\n\n${code}`;

    const text = await generateWithFallback(prompt);

    res.json({ documentation: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res
      .status(500)
      .json({ message: "Failed to generate documentation from AI" });
  }
};

// @desc Generate README
const generateReadme = async (req, res) => {
  try {
    const { projectName, description, features } = req.body;

    const prompt = `
Generate README:

Project: ${projectName || "Awesome Project"}
Description: ${description || "A cool project"}
Features: ${features || "Standard features"}
`;

    const text = await generateWithFallback(prompt);

    res.json({ readme: text });
  } catch (error) {
    console.log("FULL GEMINI ERROR:", error);
    console.log("ERROR MESSAGE:", error.message);
    console.log("ERROR STACK:", error.stack);
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: "Failed to generate README from AI" });
  }
};

module.exports = {
  explainContent,
  suggestImprovements,
  generateDocs,
  generateReadme,
};
