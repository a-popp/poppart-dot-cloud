"use strict";

(() => {
	const storageKey = "theme";
	const root = document.documentElement;

	// localStorage can throw in restrictive browsing contexts; degrade quietly.
	const storage = {
		get() {
			try {
				return localStorage.getItem(storageKey);
			} catch {
				return null;
			}
		},
		set(value) {
			try {
				localStorage.setItem(storageKey, value);
			} catch {
				// Preference is simply not persisted.
			}
		},
	};

	const prefersDark = () =>
		window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

	/** Applies a theme name to the root element and syncs the toggle button. */
	const applyTheme = (theme, toggle) => {
		root.setAttribute("data-theme", theme);
		if (!toggle) {
			return;
		}
		toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
		const label = toggle.querySelector("span");
		if (label) {
			label.textContent = theme === "dark" ? "Theme: Dark" : "Theme: Light";
		}
	};

	/** Restores the saved theme and wires the header theme toggle. */
	const initThemeToggle = () => {
		const toggle = document.querySelector("[data-theme-toggle]");
		const stored = storage.get();
		applyTheme(
			stored === "dark" || stored === "light" ? stored : prefersDark() ? "dark" : "light",
			toggle
		);
		if (!toggle) {
			return;
		}
		toggle.addEventListener("click", () => {
			const current = root.getAttribute("data-theme") || (prefersDark() ? "dark" : "light");
			const next = current === "dark" ? "light" : "dark";
			storage.set(next);
			applyTheme(next, toggle);
		});
	};

	/** Marks the nav link for the current page with aria-current. */
	const setActiveNav = () => {
		const links = document.querySelectorAll(".nav-links a");
		if (!links.length) {
			return;
		}
		const path = window.location.pathname.split("/").pop() || "index.html";
		links.forEach((link) => {
			const target = link.getAttribute("href") || "index.html";
			if (target === path) {
				link.setAttribute("aria-current", "page");
			} else {
				link.removeAttribute("aria-current");
			}
		});
	};

	/** Fetches each [data-include] snippet (header/footer) and swaps it into the page. */
	const loadIncludes = async () => {
		const placeholders = Array.from(document.querySelectorAll("[data-include]"));
		await Promise.all(
			placeholders.map(async (placeholder) => {
				const name = placeholder.getAttribute("data-include");
				if (!name) {
					return;
				}
				try {
					const response = await fetch(`${name}.html`, { cache: "no-cache" });
					if (!response.ok) {
						return;
					}
					placeholder.outerHTML = await response.text();
				} catch {
					// Includes are optional; leave the placeholder empty on failure.
				}
			})
		);
	};

	/** Builds the mailto link on the contact page from data attributes. */
	const initContactLink = () => {
		const link = document.querySelector("[data-contact-link]");
		if (!link) {
			return;
		}

		const user = link.getAttribute("data-user");
		const domain = link.getAttribute("data-domain");
		const subject = link.getAttribute("data-subject") || "Submission From Poppart Website";
		const emailTarget = document.querySelector("[data-contact-email]");

		if (!user || !domain) {
			return;
		}

		const address = `${user}@${domain}`;
		const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
			"Hi Alex,\r\n\r\n"
		)}`;

		link.href = `mailto:${address}?${query}`;
		if (emailTarget) {
			emailTarget.textContent = address;
		}
	};

	/** Wires the "Start here" listbox on the home page. */
	const initChooser = () => {
		const chooser = document.querySelector("[data-chooser]");
		if (!chooser) {
			return;
		}
		const trigger = chooser.querySelector("[data-chooser-trigger]");
		const menu = chooser.querySelector("[data-chooser-menu]");
		const value = chooser.querySelector("[data-chooser-value]");
		const options = Array.from(chooser.querySelectorAll("[data-chooser-option]"));

		const setSelection = (option) => {
			options.forEach((item) => item.setAttribute("aria-selected", "false"));
			option.setAttribute("aria-selected", "true");
			if (value) {
				value.textContent = option.textContent.trim();
			}
			const destination = option.getAttribute("data-value");
			if (destination) {
				window.location.href = destination;
			}
		};

		const openMenu = () => {
			if (!menu || !trigger) {
				return;
			}
			menu.classList.add("open");
			trigger.setAttribute("aria-expanded", "true");
			const selected = menu.querySelector("[aria-selected=\"true\"]") || options[0];
			if (selected) {
				selected.focus();
			}
		};

		const closeMenu = () => {
			if (!menu || !trigger) {
				return;
			}
			menu.classList.remove("open");
			trigger.setAttribute("aria-expanded", "false");
		};

		const toggleMenu = () => {
			if (!menu) {
				return;
			}
			if (menu.classList.contains("open")) {
				closeMenu();
			} else {
				openMenu();
			}
		};

		if (trigger) {
			trigger.addEventListener("click", toggleMenu);
			trigger.addEventListener("keydown", (event) => {
				if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					openMenu();
				}
			});
		}

		options.forEach((option, index) => {
			option.setAttribute("aria-selected", "false");
			option.addEventListener("click", () => {
				setSelection(option);
				closeMenu();
			});
			option.addEventListener("keydown", (event) => {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					const next = options[index + 1] || options[0];
					next.focus();
				} else if (event.key === "ArrowUp") {
					event.preventDefault();
					const prev = options[index - 1] || options[options.length - 1];
					prev.focus();
				} else if (event.key === "Escape") {
					event.preventDefault();
					closeMenu();
					if (trigger) {
						trigger.focus();
					}
				} else if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					setSelection(option);
					closeMenu();
				}
			});
		});

		document.addEventListener("click", (event) => {
			if (!chooser.contains(event.target)) {
				closeMenu();
			}
		});
	};

	/** Wires a [data-tabs] tablist: click and left/right arrow navigation. */
	const initTabs = () => {
		const tabs = document.querySelector("[data-tabs]");
		if (!tabs) {
			return;
		}
		const tabButtons = Array.from(tabs.querySelectorAll("[role=tab]"));
		const tabPanels = Array.from(tabs.querySelectorAll("[data-tab-panel]"));

		const setActiveTab = (target) => {
			tabButtons.forEach((button) => {
				const isActive = button.getAttribute("data-tab") === target;
				button.setAttribute("aria-selected", isActive ? "true" : "false");
				button.setAttribute("tabindex", isActive ? "0" : "-1");
			});
			tabPanels.forEach((panel) => {
				panel.hidden = panel.getAttribute("data-tab-panel") !== target;
			});
		};

		tabButtons.forEach((button) => {
			button.addEventListener("click", () => {
				const target = button.getAttribute("data-tab");
				if (target) {
					setActiveTab(target);
				}
			});
		});

		// Arrow keys move focus between tabs and activate on focus (APG pattern).
		tabs.addEventListener("keydown", (event) => {
			if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
				return;
			}
			const currentIndex = tabButtons.indexOf(document.activeElement);
			if (currentIndex === -1) {
				return;
			}
			event.preventDefault();
			const offset = event.key === "ArrowRight" ? 1 : -1;
			const next =
				tabButtons[(currentIndex + offset + tabButtons.length) % tabButtons.length];
			next.focus();
			const target = next.getAttribute("data-tab");
			if (target) {
				setActiveTab(target);
			}
		});

		const initial = tabButtons.find(
			(button) => button.getAttribute("aria-selected") === "true"
		);
		setActiveTab(initial?.getAttribute("data-tab") || tabButtons[0]?.getAttribute("data-tab"));
	};

	/** Returns the URL only if it is an http(s) link, otherwise null. */
	const safeHttpUrl = (value) => {
		try {
			const url = new URL(value, window.location.href);
			return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
		} catch {
			return null;
		}
	};

	/**
	 * Wires the music browser on the life page: paginated track list backed by the
	 * OutSystems REST API, with search, type filter, sorting, and a detail panel
	 * that lazy-loads audio as a base64 data URI.
	 */
	const initMusicBrowser = async (musicBrowser) => {
		const apiBase = "https://poppart.outsystemscloud.com/Poppart/rest/Read";
		const searchInput = musicBrowser.querySelector("[data-music-search]");
		const typeSelect = musicBrowser.querySelector("[data-music-type]");
		const status = musicBrowser.querySelector("[data-music-status]");
		const tableBody = musicBrowser.querySelector("[data-music-body]");
		const detail = musicBrowser.querySelector("[data-music-detail]");
		const detailTitle = musicBrowser.querySelector("[data-music-title]");
		const detailMeta = musicBrowser.querySelector("[data-music-meta]");
		const detailDescription = musicBrowser.querySelector("[data-music-description]");
		const detailAudio = musicBrowser.querySelector("[data-music-audio]");
		const detailFields = musicBrowser.querySelector("[data-music-fields]");
		const detailSources = musicBrowser.querySelector("[data-music-sources]");
		const pageSizeSelect = musicBrowser.querySelector("[data-music-page-size]");
		const pagePrev = musicBrowser.querySelector("[data-page-prev]");
		const pageNext = musicBrowser.querySelector("[data-page-next]");
		const pageStatus = musicBrowser.querySelector("[data-page-status]");
		const clearFilters = musicBrowser.querySelector("[data-clear-filters]");
		const sortButtons = Array.from(musicBrowser.querySelectorAll("[data-sort]"));
		const state = {
			tracks: [],
			selected: null,
			selectedId: null,
			loading: false,
			loadQueued: false,
			audioRequest: 0,
			pageSize: 10,
			pageIndex: 0,
			totalRecords: 0,
			sortKey: "PublishDate",
			sortDir: "desc",
		};

		const setStatus = (message) => {
			if (status) {
				status.textContent = message;
			}
		};

		const fetchJson = async (url) => {
			const response = await fetch(url, { cache: "no-cache" });
			if (!response.ok) {
				throw new Error(`Request failed: ${response.status}`);
			}
			return response.json();
		};

		const getTrackId = (item) =>
			item?.TrackId ?? item?.trackId ?? item?.Id ?? item?.TrackID ?? null;

		const getTotalRecords = (data) =>
			data?.TotalRecords ??
			data?.TotalCount ??
			data?.FilteredRecords ??
			data?.FilteredCount ??
			data?.RecordCount ??
			data?.Count ??
			0;

		const sortMap = {
			Title: "TITLE",
			Type: "TYPE",
			PublishDate: "PUBLISHDATE",
		};

		const updateSortUI = () => {
			sortButtons.forEach((button) => {
				const key = button.getAttribute("data-sort");
				const header = button.closest("th");
				const indicator = button.querySelector(".sort-indicator");
				if (!key || !header) {
					return;
				}
				const active = key === state.sortKey;
				const dir = active ? state.sortDir : "none";
				button.setAttribute("data-sort-dir", dir);
				if (indicator) {
					indicator.textContent = active ? (state.sortDir === "asc" ? "^" : "v") : "";
				}
				header.setAttribute(
					"aria-sort",
					active ? (state.sortDir === "asc" ? "ascending" : "descending") : "none"
				);
			});
		};

		const updatePaginationUI = () => {
			const total = state.totalRecords || 0;
			const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
			const currentPage = Math.min(state.pageIndex + 1, totalPages);
			if (pageStatus) {
				const start = total === 0 ? 0 : state.pageIndex * state.pageSize + 1;
				const end = Math.min(state.pageIndex * state.pageSize + state.tracks.length, total);
				pageStatus.textContent = `Page ${currentPage} of ${totalPages} (${start}-${end} of ${total})`;
			}
			if (pagePrev) {
				pagePrev.disabled = state.pageIndex <= 0;
			}
			if (pageNext) {
				pageNext.disabled = currentPage >= totalPages;
			}
			if (pageSizeSelect) {
				pageSizeSelect.value = String(state.pageSize);
			}
		};

		const renderTracks = () => {
			if (!tableBody) {
				return;
			}
			tableBody.innerHTML = "";
			if (!state.tracks.length) {
				setStatus("No mixes found.");
				return;
			}
			setStatus("");
			state.tracks.forEach((track) => {
				const row = document.createElement("tr");
				const titleCell = document.createElement("td");
				const titleButton = document.createElement("button");
				titleButton.type = "button";
				titleButton.className = "music-title-button";
				titleButton.textContent = track.Title || "Untitled mix";
				titleButton.addEventListener("click", () => selectTrack(track));
				titleCell.appendChild(titleButton);
				const typeCell = document.createElement("td");
				typeCell.textContent = track.Type || "";
				const dateCell = document.createElement("td");
				dateCell.textContent = track.PublishDate || "";
				row.appendChild(titleCell);
				row.appendChild(typeCell);
				row.appendChild(dateCell);
				tableBody.appendChild(row);
			});
			updatePaginationUI();
		};

		const renderFields = (track) => {
			if (!detailFields) {
				return;
			}
			detailFields.innerHTML = "";
			const fields = [
				{ label: "File name", value: track.FileName },
				{ label: "File type", value: track.FileType },
				{
					label: "Original lyrics",
					value:
						typeof track.IncludesOriginalLyrics === "boolean"
							? track.IncludesOriginalLyrics
								? "Yes"
								: "No"
							: "",
				},
				{
					label: "Original audio",
					value:
						typeof track.IncludesOriginalAudio === "boolean"
							? track.IncludesOriginalAudio
								? "Yes"
								: "No"
							: "",
				},
				{ label: "Generation tool", value: track.GenerationTool },
				{ label: "Prompt", value: track.Prompt },
			];
			fields
				.filter((field) => field.value)
				.forEach((field) => {
					const item = document.createElement("div");
					item.className = "music-field";
					const label = document.createElement("span");
					label.textContent = field.label;
					const value = document.createElement("div");
					value.textContent = field.value;
					item.appendChild(label);
					item.appendChild(value);
					detailFields.appendChild(item);
				});
		};

		const renderSources = (sources) => {
			if (!detailSources) {
				return;
			}
			detailSources.innerHTML = "";
			if (!sources || !sources.length) {
				return;
			}
			const header = document.createElement("strong");
			header.textContent = "Sources";
			detailSources.appendChild(header);
			sources.forEach((source) => {
				const line = document.createElement("div");
				const parts = [source.Title, source.Artist, source.Album, source.Year]
					.filter(Boolean)
					.join(" / ");
				const url = safeHttpUrl(source.URL);
				if (url) {
					line.textContent = `${parts} / `;
					const link = document.createElement("a");
					link.href = url;
					link.target = "_blank";
					link.rel = "noreferrer";
					link.textContent = "Link";
					line.appendChild(link);
				} else {
					line.textContent = parts;
				}
				detailSources.appendChild(line);
			});
		};

		const renderDetail = (track, trackId, options = {}) => {
			if (!detail || !detailTitle || !detailMeta || !detailDescription) {
				return;
			}
			detail.hidden = false;
			detailTitle.textContent = track.Title || "Untitled mix";
			detailMeta.textContent = [track.Type, track.PublishDate].filter(Boolean).join(" - ");
			detailDescription.textContent = track.Description || "";
			if (detailAudio && !options.preserveAudio) {
				detailAudio.removeAttribute("src");
				detailAudio.load();
			}
			renderFields(track);
			renderSources(track.TrackSourceCollection);
		};

		const loadAudio = async (trackId, track) => {
			if (!trackId || !detailAudio) {
				return;
			}
			// Guard against a slow response overwriting a newer selection.
			const requestId = ++state.audioRequest;
			setStatus("Loading audio...");
			try {
				const url = new URL(`${apiBase}/GetTrack`);
				url.searchParams.set("TrackId", trackId);
				const data = await fetchJson(url.toString());
				if (requestId !== state.audioRequest) {
					return;
				}
				const item = data?.TrackItem;
				const fileContent = item?.FileContent;
				const fileType = item?.FileType || "audio/mpeg";
				if (!fileContent) {
					throw new Error("No audio data available");
				}
				detailAudio.src = fileContent.startsWith("data:")
					? fileContent
					: `data:${fileType};base64,${fileContent}`;
				detailAudio.play()?.catch(() => {});
				if (item && track) {
					renderDetail({ ...track, ...item }, trackId, { preserveAudio: true });
				}
				setStatus("");
			} catch {
				if (requestId === state.audioRequest) {
					setStatus("Unable to load audio for this mix.");
				}
			}
		};

		const selectTrack = (track) => {
			const trackId = getTrackId(track);
			state.selected = track;
			state.selectedId = trackId;
			renderDetail(track, trackId);
			loadAudio(trackId, track);
		};

		const loadTracks = async () => {
			// If a request is in flight, queue one re-run so the latest filter wins.
			if (state.loading) {
				state.loadQueued = true;
				return;
			}
			state.loading = true;
			state.loadQueued = false;
			setStatus("Loading mixes...");
			try {
				const url = new URL(`${apiBase}/GetTracks`);
				const search = searchInput?.value?.trim();
				const typeId = typeSelect?.value;
				if (search) {
					url.searchParams.set("SearchFilter", search);
				}
				if (typeId) {
					url.searchParams.set("TrackTypeId", typeId);
				}
				if (state.sortKey) {
					const sortLabel = sortMap[state.sortKey] || sortMap.PublishDate;
					const sortDir = state.sortDir.toUpperCase();
					url.searchParams.set("SortForAggregate", `${sortLabel} ${sortDir}`);
				}
				url.searchParams.set("MaxRecords", String(state.pageSize));
				url.searchParams.set("StartIndex", String(state.pageIndex * state.pageSize));
				const data = await fetchJson(url.toString());
				state.tracks = data?.TrackCollection || [];
				state.totalRecords = getTotalRecords(data) || state.tracks.length;
				renderTracks();
			} catch {
				setStatus("Unable to load mixes right now.");
			} finally {
				state.loading = false;
				if (state.loadQueued) {
					loadTracks();
				}
			}
		};

		const loadTypes = async () => {
			if (!typeSelect) {
				return;
			}
			try {
				const data = await fetchJson(`${apiBase}/GetTrackTypes`);
				const types = data?.TrackTypeItems || [];
				types.forEach((type) => {
					const option = document.createElement("option");
					option.value = type.Id;
					option.textContent = type.Label || "Type";
					typeSelect.appendChild(option);
				});
			} catch {
				setStatus("Unable to load mix types.");
			}
		};

		if (searchInput) {
			let searchTimer;
			searchInput.addEventListener("input", () => {
				clearTimeout(searchTimer);
				searchTimer = setTimeout(() => {
					state.pageIndex = 0;
					loadTracks();
				}, 250);
			});
		}
		if (typeSelect) {
			typeSelect.addEventListener("change", () => {
				state.pageIndex = 0;
				loadTracks();
			});
		}

		sortButtons.forEach((button) => {
			button.addEventListener("click", () => {
				const key = button.getAttribute("data-sort");
				if (!key) {
					return;
				}
				if (state.sortKey === key) {
					state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
				} else {
					state.sortKey = key;
					state.sortDir = "asc";
				}
				state.pageIndex = 0;
				updateSortUI();
				loadTracks();
			});
		});

		if (clearFilters) {
			clearFilters.addEventListener("click", () => {
				if (searchInput) {
					searchInput.value = "";
				}
				if (typeSelect) {
					typeSelect.value = "";
				}
				state.pageSize = 10;
				state.pageIndex = 0;
				state.totalRecords = 0;
				state.sortKey = "PublishDate";
				state.sortDir = "desc";
				updateSortUI();
				loadTracks();
			});
		}

		if (pagePrev) {
			pagePrev.addEventListener("click", () => {
				if (state.pageIndex > 0) {
					state.pageIndex -= 1;
					loadTracks();
				}
			});
		}
		if (pageNext) {
			pageNext.addEventListener("click", () => {
				const totalPages = Math.max(1, Math.ceil(state.totalRecords / state.pageSize));
				if (state.pageIndex + 1 < totalPages) {
					state.pageIndex += 1;
					loadTracks();
				}
			});
		}
		if (pageSizeSelect) {
			pageSizeSelect.addEventListener("change", () => {
				const nextSize = Number.parseInt(pageSizeSelect.value, 10);
				state.pageSize = Number.isNaN(nextSize) ? 10 : nextSize;
				state.pageIndex = 0;
				loadTracks();
			});
		}

		await loadTypes();
		updateSortUI();
		await loadTracks();
	};

	/** Entry point: load includes, then wire up whatever widgets exist on the page. */
	const init = async () => {
		await loadIncludes();
		setActiveNav();
		initThemeToggle();
		initContactLink();
		initChooser();
		initTabs();
		const musicBrowser = document.querySelector("[data-music-browser]");
		if (musicBrowser) {
			await initMusicBrowser(musicBrowser);
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
