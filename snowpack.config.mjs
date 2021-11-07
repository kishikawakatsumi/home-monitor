export default {
  exclude: [
    "**/node_modules/**/*",
    "**/.github/**/*",
    "**/package.json",
    "**/package-lock.json",
  ],
  plugins: ["@snowpack/plugin-dotenv"],
};
