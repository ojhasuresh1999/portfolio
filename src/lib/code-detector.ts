/**
 * Automatically detects code blocks in raw text and formats them as markdown code snippets
 * with correct language tags.
 */

// Heuristics for language detection
interface LanguageRule {
  name: string;
  keywords: string[];
  regexes: RegExp[];
  weight: number;
}

const LANGUAGE_RULES: LanguageRule[] = [
  {
    name: "javascript",
    keywords: [
      "const ",
      "let ",
      "var ",
      "console.log",
      "typeof ",
      "instanceof ",
      "=>",
      "=== ",
      "!== ",
      "useEffect",
      "useState",
      "require(",
      "module.exports",
      "npm install",
      "yarn add",
      "pnpm add",
    ],
    regexes: [
      /const\s+\w+\s*=\s*/g,
      /let\s+\w+\s*=\s*/g,
      /function\s+\w+\s*\(/g,
      /console\.log\(/g,
      /import\s+.*\s+from\s+['"].*['"]/g,
      /export\s+(const|let|default|function|class)/g,
      /arrow function: \w+\s*=\s*\(.*\)\s*=>/g,
    ],
    weight: 1.5,
  },
  {
    name: "typescript",
    keywords: [
      "interface ",
      "type ",
      "as ",
      "readonly ",
      "private ",
      "public ",
      "protected ",
      "implements ",
      "declare ",
      "namespace ",
      "keyof ",
      "any",
      "unknown",
    ],
    regexes: [
      /interface\s+\w+\s*\{/g,
      /type\s+\w+\s*=\s*/g,
      /as\s+(string|number|boolean|any|unknown)/g,
      /:\s*(string|number|boolean|any|void|unknown|never)[\s;=]/g,
      /function\s+\w+\s*<.*>\(/g,
    ],
    weight: 2.0,
  },
  {
    name: "python",
    keywords: [
      "def ",
      "elif ",
      "self.",
      "import ",
      "from ",
      "print(",
      "if __name__ ==",
      "lambda ",
      "None",
      "True",
      "False",
      "pass",
      "try:",
      "except:",
      "except ",
    ],
    regexes: [
      /def\s+\w+\s*\(.*\):/g,
      /class\s+\w+(\(.*\))?:/g,
      /for\s+\w+\s+in\s+range\(/g,
      /if\s+.*:\s*$/gm,
      /elif\s+.*:\s*$/gm,
      /except\s+\w+(\s+as\s+\w+)?:/g,
    ],
    weight: 2.0,
  },
  {
    name: "html",
    keywords: [
      "<!DOCTYPE",
      "<html>",
      "</html>",
      "<head>",
      "<body>",
      "<div>",
      "<span>",
      "<p>",
      "<a>",
      "<img>",
      "href=",
      "src=",
      "class=",
      "id=",
      "</",
      "/>",
      "<!--",
      "-->",
    ],
    regexes: [
      /<\/?(div|span|p|a|img|h1|h2|h3|h4|h5|h6|ul|ol|li|section|header|footer|nav|meta|link|button|input|textarea|select|option|form)[^>]*>/g,
      /class=["'][\w\s-]+["']/g,
      /id=["'][\w-]+["']/g,
      /style=["'][^"']*["']/g,
    ],
    weight: 2.5,
  },
  {
    name: "css",
    keywords: [
      "margin:",
      "padding:",
      "color:",
      "background:",
      "display:",
      "position:",
      "flex:",
      "grid:",
      "font-size:",
      "border:",
      "width:",
      "height:",
      "@media",
      "@keyframes",
      "box-shadow:",
      "align-items:",
      "justify-content:",
      "text-align:",
      "border-radius:",
    ],
    regexes: [
      /[\.#\w-]+\s*\{\s*[^}]+\}/g,
      /:\s*(block|inline-block|flex|grid|absolute|relative|fixed|none|inherit)\s*;/g,
      /padding-\w+:/g,
      /margin-\w+:/g,
    ],
    weight: 2.5,
  },
  {
    name: "sql",
    keywords: [
      "SELECT ",
      "FROM ",
      "WHERE ",
      "INSERT INTO ",
      "UPDATE ",
      "DELETE FROM",
      "INNER JOIN",
      "LEFT JOIN",
      "CREATE TABLE",
      "PRIMARY KEY",
      "FOREIGN KEY",
      "select ",
      "from ",
      "where ",
      "insert into ",
    ],
    regexes: [
      /SELECT\s+.*\s+FROM\s+/gi,
      /INSERT\s+INTO\s+\w+/gi,
      /CREATE\s+TABLE\s+\w+/gi,
      /UPDATE\s+\w+\s+SET\s+/gi,
    ],
    weight: 2.0,
  },
  {
    name: "rust",
    keywords: [
      "fn ",
      "let mut ",
      "pub ",
      "struct ",
      "impl ",
      "println!",
      "match ",
      "Option<",
      "Result<",
    ],
    regexes: [
      /fn\s+\w+\s*\(.*\)\s*(->\s*\w+)?\s*\{/g,
      /impl(\s+\w+)?\s+for\s+\w+/g,
      /let\s+mut\s+\w+/g,
      /println!\s*\(/g,
    ],
    weight: 2.5,
  },
  {
    name: "go",
    keywords: [
      "package ",
      "import (",
      "func ",
      "err != nil",
      "go ",
      "chan ",
      "struct {",
      "interface {",
    ],
    regexes: [
      /package\s+\w+/g,
      /func\s+\w+\s*\(.*\)\s*\{/g,
      /func\s*\(.*\)\s*\w+\s*\(.*\)\s*\{/g,
      /if\s+err\s*!=\s*nil\s*\{/g,
    ],
    weight: 2.5,
  },
  {
    name: "bash",
    keywords: [
      "npm install",
      "pnpm dev",
      "yarn dev",
      "npm run",
      "git clone",
      "git commit",
      "docker run",
      "docker-compose",
      "pip install",
      "cargo build",
      "chmod +x",
      "curl ",
      "wget ",
      "sudo apt-get",
    ],
    regexes: [
      /^\$\s+\w+/gm,
      /npm\s+install\s+/g,
      /pnpm\s+(install|dev|build)/g,
      /docker\s+run\s+/g,
      /git\s+(clone|commit|push|pull|checkout)/g,
    ],
    weight: 2.0,
  },
];

// Helper to determine if a string looks like code
export function detectBlockInfo(block: string): {
  isCode: boolean;
  language: string;
  score: number;
} {
  // If it's already a markdown code block, we ignore/keep it as code
  if (block.trim().startsWith("```") && block.trim().endsWith("```")) {
    const lines = block.trim().split("\n");
    const lang = lines[0].replace("```", "").trim();
    return { isCode: true, language: lang || "plaintext", score: 100 };
  }

  // If it's empty, not code
  if (!block.trim()) {
    return { isCode: false, language: "", score: 0 };
  }

  let highestScore = 0;
  let detectedLang = "plaintext";

  // Calculate score for each language
  for (const rule of LANGUAGE_RULES) {
    let score = 0;

    // Check keywords
    for (const keyword of rule.keywords) {
      const occurrences = (
        block.match(
          new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        ) || []
      ).length;
      score += occurrences * 1.5;
    }

    // Check regexes
    for (const regex of rule.regexes) {
      const occurrences = (block.match(regex) || []).length;
      score += occurrences * 3.0;
    }

    score = score * rule.weight;

    if (score > highestScore) {
      highestScore = score;
      detectedLang = rule.name;
    }
  }

  // Count code-like symbols: ;, {, }, =>, ===, &&, ||, ++, --, tabs/indents
  let symbolScore = 0;
  const lines = block.split("\n");
  let indentedLines = 0;
  let semicolonLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.endsWith(";")) semicolonLines++;
    if (line.startsWith("    ") || line.startsWith("\t")) indentedLines++;

    if (trimmed.includes("{") || trimmed.includes("}")) symbolScore += 0.5;
    if (trimmed.includes("=>")) symbolScore += 1.0;
    if (trimmed.includes("===") || trimmed.includes("!==")) symbolScore += 1.0;
    if (trimmed.includes("&&") || trimmed.includes("||")) symbolScore += 0.8;
  }

  const symbolRatio =
    (semicolonLines + indentedLines) / lines.filter((l) => l.trim()).length;
  if (symbolRatio > 0.4) {
    symbolScore += 5.0;
  }

  // Final code score
  const totalCodeScore = highestScore + symbolScore;

  // Prose features
  let proseScore = 0;
  const commonWords =
    /\b(the|and|of|to|a|is|that|for|on|with|as|this|it|we|you|i|he|she|they|have|has|had|was|were|been)\b/gi;
  const wordCount = (block.match(/\b\w+\b/g) || []).length;
  const commonWordCount = (block.match(commonWords) || []).length;
  const wordDensity = wordCount > 0 ? commonWordCount / wordCount : 0;

  if (wordDensity > 0.15) {
    proseScore += wordDensity * 20.0;
  }

  const sentences = (block.match(/[A-Z][^.!?]*[.!?]/g) || []).length;
  proseScore += sentences * 2.0;

  if (wordCount < 10 && symbolScore < 2) {
    proseScore += 5.0;
  }

  const isCode = totalCodeScore > 4.5 && totalCodeScore > proseScore;

  return {
    isCode,
    language: isCode ? detectedLang : "",
    score: totalCodeScore,
  };
}

export function autoDetectCodeBlocks(content: string): string {
  if (!content) return "";

  const rawBlocks: string[] = [];
  let currentBlock = "";
  let inFencedBlock = false;

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inFencedBlock) {
        currentBlock += "\n" + line;
        rawBlocks.push(currentBlock);
        currentBlock = "";
        inFencedBlock = false;
      } else {
        if (currentBlock.trim()) {
          rawBlocks.push(currentBlock.trim());
        }
        currentBlock = line;
        inFencedBlock = true;
      }
    } else if (inFencedBlock) {
      currentBlock += "\n" + line;
    } else {
      if (line.trim() === "") {
        if (currentBlock.trim()) {
          rawBlocks.push(currentBlock.trim());
          currentBlock = "";
        }
      } else {
        if (currentBlock) {
          currentBlock += "\n" + line;
        } else {
          currentBlock = line;
        }
      }
    }
  }

  if (currentBlock.trim()) {
    rawBlocks.push(currentBlock.trim());
  }

  // Classify each block
  const classifiedBlocks = rawBlocks.map((block) => {
    if (block.startsWith("```") && block.endsWith("```")) {
      return {
        type: "fenced-code" as const,
        content: block,
        language: "",
      };
    }

    const info = detectBlockInfo(block);
    if (info.isCode) {
      return {
        type: "code" as const,
        content: block,
        language: info.language,
      };
    } else {
      return {
        type: "text" as const,
        content: block,
        language: "",
      };
    }
  });

  // Merge adjacent code blocks of the same language
  const mergedBlocks: typeof classifiedBlocks = [];
  for (let i = 0; i < classifiedBlocks.length; i++) {
    const current = classifiedBlocks[i];
    if (current.type === "code") {
      let j = i + 1;
      let mergedContent = current.content;
      while (
        j < classifiedBlocks.length &&
        classifiedBlocks[j].type === "code" &&
        classifiedBlocks[j].language === current.language
      ) {
        mergedContent += "\n\n" + classifiedBlocks[j].content;
        j++;
      }
      mergedBlocks.push({
        type: "code",
        content: mergedContent,
        language: current.language,
      });
      i = j - 1;
    } else {
      mergedBlocks.push(current);
    }
  }

  // Format the blocks back into a single string
  const formattedBlocks = mergedBlocks.map((block) => {
    if (block.type === "code") {
      return `\`\`\`${block.language}\n${block.content}\n\`\`\``;
    }
    return block.content;
  });

  return formattedBlocks.join("\n\n");
}
