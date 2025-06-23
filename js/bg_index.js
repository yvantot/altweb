self.browser = self.browser || self.chrome;

class AltWebBG {
	init() {
		browser.runtime.onMessage.addListener((receive, _, send) => this.handle_onmessage(receive, send));
		browser.commands.onCommand.addListener((command) => this.handle_oncommand(command));
	}

	// Don't use async on handle_onmessage
	handle_onmessage(receive, send) {
		console.log("Receiving events");
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

		for (let t of tabs) {
			const obj_url = new URL(t.url);
			const search_params = new URLSearchParams(obj_url.search);

			if (search_params.has("altweb") && search_params.get("altweb") === "true") {
				browser.windows.update(t.windowId, { focused: true, height, width }).then((window) => {
					browser.tabs.query({ windowId: window.id }).then((tabs) => {
						browser.tabs.sendMessage(tabs[0].id, { message: "window_altweb_id", id: window.id });
					});
				});
				return;
			}
		}

		browser.windows.create({ focused: true, height, width, type: "popup", url }).then((window) => {
			browser.tabs.query({ windowId: window.id }).then((tabs) => {
				browser.tabs.sendMessage(tabs[0].id, { message: "window_altweb_id", id: window.id }).catch(async () => {
					await new Promise((r) => setTimeout(r, 1000));
					browser.tabs.sendMessage(tabs[0].id, { message: "window_altweb_id", id: window.id });
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

	// IMPORTANT: I could add undo feature
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
		/* TBD */ const bookmarks = await browser.bookmarks.getTree();

		let i = 0;
		const t_per_w = {};

		for (let window of windows) {
			t_per_w[window.id] = { focused: window.focused, count: 0 };
		}
		for (let tab of tabs) {
			if (t_per_w[tab.windowId].focused === false) t_per_w[tab.windowId].count += 1;
			else {
				if (tab.active) {
					t_per_w[tab.windowId].count += 1;
					break;
				} else t_per_w[tab.windowId].count += 1;
			}
		}
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

				const popup = await browser.windows.create({ tabId: id, type: "popup", focused: false, width: 1000, height: 650, top: 0, left: 0 });
				await new Promise((r) => setTimeout(r, 300));
				try {
					browser.windows.update(popup.id, { focused: true });
					const src = await browser.tabs.captureVisibleTab(popup.id, { format: "jpeg", quality: 50 });
					browser.tabs.move(id, { index, windowId });

					preview_sources[url] = { src, timestamp: new Date().toISOString() };
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
