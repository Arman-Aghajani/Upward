const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

// Cheia API este stocată ca secret în Firebase, nu în cod
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

exports.api = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    cors: true,
  },
  async (req, res) => {
    // Permite OPTIONS pentru CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    try {
      // Trimite request la Anthropic API cu cheia secretă
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.set("Access-Control-Allow-Origin", "*");
      res.status(response.status).json(data);
    } catch (err) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(500).json({error: "Proxy error: " + err.message});
    }
  }
);