import File from "../model/file.model.js";
import dotenv from "dotenv";

dotenv.config();

export const getContentSummary = async (req, res) => {
  const fileId = req.params.id;

  if (!fileId) {
    return res.status(400).json({ message: "File ID is required" });
  }

  try {
    const file = await File.findById(fileId).lean();
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const prompt = `
You are an expert educational assistant.
A teacher uploaded a study material with the following details:
${JSON.stringify(file)}

Your task:
1. Analyze this material conceptually (assume you have access to its content).
2. Generate a concise educational summary (4-6 sentences).
3. Identify 3-5 key topics or themes.

Return ONLY your answer in this exact JSON format:
{
  "summary": "short summary here",
  "themes": ["theme1", "theme2", "theme3"]
}
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
          temperature: 0.6,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText =
      data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "";

    console.log("🧠 AI Summary Raw:", rawText);

    const cleanText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    let parsedOutput = {};
    if (jsonMatch) {
      try {
        parsedOutput = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("❌ JSON Parse Error (Summary):", err.message);
      }
    }

    const formattedOutput = {
      summary: parsedOutput.summary?.trim() || "No summary provided",
      themes: Array.isArray(parsedOutput.themes)
        ? parsedOutput.themes.map((t) => t.trim())
        : [],
    };

    return res.status(200).json({
      success: true,
      file: file.title,
      aiSummary: formattedOutput,
    });
  } catch (error) {
    console.error("AI Summary Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI summary",
      error: error.message,
    });
  }
};

export const getContentQuiz = async (req, res) => {
  const fileId = req.params.id;

  if (!fileId) {
    return res.status(400).json({ message: "File ID is required" });
  }

  try {
    const file = await File.findById(fileId).lean();
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const prompt = `
You are an expert quiz maker for educational materials.
Based on the following file information:
${JSON.stringify(file)}

Your task:
Generate exactly 5 quiz-style questions based on this material.
Each question must include a correct answer.

Return ONLY your answer in this exact JSON format:
{
  "quiz": [
    { "question": "Question 1 text", "answer": "Answer 1" },
    { "question": "Question 2 text", "answer": "Answer 2" },
    { "question": "Question 3 text", "answer": "Answer 3" },
    { "question": "Question 4 text", "answer": "Answer 4" },
    { "question": "Question 5 text", "answer": "Answer 5" }
  ]
}
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText =
      data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "";

    console.log("🧠 AI Quiz Raw:", rawText);

    const cleanText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    let parsedOutput = {};
    if (jsonMatch) {
      try {
        parsedOutput = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("❌ JSON Parse Error (Quiz):", err.message);
      }
    }

    const formattedQuiz = Array.isArray(parsedOutput.quiz)
      ? parsedOutput.quiz.map((q) => ({
          question: q.question?.trim() || "",
          answer: q.answer?.trim() || "",
        }))
      : [];

    return res.status(200).json({
      success: true,
      file: file.title,
      quiz: formattedQuiz,
    });
  } catch (error) {
    console.error("AI Quiz Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate quiz",
      error: error.message,
    });
  }
};
