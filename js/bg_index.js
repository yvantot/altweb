self.browser = self.browser || self.chrome;

class Query {
	fetch_data(callback) {
		browser.tabs.query({}, (tabs) => {
			browser.windows.getAll({}, (windows) => {
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
				browser.bookmarks.getTree((bookmarks) => {
					callback({ tabs, windows, bookmarks, curr_tab_index: Math.max(i - 1, 0) });
				});
			});
		});
	}
}

const query = new Query();
// query.fetch_data((data) => void 0);

browser.runtime.onMessage.addListener((receive, _, send) => {
	const { message } = receive;
	switch (message) {
		case "fetch_data": {
			query.fetch_data((data) => send(data));
			return true;
		}
		case "focus_tab": {
			const id = parseInt(receive.id);
			const windowId = parseInt(receive.windowId);
			browser.tabs.update(id, { active: true }, () => {
				browser.windows.update(windowId, { focused: true });
			});
			break;
		}
		case "preview_tab": {
			const id = parseInt(receive.id);
			const popup_id = receive.popup_id;
			if (popup_id) {
				browser.windows.get(popup_id, {}, (window) => {
					console.log(window);
				});
			} else {
				browser.windows.create({ tabId: id, type: "popup", focused: false });
			}
		}
		case "reload": {
			browser.runtime.reload();
			break;
		}
	}
});
