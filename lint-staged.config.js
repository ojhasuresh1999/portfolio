/**
 * Lint-Staged Configuration
 * Runs linters and formatters on staged files before commit
 * @see https://github.com/lint-staged/lint-staged
 */
module.exports = {
  // TypeScript and JavaScript files
  "*.{js,jsx,ts,tsx}": (filenames) => {
    const files = filenames.join(" ");
    return [`eslint --fix ${files}`, `prettier --write ${files}`];
  },

  // JSON files (config files, etc.)
  "*.json": ["prettier --write"],

  // Markdown files
  "*.md": ["prettier --write"],

  // YAML files (GitHub Actions, Docker Compose, etc.)
  "*.{yml,yaml}": ["prettier --write"],

  // CSS and styling files
  "*.{css,scss,less}": ["prettier --write"],

  // Package.json - Check for duplicate dependencies
  "package.json": (filenames) => {
    return [`npx sort-package-json ${filenames.join(" ")}`];
  },
};
