const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const PISTON_URL = "http://130.162.247.186:2000/api/v2/execute";

exports.api = onCall(
  {
    secrets: [ANTHROPIC_API_KEY],
    enforceAppCheck: true,
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
        body: JSON.stringify(request.data),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      throw new HttpsError("internal", "Proxy error: " + err.message);
    }
  }
);

exports.runCode = onCall(
  {
    enforceAppCheck: true,
  },
  async (request) => {
    const { code, testCases } = request.data || {};

    if (typeof code !== "string" || !code.trim()) {
      throw new HttpsError("invalid-argument", "Lipseste codul.");
    }
    if (!Array.isArray(testCases) || testCases.length === 0) {
      const { stdout, stderr } = await runCodeOnPiston(code, "");
      if (stderr) return { output: stderr, error: true };
      return { output: stdout, error: false };
    }
    if (testCases.length > 20) {
      throw new HttpsError("invalid-argument", "Prea multe cazuri de test.");
    }

    const normalize = (s) =>
      String(s || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.replace(/\s+$/, ""))
        .join("\n")
        .replace(/\n+$/, "");

    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i] || {};
      const stdin = typeof tc.stdin === "string" ? tc.stdin : "";
      const expected = typeof tc.expected === "string" ? tc.expected : "";

      let pistonData;
      try {
        const response = await fetch(PISTON_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: "python",
            version: "3.10.0",
            files: [{ content: code }],
            stdin: stdin,
            run_timeout: 3000,
          }),
        });
        pistonData = await response.json();
        console.log("PISTON RAW RESPONSE for test", i, ":", JSON.stringify(pistonData));
        console.log("PISTON .run object:", JSON.stringify(pistonData.run));
      } catch (err) {
        throw new HttpsError("internal", "Eroare la motorul de executie: " + err.message);
      }

      const run = pistonData.run || {};
      const stdout = run.stdout || "";
      const stderr = run.stderr || "";
      const runtimeError = stderr.trim().length > 0;

      const actual = normalize(stdout);
      const wanted = normalize(expected);
      const casePassed = !runtimeError && actual === wanted;

      results.push({
        index: i,
        stdin: stdin,
        expected: wanted,
        actual: actual,
        stderr: stderr.trim(),
        runtimeError: runtimeError,
        passed: casePassed,
      });
    }

    const allPassed = results.every((r) => r.passed);
    return { passed: allPassed, results: results };
  }
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function runCodeOnPiston(code, stdin) {
  const response = await fetch(PISTON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "python",
      version: "3.10.0",
      files: [{ content: code }],
      stdin: stdin,
      run_timeout: 3000,
    }),
  });
  const data = await response.json();
  const run = data.run || {};
  const stdout = String(run.stdout || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(l => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
  const stderr = (run.stderr || "").trim();
  return { stdout, stderr };
}

// ─── GENERATE DAILY CHALLENGE ─────────────────────────────────────────────────

exports.generateDaily = onCall(
  {
    secrets: [ANTHROPIC_API_KEY],
    enforceAppCheck: true,
  },
  async (request) => {
    const { rankIndex, type, date } = request.data || {};

    if (typeof rankIndex !== "number") {
      throw new HttpsError("invalid-argument", "Lipseste rankIndex.");
    }
    if (!type || !["python", "html", "css"].includes(type)) {
      throw new HttpsError("invalid-argument", "Tip invalid.");
    }
    if (!date || typeof date !== "string") {
      throw new HttpsError("invalid-argument", "Lipseste data.");
    }

    const ranks = ["E", "D", "C", "B", "A", "S", "National"];
    const rank = ranks[rankIndex] || "E";

    const pythonCategoryMap = {
      E: [
        "Read N numbers (one per line), print their sum.",
        "Read N numbers, print the maximum and minimum.",
        "Read a number N, print all numbers from 1 to N.",
        "Read two numbers, print their product and their difference on separate lines.",
        "Read N numbers, count how many are even and how many are odd, print both counts.",
        "Read a word and a number N, print the word repeated N times separated by spaces.",
        "Read N numbers, print their average rounded to 2 decimal places.",
        "Read a number, print whether it is positive, negative, or zero.",
      ],
      D: [
        "Read N numbers, print only those greater than the average.",
        "Read a string, print it reversed.",
        "Read N numbers, print them in ascending order using a manual bubble sort (no sorted()).",
        "Read a sentence, count and print the number of vowels.",
        "Read N numbers, print the second largest.",
        "Read a number, print all its divisors.",
        "Read a string, print how many times each unique character appears.",
        "Read N numbers, print the sum of only the positive ones.",
      ],
      C: [
        "Read a list of words, print them sorted by length (shortest first).",
        "Read a string, check if it is a palindrome and print Yes or No.",
        "Read N numbers, remove duplicates and print the unique ones in order.",
        "Read a sentence, print the most frequent word.",
        "Read a list of numbers, print all pairs that sum to a target value.",
        "Read a string, replace every vowel with * and print the result.",
        "Read N numbers, group them into even and odd lists and print both.",
        "Read a sentence, print each word with its first letter capitalized.",
      ],
      B: [
        "Read N numbers, find the longest increasing subsequence length.",
        "Read a list of words, group anagrams together and print each group.",
        "Read a matrix NxM, print the spiral order traversal.",
        "Read N numbers, find all triplets that sum to zero.",
        "Read a string, find the longest substring without repeating characters.",
        "Read a list of intervals, merge overlapping ones and print result.",
        "Read N numbers, find how many inversions exist in the array.",
        "Read a grid NxM of 0s and 1s, count the number of islands.",
      ],
      A: [
        "Read N, compute the Nth Fibonacci number using recursion.",
        "Read N, compute N factorial using recursion.",
        "Read a list, compute all permutations using recursion.",
        "Read a number, check if it is a perfect number using recursion.",
        "Read a binary tree as parent array, compute its height recursively.",
        "Read a list, implement binary search recursively and print the index.",
        "Read N, print all subsets of {1..N} using recursion.",
        "Read a string, generate all valid parentheses combinations of length N using recursion.",
      ],
      S: [
        "Read two strings, find the length of their longest common subsequence.",
        "Read N items with weights and values and a capacity W, solve 0/1 knapsack.",
        "Read a list of coin denominations and a target, find minimum coins needed.",
        "Read a string, find the longest palindromic subsequence length.",
        "Read N and a list of numbers, find the length of the longest increasing subsequence.",
        "Read a matrix NxN of costs, find minimum cost path from top-left to bottom-right.",
        "Read a string, find minimum edits (insert/delete/replace) to make it empty.",
        "Read two strings, find the shortest common supersequence length.",
      ],
      National: [
        "Read a graph as adjacency list, find shortest path between two nodes using BFS.",
        "Read a grid NxM of 0s and 1s (walls), find shortest path from top-left to bottom-right.",
        "Read a directed graph, detect if it has a cycle using DFS.",
        "Read a weighted graph, find the minimum spanning tree weight using Greedy.",
        "Read N nodes and edges, find all strongly connected components.",
        "Read a tree, find the diameter (longest path between any two nodes).",
        "Read a graph, find if it is bipartite using BFS coloring.",
        "Read N jobs with deadlines and profits, find maximum profit schedule.",
      ],
    };

    const themeMap = {
      python: {
        E: "a young apprentice learning magic spells in a mystical academy",
        D: "a blacksmith forging weapons in a medieval stronghold",
        C: "an explorer navigating through an ancient forest",
        B: "a knight defending a castle from invaders",
        A: "a wizard solving ancient puzzles in a dungeon",
        S: "a legendary hero facing the final trial of the realm",
        National: "The Architect testing the ultimate coder with a legendary challenge",
      },
      html: {
        E: "building the town notice board for a medieval village",
        D: "constructing the blueprint for a village tavern",
        C: "designing the royal palace announcement page",
        B: "creating the war council's battle strategy page",
        A: "architecting the kingdom's grand library",
        S: "building the legendary Hall of Champions",
        National: "constructing the ultimate monument of the realm",
      },
      css: {
        E: "painting simple decorations on the village walls",
        D: "enchanting the tavern signs with magical colors",
        C: "styling the royal court's ceremonial banners",
        B: "crafting the battle-worn armor's visual design",
        A: "weaving complex magical patterns into the wizard's robes",
        S: "creating the legendary visual effects of the realm's artifacts",
        National: "designing the ultimate aesthetic of the realm's capital",
      },
    };

    const theme = themeMap[type][rank] || themeMap[type]["E"];

    // Alegem categoria bazată pe dată — variație zilnică deterministă
    const categories = pythonCategoryMap[rank] || pythonCategoryMap["E"];
    const dayOfYear = Math.floor((new Date(date) - new Date(new Date(date).getFullYear(), 0, 0)) / 86400000);
    const categoryIndex = dayOfYear % categories.length;
    const chosenCategory = categories[categoryIndex];

    let prompt = "";

    if (type === "python") {
      prompt = `You are generating a Python daily challenge for a gamified learning platform with a fantasy RPG theme.

THEME: ${theme}
RANK: ${rank}
DATE: ${date}
PROBLEM CATEGORY: ${chosenCategory}

STRICT RULES:
1. Follow EXACTLY the category — do not add extra complexity
2. Input via input(), output via print()
3. Generate exactly 4 test cases — compute them manually, verify they are 100% correct
4. The solution must be correct Python that passes all 4 test cases
5. Include one worked example: "Example: input [X] → output [Y]"
6. Keep narrative short: 1 sentence theme + clear problem statement

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "max 5 word epic title",
  "description": "1 sentence theme narrative. Clear problem statement. Example: input X → output Y.",
  "hint": "one helpful hint",
  "solution": "complete correct Python solution",
  "testCases": [
    { "stdin": "...", "expected": "..." }
  ]
}`;

    } else if (type === "html") {
      prompt = `You are generating an HTML daily challenge for a gamified learning platform with a fantasy RPG theme.

THEME: ${theme}
RANK: ${rank}
DATE: ${date}

Generate a problem asking the student to write a specific HTML structure. Be very explicit about every required tag, attribute, and text content. Include the full expected HTML in the description as an example.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "max 5 word epic title",
  "description": "1 sentence theme narrative. Clear list of required HTML elements with exact attributes and text. Include full example HTML.",
  "hint": "one helpful hint",
  "solution": "complete correct HTML solution",
  "testCases": []
}`;

    } else {
      prompt = `You are generating a CSS daily challenge for a gamified learning platform with a fantasy RPG theme.

THEME: ${theme}
RANK: ${rank}
DATE: ${date}

Generate a problem asking the student to write specific CSS rules for a given HTML structure. Be very explicit about required selectors, properties and values.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "max 5 word epic title",
  "description": "1 sentence theme narrative. Clear list of required CSS rules with exact selectors and properties. Include example CSS.",
  "hint": "one helpful hint",
  "solution": "complete correct CSS solution",
  "testCases": []
}`;
    }

    const MAX_ATTEMPTS = 3;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY.value(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();
        const text = data.content[0].text.trim();

        let problem;
        try {
          problem = JSON.parse(text);
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) problem = JSON.parse(match[0]);
          else { console.warn(`Attempt ${attempt + 1}: invalid JSON`); continue; }
        }

        if (!problem.title || !problem.description || !problem.solution) {
          console.warn(`Attempt ${attempt + 1}: incomplete JSON`);
          continue;
        }

        // Validare Piston doar pentru Python
        if (type === "python" && problem.testCases && problem.testCases.length > 0) {
          let allPassed = true;
          for (const tc of problem.testCases) {
            const { stdout, stderr } = await runCodeOnPiston(problem.solution, tc.stdin || "");
            if (stderr || stdout !== tc.expected) {
              console.warn(`Attempt ${attempt + 1}: failed. Expected "${tc.expected}", got "${stdout}", stderr: "${stderr}"`);
              allPassed = false;
              break;
            }
          }
          if (!allPassed) continue;
        }

        const { solution, ...problemWithoutSolution } = problem;
        return { problem: problemWithoutSolution, cached: false };

      } catch (err) {
        console.warn(`Attempt ${attempt + 1} error:`, err.message);
        if (attempt === MAX_ATTEMPTS - 1) {
          throw new HttpsError("internal", "Nu s-a putut genera o problemă validă după 3 încercări.");
        }
      }
    }

    throw new HttpsError("internal", "Nu s-a putut genera o problemă validă.");
  }
);

// ─── GENERATE DUEL PROBLEM ────────────────────────────────────────────────────

exports.generateDuelProblem = onCall(
  {
    secrets: [ANTHROPIC_API_KEY],
    enforceAppCheck: true,
  },
  async (request) => {
    const { rankIndex } = request.data || {};

    if (typeof rankIndex !== "number") {
      throw new HttpsError("invalid-argument", "Lipseste rankIndex.");
    }

    const ranks = ["E", "D", "C", "B", "A", "S", "National"];
    const rank = ranks[Math.min(rankIndex, ranks.length - 1)];

    const pythonCategoryMap = {
      E: [
        "Read N numbers (one per line), print their sum.",
        "Read N numbers, print the maximum and minimum.",
        "Read a number N, print all numbers from 1 to N.",
        "Read two numbers, print their product and their difference on separate lines.",
        "Read N numbers, count how many are even and how many are odd, print both counts.",
        "Read a word and a number N, print the word repeated N times separated by spaces.",
        "Read N numbers, print their average rounded to 2 decimal places.",
        "Read a number, print whether it is positive, negative, or zero.",
      ],
      D: [
        "Read N numbers, print only those greater than the average.",
        "Read a string, print it reversed.",
        "Read N numbers, print them in ascending order using a manual bubble sort (no sorted()).",
        "Read a sentence, count and print the number of vowels.",
        "Read N numbers, print the second largest.",
        "Read a number, print all its divisors.",
        "Read a string, print how many times each unique character appears.",
        "Read N numbers, print the sum of only the positive ones.",
      ],
      C: [
        "Read a list of words, print them sorted by length (shortest first).",
        "Read a string, check if it is a palindrome and print Yes or No.",
        "Read N numbers, remove duplicates and print the unique ones in order.",
        "Read a sentence, print the most frequent word.",
        "Read a list of numbers, print all pairs that sum to a target value.",
        "Read a string, replace every vowel with * and print the result.",
        "Read N numbers, group them into even and odd lists and print both.",
        "Read a sentence, print each word with its first letter capitalized.",
      ],
      B: [
        "Read N numbers, find the longest increasing subsequence length.",
        "Read a list of words, group anagrams together and print each group.",
        "Read a matrix NxM, print the spiral order traversal.",
        "Read N numbers, find all triplets that sum to zero.",
        "Read a string, find the longest substring without repeating characters.",
        "Read a list of intervals, merge overlapping ones and print result.",
        "Read N numbers, find how many inversions exist in the array.",
        "Read a grid NxM of 0s and 1s, count the number of islands.",
      ],
      A: [
        "Read N, compute the Nth Fibonacci number using recursion.",
        "Read N, compute N factorial using recursion.",
        "Read a list, compute all permutations using recursion.",
        "Read a number, check if it is a perfect number using recursion.",
        "Read a binary tree as parent array, compute its height recursively.",
        "Read a list, implement binary search recursively and print the index.",
        "Read N, print all subsets of {1..N} using recursion.",
        "Read a string, generate all valid parentheses combinations of length N using recursion.",
      ],
      S: [
        "Read two strings, find the length of their longest common subsequence.",
        "Read N items with weights and values and a capacity W, solve 0/1 knapsack.",
        "Read a list of coin denominations and a target, find minimum coins needed.",
        "Read a string, find the longest palindromic subsequence length.",
        "Read N and a list of numbers, find the length of the longest increasing subsequence.",
        "Read a matrix NxN of costs, find minimum cost path from top-left to bottom-right.",
        "Read a string, find minimum edits (insert/delete/replace) to make it empty.",
        "Read two strings, find the shortest common supersequence length.",
      ],
      National: [
        "Read a graph as adjacency list, find shortest path between two nodes using BFS.",
        "Read a grid NxM of 0s and 1s (walls), find shortest path from top-left to bottom-right.",
        "Read a directed graph, detect if it has a cycle using DFS.",
        "Read a weighted graph, find the minimum spanning tree weight using Greedy.",
        "Read N nodes and edges, find all strongly connected components.",
        "Read a tree, find the diameter (longest path between any two nodes).",
        "Read a graph, find if it is bipartite using BFS coloring.",
        "Read N jobs with deadlines and profits, find maximum profit schedule.",
      ],
    };

    const themeMap = {
      E: "two apprentices competing in a magical academy duel",
      D: "two blacksmiths racing to forge the strongest weapon",
      C: "two explorers competing to solve an ancient forest riddle",
      B: "two knights battling through a coding gauntlet",
      A: "two wizards locked in a spell-coding showdown",
      S: "two legendary heroes facing the ultimate trial",
      National: "two champions competing for the title of The Architect",
    };

    const categories = pythonCategoryMap[rank];
    const chosenCategory = categories[Math.floor(Math.random() * categories.length)];
    const theme = themeMap[rank];

    const prompt = `You are generating a Python duel challenge for a competitive coding platform with a fantasy RPG theme.

THEME: ${theme}
RANK: ${rank}
PROBLEM CATEGORY: ${chosenCategory}

STRICT RULES:
1. Follow EXACTLY the category — do not add extra complexity
2. Input via input(), output via print()
3. Generate exactly 4 test cases — compute them manually, verify they are 100% correct
4. The solution must be correct Python that passes all 4 test cases
5. Include one worked example: "Example: input [X] → output [Y]"
6. Keep narrative short: 1 sentence theme + clear problem statement

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "max 5 word epic title",
  "description": "1 sentence theme narrative. Clear problem statement. Example: input X → output Y.",
  "hint": "one helpful hint",
  "solution": "complete correct Python solution",
  "testCases": [
    { "stdin": "...", "expected": "..." }
  ]
}`;

    const MAX_ATTEMPTS = 3;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY.value(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();
        const text = data.content[0].text.trim();

        let problem;
        try {
          problem = JSON.parse(text);
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) problem = JSON.parse(match[0]);
          else { console.warn(`Attempt ${attempt + 1}: invalid JSON`); continue; }
        }

        if (!problem.title || !problem.description || !problem.solution) {
          console.warn(`Attempt ${attempt + 1}: incomplete JSON`);
          continue;
        }

        // Validare Piston
        if (problem.testCases && problem.testCases.length > 0) {
          let allPassed = true;
          for (const tc of problem.testCases) {
            const { stdout, stderr } = await runCodeOnPiston(problem.solution, tc.stdin || "");
            if (stderr || stdout !== tc.expected) {
              console.warn(`Attempt ${attempt + 1}: failed. Expected "${tc.expected}", got "${stdout}", stderr: "${stderr}"`);
              allPassed = false;
              break;
            }
          }
          if (!allPassed) continue;
        }

        const { solution, ...problemWithoutSolution } = problem;
        return { problem: problemWithoutSolution };

      } catch (err) {
        console.warn(`Attempt ${attempt + 1} error:`, err.message);
        if (attempt === MAX_ATTEMPTS - 1) {
          throw new HttpsError("internal", "Could not generate a valid duel problem after 3 attempts.");
        }
      }
    }

    throw new HttpsError("internal", "Could not generate a valid duel problem.");
  }
);