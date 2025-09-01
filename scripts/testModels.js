// // backend/scripts/test-gemini.js
// import { testGeminiConnection } from "../utils/geminiClient.js";

// async function testConnection() {
//   console.log("Testing Gemini API connection...");
//   const result = await testGeminiConnection();

//   console.log("Result:", result);

//   if (result.success) {
//     console.log("✅ Gemini API connection successful!");
//     console.log(`Available models: ${result.availableModels}`);
//     console.log("Test response:", result.testResponse);
//   } else {
//     console.log("❌ Gemini API connection failed:");
//     console.log("Error:", result.error);
//     console.log("\nTroubleshooting steps:");
//     console.log("1. Check if GEMINI_API_KEY is set in your .env file");
//     console.log("2. Verify the API key is valid and has proper permissions");
//     console.log("3. Ensure the Gemini API is enabled in Google Cloud Console");
//     console.log("4. Check your API quota and billing status");
//   }
// }

// testConnection();
