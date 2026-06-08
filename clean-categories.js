import fs from "fs";

try {
  let content = fs.readFileSync("src/App.tsx", "utf8");
  
  // 1. Repair categories
  content = content.replace(/\{ id: "accessories", name: "لوازم[\s\S]*?const CATEGORY_SPEC_LABELS/, `{ id: "accessories", name: "لوازم جانبی دیجیتال" },
  { id: "wearables", name: "ساعت هوشمند و گجت" }
];

const CATEGORY_SPEC_LABELS`);

  // 2. Strip any git-diff like leading '+' from lines
  const lines = content.split("\n");
  let repairedCount = 0;
  const cleanedLines = lines.map((line) => {
    if (line.startsWith("+")) {
      repairedCount++;
      return line.substring(1); // strip the first character, which is '+'
    }
    return line;
  });
  content = cleanedLines.join("\n");
  
  fs.writeFileSync("src/App.tsx", content, "utf8");
  console.log(`Successfully repaired App.tsx categories and stripped ${repairedCount} stray '+' prefixes!`);
} catch (err) {
  console.error("Error repairing App.tsx:", err);
}
