import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactJsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js';
import reactHooks from "eslint-plugin-react-hooks";
import globals from 'globals'

let result = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactRecommended,
  reactJsxRuntime,
  {
	plugins: {
		"react-hooks": reactHooks,
	},
	settings: {
		react: {
			version: "detect"
		}
	},
	files: ['**/*.{ts,tsx}'],
	languageOptions: {
      parserOptions: {
		project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
	ignores: [
		"**/js/**",
		"node_modules",
		"**/node_modules/**",
		"**/generated/**",
		"build",
		"eslint.config.cjs"
	],
	rules: {
		// const have its uses, but not EVERYTHING should be const
		"prefer-const": "warn",

		// rule for newbies; namespaces has their uses
		"@typescript-eslint/no-namespace": "off",

		// that's also for namespaces
		"no-inner-declarations": "off",

		// you shouldn't use it too much, but there are situations where you are 100% sure that it's not null
		// for example, array iteration by index
		"@typescript-eslint/no-non-null-assertion": "off",

		// that's for while(true)
		"no-constant-condition": ["error", {checkLoops: false}],

		// I'm not stupid. If something is typed as any - it should be any
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-floating-promises": "error",
		"@typescript-eslint/no-misused-promises": ["error", { "checksVoidReturn": false }],


		/* codestyle rules; disabled rules may be overriden by typescript rules */
		indent: "off",
		eqeqeq: ["warn", "always"],
		curly: ["warn", "all"],
		semi: "off",
		"no-floating-decimal": ["warn"],
		"no-lonely-if": ["warn"],
		"no-useless-rename": ["warn"],
		// it's useful, I'm just furious when it's getting autocorrected mid-thought process, hence it's off
		"no-useless-return": ["off"],
		"quote-props": ["warn", "as-needed", {numbers: true}],
		"spaced-comment": ["warn", "always", { "markers": ["/"]}],
		yoda: ["warn", "never"],
		"array-bracket-newline": ["warn", "consistent"],
		"array-bracket-spacing": ["warn", "never"],
		"array-element-newline": ["warn", "consistent"],
		"arrow-parens": ["warn", "as-needed"],
		"arrow-spacing": ["warn", {before: true, after: true}],
		"brace-style": "off",
		"comma-dangle": "off",
		"comma-spacing": "off",
		"comma-style": ["warn", "last"],
		"computed-property-spacing": ["warn", "never"],
		"dot-location": ["warn", "property"],
		"func-call-spacing": "off",
		"generator-star-spacing": ["warn", {before: false, after: true}],
		"key-spacing": ["warn", {
			beforeColon: false,
			afterColon: true,
			mode: "strict"
		}],
		"keyword-spacing": "off",
		"linebreak-style": ["warn", "unix"],
		"new-parens": ["warn", "always"],
		"no-multi-spaces": ["warn"],
		"no-trailing-spaces": ["warn"],
		"no-whitespace-before-property": ["warn"],
		"object-curly-newline": ["warn", {
			ImportDeclaration: "never",
			ExportDeclaration: "never",
			ObjectPattern: {multiline: true, consistent: true, minProperties: 4},
			ObjectExpression: {multiline: true, consistent: true, minProperties: 4},
	}],
		"object-curly-spacing": "off",
		"operator-linebreak": ["warn", "before"],
		quotes: "off",
		"rest-spread-spacing": ["warn", "never"],
		"space-before-blocks": ["warn", {
			functions: "always",
			keywords: "never",
			classes: "always"
		}],
		"space-before-function-paren": "off",
		"space-in-parens": ["warn", "never"],
		"space-infix-ops": "off",
		"space-unary-ops": ["warn", {words: false, nonwords: false}],
		// conflicts with space-before-blocks
		// for example, `case 5: {}` - space should and should not be there at the same time
		"switch-colon-spacing": "off",
		"template-curly-spacing": ["warn", "never"],
		"template-tag-spacing": ["warn", "never"],
		"unicode-bom": ["warn", "never"],
		"yield-star-spacing": ["warn", "after"],

		"@typescript-eslint/func-call-spacing": ["warn", "never"],
		"@typescript-eslint/member-delimiter-style": ["warn", {
			multiline: {delimiter: "none"},
			singleline: {delimiter: "comma", requireLast: false}
		}],
		"@typescript-eslint/method-signature-style": "off",
		"@typescript-eslint/no-confusing-non-null-assertion": ["warn"],
		"@typescript-eslint/type-annotation-spacing": ["warn"],
		"@typescript-eslint/brace-style": ["warn", "1tbs"],
		"@typescript-eslint/comma-dangle": ["warn", "never"],
		"@typescript-eslint/comma-spacing": ["warn", {before: false, after: true}],
		"@typescript-eslint/indent": ["warn", "tab"],
		"@typescript-eslint/keyword-spacing": ["warn", {
			overrides: {
				if: {after: false},
				for: {after: false},
				while: {after: false},
				catch: {after: false},
				switch: {after: false},
				yield: {after: false}
				// ...more here?
			}
		}],
		"@typescript-eslint/object-curly-spacing": ["warn", "never"],
		"@typescript-eslint/quotes": ["warn", "double"],
		"@typescript-eslint/semi": ["warn", "never"],
		"@typescript-eslint/space-before-function-paren": ["warn", "never"],
		"@typescript-eslint/space-infix-ops": ["warn"],

		"react/boolean-prop-naming": ["warn", {rule: "^(value|(is|has|can|are)[A-Z]([A-Za-z0-9]?)+)"}],
		"react/button-has-type": ["error"],
		"react/checked-requires-onchange-or-readonly": ["error"],
		"react/forbid-component-props": ["off"],
		// it's good for consistency, but you can't declare components with generic type arguments with arrow function
		"react/function-component-definition": ["off", {
			"namedComponents": "arrow-function",
			"unnamedComponents": "arrow-function"
		}],
		// it's too stupid for my boolean naming convention: [isSmth, setSmth]
		"react/hook-use-state": ["off"],
		"react/iframe-missing-sandbox": ["error"],
		"react/jsx-boolean-value": ["warn"],
		"react/jsx-child-element-spacing": ["warn"],
		"react/jsx-closing-bracket-location": ["warn", {
			"nonEmpty": "after-props",
			"selfClosing": "line-aligned"
		}],
		// it's too stupid for cases like `cond && <div>\ntext\n</div>`
		"react/jsx-closing-tag-location": ["off"],
		"react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
		"react/jsx-curly-newline": ["warn"],
		"react/jsx-curly-spacing": ["warn"],
		"react/jsx-equals-spacing": ["warn"],
		"react/jsx-filename-extension": ["warn", {extensions: [".tsx", ".jsx"]}],
		"react/jsx-first-prop-new-line": ["warn"],
		// sometimes you may want to use React.Fragment to pass key
		// but most of the time it's just <></>
		"react/jsx-fragments": ["off"],
		// good rule in theory, but it was triggering on onClick={onClick} and I couldn't make it stop
		"react/jsx-handler-names": ["off"],
		"react/jsx-indent-props": ["warn", "tab"],
		"react/jsx-indent": ["warn", "tab"],
		"react/jsx-key": ["error"],
		"react/jsx-max-depth": ["warn", {max: 10}],
		"react/jsx-max-props-per-line": ["warn", { "maximum": { "single": 3, "multi": 1 } }],
		// purely stylistic preference, I'm okay with either
		"react/jsx-newline": ["off"],
		// it was probably relevant back in the days of class components
		"react/jsx-no-bind": ["off"],
		"react/jsx-no-comment-textnodes": ["warn"],
		// maybe I'll enable it later. too vague, not sure if I need it
		"react/jsx-no-constructed-context-values": ["off"],
		"react/jsx-no-duplicate-props": ["error"],
		// useful in theory, but with TS we can guarantee that something is a boolean; and this rule will still trigger on that, which is irritating
		"react/jsx-no-leaked-render": ["off"],
		// why would I want it
		"react/jsx-no-literals": ["off"],
		// not sure why anyone would use script-urls in our times, but sure, let's just forbid them
		"react/jsx-no-script-url": ["error"],
		"react/jsx-no-target-blank": ["error"],
		"react/jsx-no-undef": ["error"],
		// wonder if this one will get on my nerves too much
		"react/jsx-no-useless-fragment": ["warn"],
		"react/jsx-one-expression-per-line": ["warn", {allow: "non-jsx"}],
		"react/jsx-pascal-case": ["warn"],
		"react/jsx-props-no-multi-spaces": ["warn"],
		// it seems okay to disable it for now. maybe I'll reconsider once I see any problems with it
		"react/jsx-props-no-spreading": ["off"],
		// ew, non-typescript rule
		"react/jsx-sort-default-props": ["off"],
		// usually I sort my props in some logical order
		"react/jsx-sort-props": ["off"],
		"react/jsx-tag-spacing": ["warn", {
			"closingSlash": "never",
			"beforeSelfClosing": "never",
			"afterOpening": "never",
			"beforeClosing": "never"
		}],
		// wonder how many times I'll return to this rule to adjust the config
		"react/jsx-wrap-multilines": ["warn", {
			"declaration": "parens-new-line",
			"assignment": "parens-new-line",
			"return": "parens-new-line",
			"arrow": "parens-new-line",
			"condition": "ignore",
			"logical": "ignore",
			"prop": "ignore"
		}],
		// wildly outdated nowadays, but sure
		"react/no-access-state-in-setstate": ["error"],
		// not sure if I need it
		"react/no-adjacent-inline-elements": ["off"],
		// I'm not stupid, if I'm using it - then it's okay
		"react/no-array-index-key": ["off"],
		"react/no-arrow-function-lifecycle": ["error"],
		"react/no-children-prop": ["error"],
		"react/no-danger-with-children": ["error"],
		"react/no-danger": ["error"],
		"react/no-deprecated": ["error"],
		"react/no-did-mount-set-state": ["error"],
		"react/no-did-update-set-state": ["error"],
		"react/no-direct-mutation-state": ["error"],
		"react/no-find-dom-node": ["error"],
		"react/no-invalid-html-attribute": ["error"],
		"react/no-is-mounted": ["error"],
		// I like to do this sometimes
		"react/no-multi-comp": ["off"],
		"react/no-namespace": ["error"],
		"react/no-object-type-as-default-prop": ["error"],
		"react/no-redundant-should-component-update": ["error"],
		"react/no-render-return-value": ["error"],
		// what a weird rule
		"react/no-set-state": ["off"],
		"react/no-string-refs": ["error"],
		"react/no-this-in-sfc": ["error"],
		// interesting rule
		"react/no-typos": ["warn"],
		"react/no-unescaped-entities": ["error"],
		"react/no-unknown-property": ["error"],
		"react/no-unsafe": ["error"],
		"react/no-unstable-nested-components": ["error", {allowAsProps: true}],
		"react/no-unused-class-component-methods": ["warn"],
		"react/no-unused-prop-types": ["warn"],
		"react/no-unused-state": ["warn"],
		"react/no-will-update-set-state": ["error"],
		"react/prefer-es6-class": ["error"],
		"react/prefer-exact-props": ["error"],
		// good in theory, but in practice just adds clutter
		"react/prefer-read-only-props": ["off"],
		"react/prefer-stateless-function": ["warn"],
		// this is for raw js
		"react/prop-types": ["off"],
		"react/require-default-props": ["off"],
		"react/require-optimization": ["off"],
		"react/require-render-return": ["error"],
		// this one is good in general, just irritating
		// in case when you're writing a code and it selfcloses tags in unfinished code
		"react/self-closing-comp": ["off"],
		"react/sort-comp": ["off"],
		"react/sort-default-props": ["off"],
		"react/sort-prop-types": ["off"],
		"react/state-in-constructor": ["off"],
		"react/static-property-placement": ["off"],
		"react/style-prop-object": ["error"],
		"react/void-dom-elements-no-children": ["error"],
		"react-hooks/rules-of-hooks": ["error"],
    "react-hooks/exhaustive-deps": ["warn"],
		"react/destructuring-assignment": ["error"],
		"react/display-name": ["off"],

	}
}
);

export default result