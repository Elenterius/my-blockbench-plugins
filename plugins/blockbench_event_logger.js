"use strict";

var BlockbenchEventLogger = {};

(function () {
	const IGNORED_EVENTS = ['resize_window', 'update_camera_position'];
	BlockbenchEventLogger.enabled = true;
	BlockbenchEventLogger.ignoredEvents = [...IGNORED_EVENTS];
	BlockbenchEventLogger.ignore = (eventName) => IGNORED_EVENTS.push(eventName);
	BlockbenchEventLogger.removeIgnored = (eventName) => {
		const index = IGNORED_EVENTS.indexOf(eventName);
		if (index > -1) array.splice(index, 1);
	}

	function logEvent(eventId, eventData, eventResult) {
		if (!BlockbenchEventLogger.enabled) return;
		if (eventId === 'render_frame') return;
		if (IGNORED_EVENTS.includes(eventId)) return;

		if (eventData != null || eventResult != null) {
			console.group("dispatched event %o", eventId);
			if (eventData) console.log("data: %o", eventData);
			if (eventResult) console.log("result: %o", eventResult);
			console.groupEnd();
		}
		else {
			console.log("dispatched event %o", eventId);
		}
	}

	let ORIGINAL_FUNC;

	Plugin.register('blockbench_event_logger', {
		title: 'Blockbench Event Logger',
		author: 'Elenterius',
		description: 'This plugin logs all Blockbench events (except render_frame event) to the console',
		icon: 'logo_dev',
		tags: ["Logging", "Plugin Development"],
		version: '0.0.1',
		variant: 'both',
		
		onload() {
			ORIGINAL_FUNC = Blockbench.dispatchEvent;
			Blockbench.dispatchEvent = function dispatchEvent(eventId, eventData) {
				let eventResult = ORIGINAL_FUNC.apply(this, arguments);
				logEvent(eventId, eventData, eventResult);
			};
			for (let prop in ORIGINAL_FUNC) {
				if (ORIGINAL_FUNC.hasOwnProperty(prop)) {
					Blockbench.dispatchEvent[prop] = ORIGINAL_FUNC[prop];
				}
			}
			console.log("Loaded BlockbenchEvent Logger plugin");
		},
		
		onunload() {
			Blockbench.dispatchEvent = ORIGINAL_FUNC;
		}
	});

})();