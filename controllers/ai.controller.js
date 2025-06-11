// backend/controllers/aiController.js
import { getGeminiModel } from "../utils/geminiClient.js"; // Assuming you created geminiClient.js
import fs from "fs"; // Node.js file system module for reading the image
import path from "path"; // Node.js path module

// Function to convert local file to a GoogleGenerativeAI.Part object
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

export const analyzePlant = async (req, res) => {
  try {
    // Multer would have handled the file upload and attached it to req.file
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    const imagePath = req.file.path; // Path where Multer saved the image
    const mimeType = req.file.mimetype;

    if (!mimeType.startsWith("image/")) {
      // Clean up the uploaded file if it's not an image
      fs.unlinkSync(imagePath);
      return res
        .status(400)
        .json({ message: "Uploaded file is not an image." });
    }

    const model = getGeminiModel("gemini-pro-vision"); // Use the Vision model

    // You can customize the prompt based on what kind of plant update you want
    const prompt =
      "Analyze this image of a plant. Identify the plant species if possible, describe its current health, and suggest any immediate care actions needed (e.g., watering, sunlight, pest issues). If it looks healthy, state that. Focus on actionable insights.";

    const imagePart = fileToGenerativePart(imagePath, mimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the uploaded file after analysis
    fs.unlinkSync(imagePath);

    res.json({
      analysis: text,
      plantHealth: "determined_by_ai_output", // You might parse 'text' to extract specific health status
      suggestedActions: "determined_by_ai_output", // You might parse 'text' to extract specific actions
    });
  } catch (error) {
    console.error("Error analyzing plant image with Gemini:", error);
    // Clean up the uploaded file in case of an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      message: "Failed to analyze plant image.",
      error: error.message,
    });
  }
};

// export default analyzePlant;
