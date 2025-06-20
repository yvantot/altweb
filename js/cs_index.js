window.browser = window.browser || window.chrome;

class AltWeb {
	constructor() {
		this.host = null;
		this.popup_id = null;
		this.tab_index = 0;
		this.create_main = this.create_main.bind(this);
	}

	init() {
		window.addEventListener("keydown", (e) => this.handle_keydown(e));
		window.addEventListener("keyup", (e) => this.handle_keyup(e));

		browser.runtime.onMessage.addListener((receive, _, send) => this.handle_onmessage(receive, send));
	}

	create_tab(tab) {
		const { favIconUrl, id, windowId, title, url } = tab;
		let favicon = "";
		if (favIconUrl == null) favicon = `<div class="favicon-placeholder"><svg><use href="#icon-website"></use></svg></div>`;
		else if (favIconUrl === "") favicon = `<div class="favicon-placeholder"><svg><use href="#icon-browser"></use></svg></div>`;
		else favicon = `<img src="${favIconUrl}" class="tab-favicon"/>`;

		const element = Util.create_element(
			"div",
			{ class: "tab-container", dataset: { tab_id: id, window_id: windowId, tab_title: title, tab_url: url } },
			`
				${favicon}
			`
		);
		return element;
	}

	create_ui(res) {
		const { tabs, windows, bookmarks, curr_tab } = res;
		const frag = document.createDocumentFragment();
		const tabs_c = Util.create_element("div", { class: "tabs-container" });
		const windows_c = Util.create_element("div", { class: "windows-container" });
		const bookmarks_c = Util.create_element("div", { class: "bookmarks-container" });

		for (let tab of tabs) {
			tabs_c.append(this.create_tab(tab));
		}

		frag.append(windows_c, tabs_c, bookmarks_c);
		return frag;
	}

	create_main() {
		if (document.getElementById("altweb")) return null;
		return Util.create_element(
			"div",
			{ shadow: true, id: "altweb" },
			`
			<svg class="no-display">
 				<symbol id="icon-website" viewBox="0 -960 960 960">
 					<path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z"/>
 				</symbol>
 				<symbol id="icon-browser" viewBox="0 -960 960 960">
 					<path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
 				</symbol>
 			</svg>
			<style>
				/* --css-start */*, *::before, *::after { box-sizing: border-box !important; margin: 0; padding: 0; user-select: none !important; } :host { contain: layout !important; all: initial !important; --font-color: light-dark(black, white); --bg-color: light-dark(hsla(0, 0%, 95%, 1), hsla(0, 0%, 5%, 1)); --svg-fill: light-dark(hsla(0, 0%, 5%, 0.5), hsla(0, 0%, 95%, 0.5)); --tab-transform-hov: scale(1.5, 1.5) translate(0, -0.5rem); backdrop-filter: blur(10px) !important; display: flex !important; position: fixed !important; top: 50% !important; left: 50% !important; align-items: center !important; transform: translate(-50%, -50%) !important; z-index: 99999999 !important; border-radius: 10px !important; backdrop-filter: blur(10px); border-top: 2px solid hsla(0, 0%, 50%, 0.5) !important; box-shadow: 0px 10px 20px hsla(0, 0%, 0%, 0.3) !important; padding: 1rem !important; width: fit-content !important; max-width: 80vw !important; height: fit-content !important; font-size: 16px !important; color-scheme: light dark; .tabs-container { display: flex; align-items: center; width: 100%; height: fit-content; transition: gap 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background-color: var(--bg-color) !important; border-radius: 10px !important; padding: 1rem; gap: 1rem; .tab-container { display: flex; transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease-in-out; align-items: center; cursor: pointer; .favicon-placeholder { display: flex; justify-content: center; align-items: center; svg { fill: var(--svg-fill); } } .tab-favicon, .favicon-placeholder { filter: drop-shadow(0px 5px 5px hsla(0, 0%, 0%, 0.3)); border-radius: 5px; width: 30px; height: 30px; } } } } .no-display { display: none !important; } .tab-hover { padding-bottom: 0.3rem; transform: var(--tab-transform-hov); } /* --css-end */
			</style>
			`
		);
	}

	preview_tab() {
		const tabs_c = this.host?.querySelector(".tabs-container");
		if (tabs_c) {
			const child = tabs_c.children[this.tab_index];
			const id = child.dataset.tab_id;
			browser.runtime.sendMessage({ message: "preview_tab", id, popup_id: this.popup_id });
		}
	}

	focus_tab() {
		const tabs_c = this.host?.querySelector(".tabs-container");
		if (tabs_c) {
			const child = tabs_c.children[this.tab_index];
			const id = child.dataset.tab_id;
			const windowId = child.dataset.window_id;
			browser.runtime.sendMessage({ message: "focus_tab", id, windowId });
		}
		this.host = null;
	}

	move_selection(container, dx) {
		container.querySelectorAll(".tab-hover").forEach((el) => el.classList.remove("tab-hover"));

		const children = container.children;
		this.tab_index += dx;
		if (this.tab_index > children.length - 1) this.tab_index = 0;
		else if (this.tab_index < 0) this.tab_index = children.length - 1;

		children[this.tab_index].classList.add("tab-hover");
	}

	handle_onmessage(receive, send) {
		console.log("1");
		switch (receive) {
			case "update_popup_id": {
				alert(receive.message);
			}
		}
	}

	handle_keydown(e) {
		if (e.altKey) {
			const key = e.key.toUpperCase();
			e.preventDefault();
			switch (key) {
				case "Q":
				case "W": {
					requestAnimationFrame(() => {
						browser.runtime.sendMessage({ message: "fetch_data" }, (res) => {
							const altweb = this.create_main();
							const dx = key === "W" ? 1 : -1;

							if (altweb) {
								const { element, host } = altweb;
								this.host = host;
								host.append(this.create_ui(res));
								const body = document.body;
								body.insertBefore(element, body.firstChild);

								this.tab_index = res.curr_tab_index;
								const tabs_c = this.host.querySelector(".tabs-container");
								if (tabs_c) {
									this.move_selection(tabs_c, dx);
									this.preview_tab();
								}
							} else {
								const tabs_c = this.host.querySelector(".tabs-container");
								if (tabs_c) {
									this.move_selection(tabs_c, dx);
									this.preview_tab();
								}
							}
						});
					});

					break;
				}
			}
		}

		if (e.key === "0") {
			browser.runtime.sendMessage({ message: "reload" });
		}
	}

	handle_keyup(e) {
		if (e.key === "Alt") {
			this.focus_tab();
			this.get_elements().get_root()?.remove();
		}
	}

	get_elements() {
		return {
			get_root() {
				return document.getElementById("altweb");
			},
		};
	}
}

class Util {
	static create_element(name, attr = {}, inner = "") {
		const { shadow = false, custom = false } = attr;

		if (custom) {
			if (!customElements.get(name)) {
				customElements.define(
					name,
					class extends HTMLElement {
						constructor() {
							super();
						}
					}
				);
			}
		}

		let host = null;
		const element = document.createElement(name);
		if (shadow) {
			host = element.attachShadow({ mode: "open" });
			host.innerHTML = inner.trim();
		} else element.innerHTML = inner.trim();

		for (let key in attr) {
			if (key === "shadow") continue;
			if (key === "dataset") {
				if (Object.keys(attr.dataset) === 0) throw new Error("dataset must not be empty");
				if (typeof attr.dataset !== "object") throw new Error("dataset must be an object");
				for (let dataset_key in attr.dataset) element.dataset[dataset_key] = attr.dataset[dataset_key];
				continue;
			}
			if (key in element) element[key] = attr[key];
			else element.setAttribute(key, attr[key]);
		}

		if (shadow) return { host, element };
		else return element;
	}
}

const main = new AltWeb();

main.init();
