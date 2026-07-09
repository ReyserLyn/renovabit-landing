module.exports = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"scope-enum": [2, "always", ["ui", "seo", "content", "a11y", "perf", "deps", "ci", "repo"]],
	},
};
