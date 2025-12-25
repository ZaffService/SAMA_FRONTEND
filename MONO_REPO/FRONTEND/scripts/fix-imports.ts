import { promises as fs } from "fs";
import { join, relative } from "path";

const DIRECTORIES_TO_FIX = [
  "app",
  "src/ui",
  "src/infrastructure",
  "src/shared",
];

const REPLACEMENTS = [
  {
    from: "@/ui/organisms/",
    to: "@/ui/organisms/",
  },
  {
    from: "@/ui/molecules/",
    to: "@/ui/molecules/",
  },
  {
    from: "@/ui/atoms/",
    to: "./",
  },
  {
    from: "@/application/use-cases/",
    to: "@/application/use-cases/",
  },
  {
    from: "@/infrastructure/api/",
    to: "@/infrastructure/api/",
  },
  {
    from: "@/infrastructure/storage/",
    to: "@/infrastructure/storage/",
  },
  {
    from: "@/domain/entities/",
    to: "@/domain/entities/",
  },
  {
    from: "@/domain/rules/",
    to: "@/domain/rules/",
  },
  {
    from: "@/shared/helpers/",
    to: "@/shared/helpers/",
  },
  {
    from: "@/shared/types/",
    to: "@/shared/types/",
  },
  {
    from: "@/shared/constants/",
    to: "@/shared/constants/",
  },
  {
    from: "@/styles/",
    to: "../styles/",
  },
  // Nouveaux patterns pour corriger les imports restants
  {
    from: "@/shared/helpers/",
    to: "./",
  },
  {
    from: "@/ui/atoms/",
    to: "./",
  },
  {
    from: "@/domain/entities/",
    to: "../domain/entities/",
  },
  {
    from: "@/ui/",
    to: "./",
  },
];

async function fixFileImports(filePath: string): Promise<void> {
  try {
    let content = await fs.readFile(filePath, "utf-8");
    let modified = false;

    for (const replacement of REPLACEMENTS) {
      if (content.includes(replacement.from)) {
        content = content.replace(
          new RegExp(replacement.from, "g"),
          replacement.to,
        );
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, "utf-8");
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          await processDirectory(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
        await fixFileImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

async function main() {
  console.log("Starting import fixes...");

  for (const dir of DIRECTORIES_TO_FIX) {
    console.log(`Processing directory: ${dir}`);
    await processDirectory(dir);
  }

  console.log("Import fixes completed!");
}

main().catch(console.error);
