import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Existing app patterns (toasts, URL→state sync, mounted flags, etc.) conflict with
      // React Compiler–oriented rules from eslint-plugin-react-hooks v7.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      // Apostrophes in marketing copy are common; escaping hurts readability.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
