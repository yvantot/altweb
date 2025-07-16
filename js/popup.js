import { Utils } from "./utils.js";

const id = 123;
const store_link = `https://chromewebstore.google.com/detail/${id}/`;

window.browser = window.browser || window.chrome;

const POPUPS = {
	DONATE: () =>
		Utils.show_popup({
			block_outside: true,
			exitable: true,
			title: "Support",
			icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M640-440 474-602q-31-30-52.5-66.5T400-748q0-55 38.5-93.5T532-880q32 0 60 13.5t48 36.5q20-23 48-36.5t60-13.5q55 0 93.5 38.5T880-748q0 43-21 79.5T807-602L640-440Zm0-112 109-107q19-19 35-40.5t16-48.5q0-22-15-37t-37-15q-14 0-26.5 5.5T700-778l-60 72-60-72q-9-11-21.5-16.5T532-800q-22 0-37 15t-15 37q0 27 16 48.5t35 40.5l109 107ZM280-220l278 76 238-74q-5-9-14.5-15.5T760-240H558q-27 0-43-2t-33-8l-93-31 22-78 81 27q17 5 40 8t68 4q0-11-6.5-21T578-354l-234-86h-64v220ZM40-80v-440h304q7 0 14 1.5t13 3.5l235 87q33 12 53.5 42t20.5 66h80q50 0 85 33t35 87v40L560-60l-280-78v58H40Zm80-80h80v-280h-80v280Zm520-546Z"/></svg>',
			description: "Keeping AltWeb up and running takes time (and time is all we have).<br><br>If you <a href='https://ko-fi.com/yvantot' target='_blank'>donate $1 or more</a>, you'll unlock lifetime pro access to AltWeb when some of its features eventually go behind a paywall.<br><br>I will maintain this tool as long as I can because I hate the idea of making features behind paywall.",
			action: "Maybe next time.",
			width: 90,
			bg_color: "hsl(0, 0%, 10%)",
			text_color: "hsl(0, 0%, 90%)",
		}),
	HELP: () =>
		Utils.show_popup(
			{
				block_outside: true,
				exitable: true,
				title: "Help",
				description: "Controls: <br/>- (Alt + W) : Open AltWeb and move selection forward<br/>- (Alt + E) : Open AltWeb and move selection backward<br>- (Alt + E) : Open AltWeb and open search panel<br>- (Alt + D) : Close the selected tab",
				action: "Take me to FAQ",
				width: 90,
				bg_color: "hsl(0, 0%, 10%)",
				text_color: "hsl(0, 0%, 90%)",
			},
			() =>
				Utils.show_popup({
					block_outside: true,
					exitable: true,
					title: "FAQ",
					description: "Frequently asked questions:<br>- Is my data safe? <br>This extension doesn't connect to the internet, that means your data is saved locally. What data are being saved locally? Tab previews and user configs related to this extension. Tab previews can be disabled for better privacy.<br><br>- Does AltWeb slow down my browser experience?<br>No. AltWeb is lightweight and runs fast on old machine (8gb ram, 2012 laptop). However, some sites are extremely resource-hungry that they block everything, including AltWeb, resulting to a bad user experience.",
					action: "Okay, thanks",
					width: 90,
					bg_color: "hsl(0, 0%, 10%)",
					text_color: "hsl(0, 0%, 90%)",
				})
		),
	RATE: () =>
		Utils.show_popup({
			block_outside: true,
			exitable: true,
			icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M640-440 474-602q-31-30-52.5-66.5T400-748q0-55 38.5-93.5T532-880q32 0 60 13.5t48 36.5q20-23 48-36.5t60-13.5q55 0 93.5 38.5T880-748q0 43-21 79.5T807-602L640-440Zm0-112 109-107q19-19 35-40.5t16-48.5q0-22-15-37t-37-15q-14 0-26.5 5.5T700-778l-60 72-60-72q-9-11-21.5-16.5T532-800q-22 0-37 15t-15 37q0 27 16 48.5t35 40.5l109 107ZM280-220l278 76 238-74q-5-9-14.5-15.5T760-240H558q-27 0-43-2t-33-8l-93-31 22-78 81 27q17 5 40 8t68 4q0-11-6.5-21T578-354l-234-86h-64v220ZM40-80v-440h304q7 0 14 1.5t13 3.5l235 87q33 12 53.5 42t20.5 66h80q50 0 85 33t35 87v40L560-60l-280-78v58H40Zm80-80h80v-280h-80v280Zm520-546Z"/></svg>',
			title: "Help us improve",
			description: `You can help us by <a href="${store_link}" target="_blank">rating ${browser.runtime.getManifest().name}</a>. Thank you!`,
			action: "Next time?",
			width: 90,
			bg_color: "hsl(0, 0%, 10%)",
			text_color: "hsl(0, 0%, 90%)",
		}),
};

document.getElementById("delete-preview").addEventListener("input", (e) => handle_input(e));
document.getElementById("help").addEventListener("click", () => POPUPS.HELP());
document.getElementById("donate").addEventListener("click", () => POPUPS.DONATE());
document.getElementById("rate").addEventListener("click", () => POPUPS.RATE());

document.body.addEventListener("click", (e) => handle_click_label(e));

async function update_UI_states() {
	const { configs } = await browser.storage.local.get("configs");
	const inputs = {};

	document.querySelectorAll("input").forEach((input) => {
		const feature = input.id.replace("-", "_");
		inputs[feature] = input;
	});

	for (let input in inputs) {
		if (inputs[input].type === "checkbox") {
			inputs[input].checked = configs[input];
		}
		if (inputs[input].type === "text") {
			if (input === "delete_preview") {
				const value = parseFloat(configs[input]);
				inputs[input].value = value > 0 ? value / 1000 / 60 / 60 / 24 : 0;
			}
		}
	}
}

async function handle_input(e) {
	const { configs } = await browser.storage.local.get("configs");
	const target = e.target;
	const value = parseFloat(target.value);

	target.value = isNaN(value) ? 1 : value;
	configs.delete_preview = isNaN(value) ? 1 : value * 24 * 60 * 60 * 1000;

	await browser.storage.local.set({ configs });
}

async function handle_click_label(e) {
	const target = e.target.closest("label");
	if (target == null) return;
	e.preventDefault();
	const input = target.querySelector("input");
	if (input.type !== "checkbox") return;

	const feature = target.getAttribute("for").replace("-", "_");
	const { configs } = await browser.storage.local.get("configs");

	const handle_click_feature = (name) => {
		const config_feature = configs[name];

		if (config_feature != null) {
			const new_value = !config_feature;
			configs[name] = new_value;
			input.checked = new_value;
			browser.storage.local.set({ configs });
		}
	};

	handle_click_feature(feature);
}

async function init() {
	await update_UI_states();
}

init();
