// Persistent-bg
// Caveats: Never updates if available, need to reload manually
setInterval(chrome.runtime.getPlatformInfo, 20e3);

// Don't use persistent variables in background scripts.
self.browser = self.browser || self.chrome;

class AltWebBG {
	init() {
		browser.runtime.onMessage.addListener((receive, _, send) => this.handle_onmessage(receive, send));
		browser.commands.onCommand.addListener((command) => this.handle_oncommand(command));
	}

	handle_onmessage(receive, send) {
		const { message } = receive;
		if (message === "fetch_data") {
			this.fetch_data().then((res) => send(res));
			return true;
		}
		if (message === "preview_tab") {
			this.fetch_preview(receive).then((res) => send(res));
			return true;
		}
		if (message === "focus_tab") {
			this.focus_tab(receive);
			return false;
		}
		if (message === "remove_tab") {
			this.remove_tab(receive);
			return false;
		}
		if (message === "remove_window_altweb") {
			this.remove_window_altweb(receive);
			return false;
		}
		if (message === "reload") {
			browser.runtime.reload();
			return false;
		}
	}

	remove_window_altweb(receive) {
		const id = parseInt(receive.id);
		browser.windows.remove(id);
	}

	async window_altweb(command) {
		const url = `../html/index.html?altweb=true&key=${command}`;
		const tabs = await browser.tabs.query({});

		const width = Math.max(Math.min(tabs.length * 80, 1000), 300);
		const height = 300;
		const { screen } = await browser.storage.local.get("screen");
		const top = screen.height ? screen.height * 0.5 - height * 0.5 : 0;
		const left = screen.width ? screen.width * 0.5 - width * 0.5 : 0;

		// Search if altweb already exists
		for (let t of tabs) {
			const obj_url = new URL(t.url);
			const search_params = new URLSearchParams(obj_url.search);

			if (search_params.has("altweb") && search_params.get("altweb") === "true") {
				browser.windows.update(t.windowId, { focused: true, height, width, top, left }).then((window) => {
					browser.tabs.query({ windowId: window.id }).then((tabs) => {
						browser.tabs.sendMessage(tabs[0].id, {
							message: "window_altweb_id",
							id: window.id,
						});
					});
				});
				return;
			}
		}

		// If altweb doesn't exist, create a new window
		browser.windows.create({ focused: true, height, width, top, left, type: "popup", url }).then((window) => {
			browser.tabs.query({ windowId: window.id }).then((tabs) => {
				browser.tabs
					.sendMessage(tabs[0].id, {
						message: "window_altweb_id",
						id: window.id,
					})
					.catch(async () => {
						await new Promise((r) => setTimeout(r, 1000));
						browser.tabs.sendMessage(tabs[0].id, {
							message: "window_altweb_id",
							id: window.id,
						});
					});
			});
		});
	}

	handle_oncommand(command) {
		browser.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs) => {
			const tab = tabs[0];
			if (command === "q") {
				browser.tabs.sendMessage(tab.id, { key: "q" }).catch(() => this.window_altweb(command));
			}
			if (command === "w") {
				browser.tabs.sendMessage(tab.id, { key: "w" }).catch(() => this.window_altweb(command));
			}
			if (command === "d") {
				browser.tabs.sendMessage(tab.id, { key: "d" });
			}
			if (command === "e") {
				browser.tabs.sendMessage(tab.id, { key: "e" });
			}
		});
	}

	remove_tab(receive) {
		const id = parseInt(receive.id);
		browser.tabs.remove(id);
	}

	async focus_tab(receive) {
		const id = parseInt(receive.id);
		const windowId = parseInt(receive.windowId);
		browser.tabs.update(id, { active: true });
		browser.windows.update(windowId, { focused: true });
	}

	async fetch_data() {
		const tabs = await browser.tabs.query({});
		const windows = await browser.windows.getAll({});
		const bookmarks = await browser.bookmarks.getTree();

		const last_focused_win = await browser.windows.getLastFocused({ windowTypes: ["normal"] });
		const alt_web = await browser.tabs.query({ url: [`${browser.runtime.getURL("html/index.html")}*`] });

		const t_per_w = {};
		for (let w of windows) t_per_w[w.id] = { focused: w.focused, count: 0 };

		if (alt_web.length) {
			tabs.pop(); // Remove the altweb window from to-be-displayed tabs.
			t_per_w[last_focused_win.id].focused = true; // Since altweb is created, the window focus shifted to altweb, which is not what we want
		}

		// This find the correct index origin, the reason for this is because every window's tabs start at index 0
		// There must be a better way, but fuck it.
		for (let t of tabs) {
			if (!t_per_w[t.windowId].focused) t_per_w[t.windowId].count += 1;
			else {
				if (t.active) {
					t_per_w[t.windowId].count += 1;
					break;
				} else t_per_w[t.windowId].count += 1;
			}
		}

		let i = 0;
		for (let w in t_per_w) {
			i += t_per_w[w].count;
		}

		return { tabs, windows, bookmarks, curr_tab_index: Math.max(i - 1, 0) };
	}

	async fetch_preview(receive) {
		const id = parseInt(receive.id);
		const windowId = parseInt(receive.windowId);
		const index = parseInt(receive.index);
		const url = receive.url;

		// Check if preview already exist in storage to avoid loading...
		const { preview_sources = {} } = await browser.storage.local.get("preview_sources");
		if (url in preview_sources && preview_sources[url].src) {
			return { src: preview_sources[url].src };
		} else {
			try {
				const tab = await browser.tabs.get(id);
				if (tab.status === "loading" || tab.discarded || tab?.frozen) return;

				const popup = await browser.windows.create({
					tabId: id,
					type: "popup",
					focused: false,
					width: 1000,
					height: 650,
					top: 0,
					left: 0,
				});
				await new Promise((r) => setTimeout(r, 300));
				try {
					browser.windows.update(popup.id, { focused: true });
					const src = await browser.tabs.captureVisibleTab(popup.id, {
						format: "jpeg",
						quality: 50,
					});
					browser.tabs.move(id, { index, windowId }).catch(() => {
						// BUG: Might not be compatible to 'popup' heavy extensions..
						// ERROR: If window only have one tab and the tab will become a popup, the window will close
						browser.windows.create({
							tabId: id,
							type: "normal",
							focused: false,
						});
					});

					preview_sources[url] = {
						src,
						timestamp: new Date().toISOString(),
					};
					browser.storage.local.set({ preview_sources });
					return { src };
				} catch (e) {
					console.error(e);
					browser.tabs.move(id, { index, windowId });
				}
			} catch (e) {
				console.error(e);
				browser.tabs.move(id, { index, windowId });
				return null;
			}
		}
	}

	async delete_old_preview(max_age) {
		const { preview_sources } = await browser.storage.local.get("preview_sources");
		if (preview_sources) {
			const now = new Date();
			for (const key in preview_sources) {
				if (now - new Date(preview_sources[key].timestamp) > max_age) {
					delete preview_sources[key];
				}
			}
			await browser.storage.local.set({ preview_sources });
		} else {
			await browser.storage.local.set({ preview_sources: {} });
		}
	}
}
(async () => {
	const index = new AltWebBG();
	const max_age = 5 * 24 * 60 * 60 * 1000;
	await index.delete_old_preview(max_age);
	index.init();
})();
