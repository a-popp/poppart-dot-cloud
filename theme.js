"use strict";

// Applies the saved theme before first paint to avoid flashing the wrong theme.
// Loaded synchronously in <head> so it runs before the body renders.
(() => {
	let theme = null;
	try {
		theme = localStorage.getItem("theme");
	} catch {
		// Storage can be unavailable in restrictive contexts; use the OS preference.
	}
	if (theme !== "dark" && theme !== "light") {
		theme =
			window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
	}
	document.documentElement.setAttribute("data-theme", theme);
})();
