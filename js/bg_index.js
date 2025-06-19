chrome.runtime.onMessage.addListener((receive, _, send) => {
	const { message } = receive;
	switch (message) {
		case "fetch_tabs": {
			fetch_tabs_data((data) => send(data));
			return true;
		}
		case "make_tab_focus": {
			const { tab_id } = receive;
			chrome.tabs.update(tab_id, { active: true });
		}
	}
});

function fetch_tabs_data(callback) {
	chrome.tabs.query({}, (tabs) => {
		for (let i = 0; i < tabs.length; i++) {
			// prettier-ignore
			const { id: tab_id,
				 	windowId: window_id, 
				 	title: tab_title = "", 
				 	url: tab_url, 
				 	favIconUrl: tab_favicon = "#" 
				} = tabs[i];
			tabs[i] = { tab_id, window_id, tab_title, tab_url, tab_favicon };
		}
		callback(tabs);
	});
}

function create_enum(obj) {
	let index = 0;
	for (let o in obj) {
		if (obj[o] == null) {
			obj[o] = index++;
		}
	}
	return obj;
}
