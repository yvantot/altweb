window.browser = window.browser || window.chrome;

class AltWebCS {
	constructor() {
		this.last_keydown = 0;
		this.host = null;
		this.popup_id = null;
		this.index_origin = null;
		this.tab_index = 0;
		this.create_main = this.create_main.bind(this);
	}

	init() {
		window.addEventListener("keydown", (e) => this.handle_keydown(e));
		window.addEventListener("keyup", (e) => this.handle_keyup(e));
		document.addEventListener("mousedown", (e) => this.handle_mousedown(e));
		browser.runtime.onMessage.addListener((receive, _, send) => this.handle_onmessage(receive, send));

		this.add_font();
	}

	remove_altweb() {
		this.get_elements().get_root()?.remove();
	}

	handle_mousedown(e) {
		const altweb = e.target.closest("#altweb");
		if (!altweb) this.remove_altweb();
	}

	add_font() {
		const font_path = browser.runtime.getURL("assets/Quicksand.ttf");
		const font = Util.create_element("style", {}, `@font-face { font-family: "AltWeb-Quicksand"; src: url("${font_path}") format("truetype")} `);
		document.addEventListener("DOMContentLoaded", () => document.head.append(font));
	}

	create_tab(tab) {
		const { favIconUrl, id, windowId, title, url, index } = tab;
		let favicon = "";
		if (favIconUrl == null) favicon = `<div class="favicon-placeholder"><svg><use href="#icon-website"></use></svg></div>`;
		else if (favIconUrl === "") favicon = `<div class="favicon-placeholder"><svg><use href="#icon-browser"></use></svg></div>`;
		else favicon = `<img src="${favIconUrl}" class="tab-favicon"/>`;

		const element = Util.create_element(
			"div",
			{ class: "tab-container", dataset: { id, windowId, title, url, index } },
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
		const preview_c = Util.create_element("div", { class: "preview-container" });
		const windows_c = Util.create_element("div", { class: "windows-container" });
		const bookmarks_c = Util.create_element("div", { class: "bookmarks-container" });

		for (let tab of tabs) {
			tabs_c.append(this.create_tab(tab));
		}

		frag.append(preview_c, windows_c, tabs_c, bookmarks_c);
		return frag;
	}

	create_main() {
		if (document.getElementById("altweb")) return null;
		const { host, element } = Util.create_element("div", { shadow: true, id: "altweb" });
		const css_path = browser.runtime.getURL("css/cs_index.css");
		const css = Util.create_element("link", { rel: "stylesheet", type: "text/css", href: `${css_path}` });
		// prettier-ignore
		const svg = Util.create_element("svg",{ namespace: "svg", class: "no-display" },
			`<symbol id="icon-website" viewBox="0 -960 960 960">
				<path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z"/>
			</symbol>
			<symbol id="icon-browser" viewBox="0 -960 960 960">
				<path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
			</symbol>`
		);
		host.append(css, svg);
		return { host, element };
	}

	preview_info(container) {
		const tabs_c = this.host?.querySelector(".tabs-container");
		if (tabs_c) {
			const child = tabs_c.children[this.tab_index];
			const title = child.dataset.title;
			const url = child.dataset.url;

			const preview_info_c = Util.create_element("div", { class: "preview-info-container" });
			const title_p = Util.create_element("p", { class: "preview-title" });
			const url_p = Util.create_element("p", { class: "preview-link" });
			container.querySelectorAll(".preview-info-container").forEach((info) => info.remove());
			title_p.innerText = Util.limit_line_length(title, 40);
			url_p.innerText = Util.limit_line_length(url, 40);
			preview_info_c.append(title_p, url_p);
			container.append(preview_info_c);
		}
	}

	async preview_tab(container) {
		if (this.tab_index === this.index_origin) {
			container.querySelector("img")?.remove();
			return;
		}

		const tabs_c = this.host?.querySelector(".tabs-container");
		if (tabs_c) {
			const child = tabs_c.children[this.tab_index];
			const url = child.dataset.url;
			const id = child.dataset.id;
			const windowId = child.dataset.windowId;
			const index = child.dataset.index;

			const is_site = /((?:https:\/\/)?[a-zA-Z\d]{2,}\.[a-zA-Z]{2,}\/?.*?(?=[\s<>]|$))/.test(url);
			if (!is_site) {
				container.querySelector("img")?.remove();
				return;
			}

			const res = await browser.runtime.sendMessage({ message: "preview_tab", id, index, windowId, url });
			if (res && res.src) {
				const old_img = container.querySelector("img");
				if (old_img) {
					old_img.src = res.src;
				} else {
					const new_img = Util.create_element("img", { class: "preview-img", src: res.src });
					container.append(new_img);
				}
			} else {
				container.querySelector("img")?.remove();
			}
		}
	}

	focus_tab() {
		if (!document.getElementById("altweb")) return;
		const tabs_c = this.host?.querySelector(".tabs-container");
		if (tabs_c) {
			const child = tabs_c.children[this.tab_index];
			const id = child.dataset.id;
			const windowId = child.dataset.windowId;
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
		if (e.key === "Alt") {
			const now = Date.now();
			if (now - this.last_keydown < 15 * 1000) return;
			this.last_keydown = now;
			browser.runtime.sendMessage({ message: "wake_up" });
		}
		if (e.altKey) {
			const key = e.key.toUpperCase();
			e.preventDefault();
			switch (key) {
				case "Q":
				case "W": {
					try {
						browser.runtime.sendMessage({ message: "fetch_data" }).then((res) => {
							const altweb = this.create_main();
							const dx = key === "W" ? 1 : -1;

							if (altweb) {
								const { element, host } = altweb;
								this.host = host;
								host.append(this.create_ui(res));

								const body = document.body;
								body.insertBefore(element, body.firstChild);

								if (this.index_origin == null) this.index_origin = res.curr_tab_index;
								this.tab_index = res.curr_tab_index;

								const tabs_c = this.host.querySelector(".tabs-container");
								const preview_c = this.host.querySelector(".preview-container");

								if (tabs_c) this.move_selection(tabs_c, dx);
								if (preview_c) {
									this.preview_tab(preview_c);
									this.preview_info(preview_c);
								}
							} else {
								const tabs_c = this.host.querySelector(".tabs-container");
								const preview_c = this.host.querySelector(".preview-container");

								if (tabs_c) this.move_selection(tabs_c, dx);
								if (preview_c) {
									this.preview_tab(preview_c);
									this.preview_info(preview_c);
								}
							}
						});
					} catch (e) {
						console.warn("AltWeb: Extension (background script) is inactive due to Chrome's performance optimization. Try performing the action again.");
					}
					break;
				}
			}
		}

		// DEVELOPER TOOL
		if (e.key === "0") {
			browser.runtime.sendMessage({ message: "reload" });
			window.location.reload();
		}
	}

	handle_keyup(e) {
		if (e.key === "Alt") {
			this.focus_tab();
			this.remove_altweb();
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
	static limit_line_length(str, max = 40, indication = "...") {
		if (str == null || str === "") return;
		if (str.length <= max) return str;
		return str.slice(0, max - indication.length) + indication;
	}
	// WARNING: Using innerHTML is DANGEROUS, use innerText instead
	// Support nodes append through array
	static create_element(name, attr = {}, inner = "") {
		const { shadow = false, custom = false, namespace = null } = attr;

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

		let element;
		if (namespace === "svg") element = document.createElementNS("http://www.w3.org/2000/svg", name);
		else element = document.createElement(name);

		if (namespace == null && !custom && element instanceof HTMLUnknownElement) throw new Error(`${element} is not a valid HTML tag`);

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
const index = new AltWebCS();
index.init();
