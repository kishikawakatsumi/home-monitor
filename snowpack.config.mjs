export default {
  exclude: [
    "**/.github/**/*",
    "**/node_modules/**/*",
    "**/package.json",
    "**/package-lock.json",
    "**/README.md",
  ],
  plugins: ["@snowpack/plugin-dotenv"],
};
