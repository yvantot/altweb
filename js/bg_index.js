self.browser = self.browser || self.chrome;

class AltWebBG {
	constructor() {
		this.timeout = null;
		this.interval = null;
	}

	init() {
		browser.runtime.onMessage.addListener((receive, _, send) => handle_onmessage(receive, send));
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

	async handle_onmessage(receive, send) {
		const { message } = receive;
		if (message === "fetch_data") {
			const res = await this.fetch_data();
			send(res);
			return true;
		}
		if (message === "preview_tab") {
			const res = await this.fetch_preview(receive);
			send(res);
			return true;
		}
		if (message === "focus_tab") {
			await focus_tab(receive);
			return;
		}
		if (message === "reload") {
			browser.runtime.reload();
			return;
		}
	}

	async focus_tab(receive) {
		const id = parseInt(receive.id);
		const windowId = parseInt(receive.windowId);
		await browser.tabs.update(id, { active: true });
		await browser.windows.update(windowId, { focused: true });
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
				const popup = await browser.windows.create({ tabId: id, type: "popup", focused: true, state: "maximized" });

				// Polling till the tab is complete, clear after 1.5s...
				this.timeout = setTimeout(() => clearInterval(this.interval), 1500);
				this.interval = setInterval(async () => {
					try {
						const tab = await browser.tabs.get(id);
						if (tab.status === "complete") {
							clearTimeout(this.timeout);
							clearInterval(this.interval);

							await new Promise((r) => setTimeout(r, 100));
							const src = await browser.tabs.captureVisibleTab(popup.id, { format: "jpeg", quality: 50 });
							await browser.tabs.move(id, { index, windowId });
							preview_sources[url] = { src, timestamp: new Date().toISOString() };
							await browser.storage.local.set({ preview_sources });

							return { src };
						} else if (tab.status === "unloaded") throw new Error();
					} catch (e) {
						clearTimeout(this.timeout);
						clearInterval(this.interval);

						await browser.tabs.move(id, { index, windowId });
					}
				}, 100);
			} catch (e) {
				clearTimeout(this.timeout);
				clearInterval(this.interval);
				await browser.tabs.move(id, { index, windowId });

				return { error: true };
			}
		}
	}
}

(async () => {
	const index = new AltWebBG();
	await index.delete_old_preview(15 * 24 * 60 * 60 * 1000);
	index.init();
})();
