self.browser = self.browser || self.chrome;

class AltWebBG {
	init() {
		browser.runtime.onMessage.addListener((receive, _, send) => this.handle_onmessage(receive, send));
	}

	// Don't use async on handle_onmessage
	handle_onmessage(receive, send) {
		const { message } = receive;
		if (message === "wake_up") {
			console.log("Great API guys...");
			return false;
		}
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
		if (message === "reload") {
			browser.runtime.reload();
			return false;
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

		const $tab = await browser.tabs.get(id);
		if ($tab.status === "loading") return;

		// Check if preview already exist in storage to avoid loading...
		const { preview_sources = {} } = await browser.storage.local.get("preview_sources");
		if (url in preview_sources && preview_sources[url].src) {
			return { src: preview_sources[url].src };
		} else {
			try {
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
// 15 * 24 * 60 * 60 * 1000
(async () => {
	const index = new AltWebBG();
	await index.delete_old_preview(1000);
	index.init();
})();
