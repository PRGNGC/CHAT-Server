import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintReact from "eslint-plugin-react";
import eslintReactHooks from "eslint-plugin-react-hooks";
import eslintReactRefresh from "eslint-plugin-react-refresh";
import prettierPlugin from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintAirbnbConfig from "eslint-config-airbnb";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	...tseslint.configs.stylistic,
	...tseslint.configs.strict,
	{
		plugins: {
			"@typescript-eslint": tseslint.plugin,
			"react-hooks": eslintReactHooks,
			"react-refresh": eslintReactRefresh,
			react: eslintReact,
			prettier: prettierPlugin
		}
		// parserOptions: eslintReact.configs.recommended.parserOptions, // for js
	},
	{
		ignores: [
			"node_modules",
			"dist",
			".next",
			".vscode",
			"next.config.mjs",
			"commitlint.config.js",
			"next-env.d.ts",
			"eslint.config.js",
			"vite.config.ts"
		]
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				...globals.es2021
			},
			parser: tseslint.parser,
			parserOptions: {
				// project: ["tsconfig.json"]
				project: true
			}
		},
		rules: {
			"@typescript-eslint/no-unused-vars": "warn",
			...prettierPlugin.configs.recommended.rules,
			...eslintConfigPrettier.rules,
			...eslintAirbnbConfig.rules
		}
	},
	{
		files: ["src/**/*.{ts, tsx}"]
	}
);
