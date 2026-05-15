const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

exports.api = onCall(
  {
    secrets: [ANTHROPIC_API_KEY],
    enforceAppCheck: true, // 🔒 Blochează requesturi fără token valid
  },
  async (request) => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(request.data), // <-- onCall folosește request.data
      });

      const data = await response.json();
      return data; // <-- onCall returnează direct, fără res.json()
    } catch (err) {
      throw new HttpsError("internal", "Proxy error: " + err.message);
    }
  }
);