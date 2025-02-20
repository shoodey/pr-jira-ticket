// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        linterOptions: { reportUnusedDisableDirectives: true },
        languageOptions: { parserOptions: { projectService: true } },
    },
    {
        files: ["**/*.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                { prefer: "type-imports", fixStyle: "separate-type-imports" },
            ],
            "@typescript-eslint/no-misused-promises": [2, { checksVoidReturn: { attributes: false } }],
            "@typescript-eslint/no-unnecessary-condition": [
                "error",
                {
                    allowConstantLoopConditions: true,
                },
            ],
            "@typescript-eslint/no-non-null-assertion": "error",
            "no-console": ["error", { allow: ["error", "warn", "debug"] }],
        },
    },
);
