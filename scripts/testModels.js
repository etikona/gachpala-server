// // backend/scripts/testModels.js
// import { listAvailableModels } from "../utils/geminiDiscovery.js";

// async function testModels() {
//   try {
//     console.log("Testing Gemini API connection...");
//     const models = await listAvailableModels();

//     if (models && models.length > 0) {
//       console.log("\n✅ Success! Found models:");
//       models.forEach((model) => {
//         console.log(`  - ${model.name}`);
//         if (model.supportedGenerationMethods) {
//           console.log(
//             `    Methods: ${model.supportedGenerationMethods.join(", ")}`
//           );
//         }
//       });
//     } else {
//       console.log("❌ No models found or API key might be invalid");
//     }
//   } catch (error) {
//     console.error("❌ Error testing models:", error.message);

//     // Check if it's an authentication error
//     if (
//       error.message.includes("403") ||
//       error.message.includes("permission") ||
//       error.message.includes("authentication")
//     ) {
//       console.log("\n🔑 This might be an API key issue. Please check:");
//       console.log("1. Your Gemini API key is correct");
//       console.log("2. The API key has proper permissions");
//       console.log("3. You've enabled the Gemini API in Google Cloud Console");
//     }
//   }
// }

// testModels();
