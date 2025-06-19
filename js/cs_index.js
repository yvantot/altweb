let $root = null;

window.addEventListener("keydown", (e) => {
	if (e.altKey && e.code === "KeyW") {
		e.preventDefault();

		chrome.runtime.sendMessage({ message: "fetch_tabs" }, (r) => {
			$root.appendChild(create_tabs_ui(r));
		});
	}
});

function create_tabs_ui(tabs) {
	const root = create_element("div", { class: "tab-root" });
	for (let tab of tabs) {
		let favicon = "";
		if (tab.tab_favicon === "#") favicon = `<div class="favicon-placeholder"><svg><use href="#icon-website"></use></svg></div>`;
		else if (tab.tab_favicon === "") favicon = `<div class="favicon-placeholder"><svg><use href="#icon-browser"></use></svg></div>`;
		else favicon = `<img src="${tab.tab_favicon}" class="tab-favicon"/>`;
		const element = create_element(
			"div",
			{ class: "tab-container", dataset: { tab_id: tab.tab_id, window_id: tab.window_id } },
			`				
				${favicon}
			`
		);
		root.appendChild(element);
	}
	return root;
}

function main() {
	if (document.getElementById("altweb-root")) return;

	const { element, root } = create_element(
		"div",
		{ shadow: true, id: "altweb-root" },
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
			/* --css-start */
*, *::before, *::after { box-sizing: border-box !important; margin: 0; padding: 0; user-select: none !important; } :host { all: initial !important; --font-color: light-dark(black, white); --bg-color: light-dark(hsla(0, 0%, 50%, 0.25), hsla(0, 0%, 10%, 0.25)); /* --svg-fill: light-dark(); */ display: flex !important; position: fixed !important; top: 50% !important; left: 50% !important; align-items: center !important; transform: translate(-50%, -50%) !important; z-index: 99999999 !important; border-radius: 10px !important; background-color: var(--bg-color) !important; padding: 2.5rem !important; width: fit-content !important; height: fit-content !important; font-size: 16px !important; color-scheme: light dark; backdrop-filter: blur(7px) !important; .tab-root { display: flex; align-items: center; justify-content: center; width: 100%; height: fit-content; gap: 1rem; .tab-container { display: flex; align-items: center; cursor: pointer; .favicon-placeholder { display: flex; justify-content: center; align-items: center; svg { fill: hsla(0, 0%, 95%, 1); } } .tab-favicon, .favicon-placeholder { border-radius: 5px; width: 40px; height: 40px; } } } } .no-display { display: none !important; } :not(:defined) { display: none; } 
/* --css-end */
			</style>
        `
	);
	$root = root;

	root.addEventListener("click", async (event) => {
		event.preventDefault();
		const target = event.target.closest(".tab-container");
		const tab_id = parseInt(target.dataset.tab_id);
		// const window_id = parseInt(target.dataset.window_id);
		chrome.runtime.sendMessage({ message: "make_tab_focus", tab_id });
	});

	document.body.insertBefore(element, document.body.firstChild);
}

function create_element(name, attr = {}, inner = "") {
	let root;
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

	const element = document.createElement(name);

	if (shadow) {
		root = element.attachShadow({ mode: "closed" });
		root.innerHTML = inner.trim();
	} else {
		element.innerHTML = inner.trim();
	}

	for (let key in attr) {
		if (key === "shadow") continue;
		if (key === "dataset") {
			if (Object.keys(attr.dataset) === 0) throw new Error("dataset must not be empty");
			if (typeof attr.dataset !== "object") throw new Error("dataset must be an object");

			for (let dataset_key in attr.dataset) {
				element.dataset[dataset_key] = attr.dataset[dataset_key];
			}
		}
		if (key in element) {
			element[key] = attr[key];
		} else {
			element.setAttribute(key, attr[key]);
		}
	}

	if (shadow) return { root, element };
	else return element;
}

window.addEventListener("beforeunload", async () => {
	await chrome.runtime.reload();
});

main();
