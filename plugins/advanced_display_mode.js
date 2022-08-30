(function () {
	'use strict';

	const PLUGIN_ID = 'advanced_display_mode';
	const PluginDataStore = {
		dataId: PLUGIN_ID + '_data',
		internalData: {},
		saveData: function () {
			localStorage.setItem(this.dataId, JSON.stringify(this.internalData))
		},
		loadData: function () {
			if (localStorage.getItem(this.dataId) != null) {
				this.internalData = JSON.parse(localStorage.getItem(this.dataId))
			}
		},
		get: function (key) {
			if (key in this.internalData) return this.internalData[key];
			return null;
		},
		set: function (key, data) {
			this.internalData[key] = data;
		},
		remove: function (key) {
			delete this.internalData[key];
		}
	};

	function getCurrentDisplaySlot() {
		return display_slot;
	}

	function getActiveReferenceModel() {
		return displayReferenceObjects.active;
	}

	function onSelectModeEvent(data) {
		if (data.mode.id === 'display') {

		}
	}

	function onUnselectModeEvent(data) {
		if (data.mode.id === 'display') {

		}
	}

	class LaserPointer extends OutlinerElement {
		static type = 'bdm_laser_pointer';
		static {
			this.prototype.title = 'Laser Pointer';
			this.prototype.type = this.type;
			this.prototype.icon = 'flare';
			this.prototype.movable = true;
			this.prototype.scalable = false;
			this.prototype.rotatable = true;
			this.prototype.needsUniqueName = false;
			this.prototype.menu = new Menu([
				'group_elements',
				'_',
				'copy',
				'paste',
				'duplicate',
				'_',
				'rename',
				'toggle_visibility',
				'delete'
			]);
			this.prototype.buttons = [
				Outliner.buttons.locked,
				Outliner.buttons.visibility,
			];

			new Property(LaserPointer, 'string', 'name', { default: this.type })
			new Property(LaserPointer, 'vector', 'origin');
			new Property(LaserPointer, 'vector', 'rotation');
			new Property(LaserPointer, 'vector', 'scale', { default: [1, 1, 1] });
			new Property(LaserPointer, 'boolean', 'visibility', { default: true });
		}

		constructor(data, uuid) {
			super(data, uuid)

			for (var key in LaserPointer.properties) {
				LaserPointer.properties[key].reset(this);
			}
			if (data && typeof data === 'object') {
				this.extend(data)
			}
		}

		get from() {
			return this.origin;
		}

		getWorldCenter() {
			return THREE.fastWorldPosition(this.mesh, Reusable.vec2);
		}

		extend(object) {
			for (var key in LaserPointer.properties) {
				LaserPointer.properties[key].merge(this, object)
			}
			if (typeof object.vertices == 'object') {
				for (let key in object.vertices) {
					this.vertices[key] = [...object.vertices[key]];
				}
			}
			this.sanitizeName();
			return this;
		}

		getUndoCopy() {
			var copy = new LaserPointer(this)
			copy.uuid = this.uuid;
			delete copy.parent;
			return copy;
		}

		getSaveCopy() {
			var el = {}
			for (var key in LaserPointer.properties) {
				LaserPointer.properties[key].copy(this, el)
			}
			el.type = LaserPointer.type;
			el.uuid = this.uuid
			return el;
		}
	}

	class ArmPose {
		static NONE = new ArmPose('None', { right_arm: [0, 0, 0], left_arm: [0, 0, 0] });
		static BOW = new ArmPose('Bow', { right_arm: [Math.PI / 2.0, -0.1, 0], left_arm: [Math.PI / 2.0, 0.1 + 0.4, 0] });
		static CROSSBOW = new ArmPose('Crossbow', { right_arm: [Math.PI / 2.0 + 0.1, -0.3, 0], left_arm: [1.5, 0.6, 0] });
		static TRIDENT = new ArmPose('Trident', { right_arm: [Math.PI, 0, 0], left_arm: [0, 0, 0] });
		static SPYGLASS = new ArmPose('Spyglass', { right_arm: [1.9198622, -0.2617994, 0], left_arm: [0, 0, 0] });
		static BLOCK = new ArmPose('Block', { right_arm: [0.9424779, -Math.PI / 6.0, 0], left_arm: [0, 0, 0] });
		static ITEM = new ArmPose('Item', { right_arm: [Math.PI / 10.0, 0, 0], left_arm: [0, 0, 0] });

		constructor(name, boneAngles) {
			this.name = name;
			this.boneAngles = boneAngles;
		}

		static values() {
			return Object.keys(ArmPose);
		}

		toString() {
			return `ArmPose.${this.name}`;
		}
	}

	class ModelPoseUtil {

		static setPoseAngles(refModel, bone, angleX, angleY, angleZ) {

			const updateMeshRotation = mesh => {
				mesh.rotation.x = angleX;
				mesh.rotation.y = angleY;
				mesh.rotation.z = angleZ;
			}

			const updateChildren = pattern => refModel.model.children.forEach(mesh => {
				if (mesh.name.match(pattern)) {
					updateMeshRotation(mesh);
				}
			});

			if (bone === 'right_arm' || bone === 'thirdperson_righthand') {
				updateChildren(/^right_arm/);
				return;
			}

			if (bone === 'left_arm' || bone === 'thirdperson_lefthand') {
				updateChildren(/^left_arm/);
				return;
			}

			if (bone === 'head') {
				updateChildren(/^head/);
				return;
			}
		}

		static setPoseAnglesAndUpdateDisplayArea(refModel, bone, angleXDeg, angleYDeg, angleZDeg) {

			let angleX = Math.degToRad(angleXDeg);
			let angleY = Math.degToRad(angleYDeg);
			let angleZ = Math.degToRad(angleZDeg);

			const updateDisplayArea = (refModel) => {
				const setDisplayArea = DisplayMode.setBase;
				const currentDisplaySlot = getCurrentDisplaySlot();

				const isRightHand = currentDisplaySlot === 'thirdperson_righthand';
				const isLeftHand = currentDisplaySlot === 'thirdperson_lefthand';
				if (isRightHand || isLeftHand) {
					const armOffset = ((refModel.variant === 'alex' ? 5.5 : 6) - 4) * (isLeftHand ? -1 : 1);
					display_area.position.x = armOffset;
					display_area.position.y = -10;
					display_area.position.z = -2;
					display_area.rotation.x = Math.degToRad(-90);
					display_area.rotation.y = 0;
					display_area.rotation.z = 0;
					display_area.scale.x = 1;
					display_area.scale.y = 1;
					display_area.scale.z = 1;
					display_area.updateMatrixWorld();
					Transformer.center();
				}
				else if (currentDisplaySlot === 'head') {
					setDisplayArea(0, 24 + Math.cos(angleX) * 4, Math.sin(angleX) * 4, angleXDeg, angleZDeg, angleYDeg, 0.625, 0.625, 0.625);
				}
			};

			const updateMeshRotation = mesh => {
				mesh.rotation.x = angleX;
				mesh.rotation.y = angleY;
				mesh.rotation.z = angleZ;
			}

			const updateChildren = pattern => refModel.model.children.forEach(mesh => {
				if (mesh.name.match(pattern)) {
					updateMeshRotation(mesh);
					if (refModel.variant === mesh.r_model) {
						mesh.add(display_area);
					}
				}
			});

			if (bone === 'right_arm' || bone === 'thirdperson_righthand') {
				updateChildren(/^right_arm/);
				updateDisplayArea(refModel);
				return;
			}

			if (bone === 'left_arm' || bone === 'thirdperson_lefthand') {
				updateChildren(/^left_arm/);
				updateDisplayArea(refModel);
				return;
			}

			if (bone === 'head') {
				refModel.model.children.forEach(mesh => {
					if (mesh.name.match(/^head/)) {
						updateMeshRotation(mesh);
					}
				});
				updateDisplayArea(refModel);
			}
		}

		static setupArmPoseSelection() {
			const select = document.createElement("select");
			select.name = "arm-pose";
			select.id = "arm-pose-select";
			select.style = "position: relative; display: flex;margin-right: 2px; margin-top: 2px;";

			ArmPose.values().forEach(key => {
				const option = document.createElement("option");
				option.value = ArmPose[key].name.toUpperCase();
				option.text = ArmPose[key].name;
				select.add(option);
			});
			select.onchange = (event) => {
				ModelPoseUtil.setArmPose(getActiveReferenceModel(), ArmPose[event.target.value]);
			};

			$('#display_sliders').append(`<div id="arm-pose-select-bar" class="bar display_slot_section_bar"><p>Arm Pose (For Preview Only)</p></div>`);
			$('#display_sliders').append(select);
		}

		static removeArmPoseSelection() {
			$('#arm-pose-select-bar').detach();
			$('#arm-pose-select').detach();
		}

		static resetArmPose(refModel) {
			for (const displaySlot of ["thirdperson_righthand", "thirdperson_lefthand"]) {
				const angle = refModel.pose_angles[displaySlot] || 0;
				ModelPoseUtil.setPoseAngles(refModel, displaySlot, Math.degToRad(angle), 0, 0);
			}
			display_area.updateMatrixWorld();
			Transformer.center();
		}

		static setArmPose(refModel, armPose) {
			if (armPose == ArmPose.NONE) {
				ModelPoseUtil.resetArmPose(refModel);
				return;
			}

			if (getCurrentDisplaySlot() === "thirdperson_righthand") {
				for (const [bone, rotation] of Object.entries(armPose.boneAngles)) {
					ModelPoseUtil.setPoseAngles(refModel, bone, rotation[0], rotation[2], rotation[1]);
				}
			}
			else {
				let rightRotation = armPose.boneAngles.right_arm;
				let leftRotation = armPose.boneAngles.left_arm;
				ModelPoseUtil.setPoseAngles(refModel, "right_arm", leftRotation[0], leftRotation[2] * -1, leftRotation[1] * -1);
				ModelPoseUtil.setPoseAngles(refModel, "left_arm", rightRotation[0], rightRotation[2] * -1, rightRotation[1] * -1);
			}

			display_area.updateMatrixWorld();
			Transformer.center();
		}
	}

	class FirstPersonViewOverlay {
		static elementId = "bdm_first_person_view_overlay";
		static #showGoldenRatio = true;
		static #showGuideLines = true;
		static #showGuideCircles = true;

		static init() {
			InjectUtil.injectStyleElement(PLUGIN_ID, "bdm_fpv_overlay_style", FirstPersonViewOverlay.getBaseCSS());
		}

		static remove() {
			$("#" + FirstPersonViewOverlay.elementId).detach();
		}

		static create(side) {
			$('.single_canvas_wrapper').append(FirstPersonViewOverlay.createOverlayDiv(side));
			setTimeout(FirstPersonViewOverlay.calculateOverlayDimensions, 5);
		}

		static getBaseCSS() {
			return `
			#${FirstPersonViewOverlay.elementId} {
				--width: 800px;
				--height: 500px;

				position: absolute;
				left: calc((100% - var(--width)) / 2);
				top: calc((100% - var(--height)) / 2);
				width: var(--width);
				height: var(--height);

				/*background-color: rgb(125 0 0 / 50%);*/
				pointer-events: none;
			}

			.bdm_fpv_overlay {
				position: absolute;
				width: 100%;
				height: 100%;
			}
			`;
		}

		static showGoldenRatio(bool) {
			FirstPersonViewOverlay.#showGoldenRatio = bool;

			const el = document.getElementById("bdm_golden_ratio");
			el.style.display = bool ? "block" : "none";
		}

		static showGuideLines(bool) {
			FirstPersonViewOverlay.#showGuideLines = bool;

			const el = document.getElementById("bdm_guide_lines");
			el.style.display = bool ? "block" : "none";
		}

		static showGuideCircles(bool) {
			FirstPersonViewOverlay.#showGuideCircles = bool;

			const el = document.getElementById("bdm_guide_circles");
			el.style.display = bool ? "block" : "none";
		}

		static createOverlayDiv(side) {
			const right = `
			<line x1="61.8%" y1="0%" x2="61.8%" y2="100%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="2" />
			<line x1="61.8%" y1="61.8%" x2="100%" y2="61.8%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="2" />
			<line x1="76.4%" y1="61.8%" x2="76.4%" y2="100%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="1" />
			<line x1="61.8%" y1="76.4%" x2="76.4%" y2="76.4%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="1" />
			`;
			const left = `
			<line x1="38.2%" y1="0%" x2="38.2%" y2="100%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="2" />
			<line x1="0%" y1="61.8%" x2="38.2%" y2="61.8%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="2" />
			<line x1="23.6%" y1="61.8%" x2="23.6%" y2="100%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="1" />
			<line x1="23.6%" y1="76.4%" x2="38.2%" y2="76.4%" stroke="rgb(255 215 0 / 50%)" stroke-dasharray="4" stroke-width="1" />
			`;
			side = side === "right" ? right : left;

			const displayGoldenRatio = FirstPersonViewOverlay.#showGoldenRatio ? "block" : "none";
			const displayGuideLines = FirstPersonViewOverlay.#showGuideLines ? "block" : "none";
			const displayGuideCircles = FirstPersonViewOverlay.#showGuideCircles ? "block" : "none";

			return `
			<div data-plugin-id="${PLUGIN_ID}" id="${FirstPersonViewOverlay.elementId}">
				<svg id="bdm_golden_ratio" class="bdm_fpv_overlay" width="100%" height="100%" style="display: ${displayGoldenRatio}" version="1.1" xmlns="http://www.w3.org/2000/svg">
					${side}
				</svg>
				<svg id="bdm_guide_lines" class="bdm_fpv_overlay" width="100%" height="100%" style="display: ${displayGuideLines}" version="1.1" xmlns="http://www.w3.org/2000/svg">
					<line x1="0%" y1="50%" x2="100%" y2="50%" stroke="white" stroke-width="0.65" style="transform-origin: center; transform: rotate(45deg);" />
					<line x1="0%" y1="50%" x2="100%" y2="50%" stroke="white" stroke-width="0.65" style="transform-origin: center; transform: rotate(-45deg);" />
				</svg>
				<svg id="bdm_guide_circles" class="bdm_fpv_overlay" width="100%" height="100%" style="display: ${displayGuideCircles}" version="1.1" xmlns="http://www.w3.org/2000/svg">
					<circle cx="50%" cy="50%" r="23%" stroke="green" fill="none" />
					<circle cx="50%" cy="50%" r="37%" stroke="green" fill="none" />
				</svg>
			</div>
			`;
		}

		static calculateOverlayDimensions() {
			const camera = display_preview.camera;

			let boundingBoxes = [];
			displayReferenceObjects.active.model.children.forEach(mesh => {
				mesh.updateMatrixWorld();
				mesh.geometry.computeBoundingBox();
				let boundingBox = mesh.geometry.boundingBox.clone();
				boundingBox.applyMatrix4(mesh.matrixWorld);
				boundingBoxes.push(boundingBox);
			});

			let intersectionBoxes = [];
			let oppositeIndex = 0;
			for (let index = 1; index < boundingBoxes.length; index++) {
				const intersection = boundingBoxes[0].clone().intersect(boundingBoxes[index]);
				if (intersection.isEmpty()) oppositeIndex = index;
				else intersectionBoxes.push(intersection);
			}

			for (let index = 1; index < boundingBoxes.length; index++) {
				if (index == oppositeIndex) continue;
				const intersection = boundingBoxes[oppositeIndex].clone().intersect(boundingBoxes[index]);
				if (!intersection.isEmpty()) intersectionBoxes.push(intersection);
			}

			const pickPos = (bbox) => {
				let distXMin = Math.abs(bbox.min.x - camera.position.x);
				let distXMax = Math.abs(bbox.max.x - camera.position.x);

				let distYMin = Math.abs(bbox.min.y - camera.position.y);
				let distYMax = Math.abs(bbox.max.y - camera.position.y);

				let distZMin = Math.abs(bbox.min.z - camera.position.z);
				let distZMax = Math.abs(bbox.max.z - camera.position.z);

				let pos = new THREE.Vector3();
				pos.x = distXMin < distXMax ? bbox.min.x : bbox.max.x; //get closest
				pos.y = distYMin < distYMax ? bbox.min.y : bbox.max.y; //get closest
				pos.z = distZMin >= distZMax ? bbox.min.z : bbox.max.z; //get furthest
				return pos;
			};

			const screenSize = new THREE.Box3();
			for (let bBox of intersectionBoxes) {
				screenSize.expandByPoint(pickPos(bBox));
			}

			// const b3h = new THREE.Box3Helper(finalBBox.clone(), 0xffff00);
			// scene.add(b3h);

			const canvasEl = document.querySelector("#preview > div > div.preview > canvas");
			const convertToCanvasPos = (pos) => {
				pos.x = Math.round((0.5 + pos.x / 2.0) * (canvasEl.width / window.devicePixelRatio));
				pos.y = Math.round((0.5 - pos.y / 2.0) * (canvasEl.height / window.devicePixelRatio));
				pos.z = 0;
			};

			screenSize.min.project(camera);
			screenSize.max.project(camera);
			convertToCanvasPos(screenSize.min);
			convertToCanvasPos(screenSize.max);

			const dimension = screenSize.max.sub(screenSize.min);
			dimension.x = Math.abs(dimension.x);
			dimension.y = Math.abs(dimension.y);

			const el = document.getElementById(FirstPersonViewOverlay.elementId);
			el.style.setProperty("--width", dimension.x + "px");
			el.style.setProperty("--height", dimension.y + "px");
		}
	}

	function createCustomPlayerRefModelFrom(originalPlayerRefModel) {
		const mimic = {};
		Object.setPrototypeOf(mimic, originalPlayerRefModel);

		mimic.pose_angles = {
			thirdperson_righthand: 90,
			thirdperson_lefthand: 22.5,
			head: 0
		};

		mimic.updateBasePosition = function () {
			const currentDisplaySlot = getCurrentDisplaySlot();
			const angle = this.pose_angles[currentDisplaySlot] || 0;
			ModelPoseUtil.resetArmPose(this);
			ModelPoseUtil.setPoseAnglesAndUpdateDisplayArea(this, currentDisplaySlot, angle, 0, 0);
		};

		mimic.load = function (index) {
			const currentDisplaySlot = getCurrentDisplaySlot();
			displayReferenceObjects.ref_indexes[currentDisplaySlot] = index || 0;
			displayReferenceObjects.clear();
			this.updateBasePosition();

			if (!this.initialized) {
				this.buildPlayer();
				this.initialized = true;
			}
			scene.add(this.model);
			displayReferenceObjects.active = this;

			DisplayMode.vue.pose_angle = this.pose_angles[currentDisplaySlot] || 0;
			DisplayMode.vue.reference_model = this.id;

			ModelPoseUtil.removeArmPoseSelection();
			ModelPoseUtil.setupArmPoseSelection();

			display_preview.loadBackground();
		};

		return mimic;
	}

	let ORIGINAL_PLAYER_REF_MODEL;
	function replaceDisplayRefPlayerModel() {
		ORIGINAL_PLAYER_REF_MODEL = displayReferenceObjects.refmodels.player;
		displayReferenceObjects.refmodels.player = createCustomPlayerRefModelFrom(ORIGINAL_PLAYER_REF_MODEL);
	}

	function restoreDisplayRefPlayerModel() {
		displayReferenceObjects.refmodels.player = ORIGINAL_PLAYER_REF_MODEL;
	}

	function resetDisplayArea() {
		//reset display area
		scene.add(display_area);
		display_area.updateMatrixWorld();
		Transformer.center();

		ModelPoseUtil.removeArmPoseSelection();
	}

	class DisplayLoadHandler {
		static preLoad() {
			FirstPersonViewOverlay.remove();
			resetDisplayArea();
		}
		static #before() {

		}
		static loadFirstRight() {
			DisplayLoadHandler.#before();
			FirstPersonViewOverlay.create("right");
		}
		static loadFirstLeft() {
			DisplayLoadHandler.#before();
			FirstPersonViewOverlay.create("left");
		}
		static loadThirdRight() {
			DisplayLoadHandler.#before();
			DisplayLoadHandler.#onLoadThirdPersonDisplay(true);
		}
		static loadThirdLeft() {
			DisplayLoadHandler.#before();
			DisplayLoadHandler.#onLoadThirdPersonDisplay(false);
		}
		static #onLoadThirdPersonDisplay(isRightArm) {
			const refModel = getActiveReferenceModel();
			if (refModel.id === 'player') {
				refModel.updateBasePosition();
			}
		}
		static loadHead() {
			DisplayLoadHandler.#before();
			const refModel = getActiveReferenceModel();
			if (refModel.id === 'player') {
				refModel.updateBasePosition();
			}
		}
		static loadGUI() {
			DisplayLoadHandler.#before();
		}
		static loadGround() {
			DisplayLoadHandler.#before();
		}
		static loadFixed() {
			DisplayLoadHandler.#before();
		}
	}

	class InjectUtil {

		static #ORIGINAL_OBJECT_FUNCTIONS = new Map();

		static decorateObjectFunction(obj, funcName, preFunc, postFunc) {
			const originalFunc = obj[funcName];
			obj[funcName] = function () {
				if (preFunc) preFunc(arguments);
				originalFunc.apply(this, arguments);
				if (postFunc) postFunc(arguments);
			};
			for (let prop in originalFunc) {
				if (originalFunc.hasOwnProperty(prop)) {
					obj[funcName][prop] = originalFunc[prop];
				}
			}

			if (!this.#ORIGINAL_OBJECT_FUNCTIONS.get(obj)) this.#ORIGINAL_OBJECT_FUNCTIONS.set(obj, new Map())
			this.#ORIGINAL_OBJECT_FUNCTIONS.get(obj).set(funcName, originalFunc);
		}

		static removeDecoratedObjectFunctions() {
			this.#ORIGINAL_OBJECT_FUNCTIONS.forEach((objFuncMap, obj) => {
				objFuncMap.forEach((originalFunc, funcName) => {
					obj[funcName] = originalFunc;
				});
			});
		}

		static injectStyleElement(pluginId, elementId, css) {
			let oldStyle = document.getElementById(elementId);
			if (oldStyle != null) oldStyle.remove();

			let style = document.createElement('style');
			style.setAttribute('type', 'text/css');
			style.setAttribute('id', elementId);
			style.dataset.pluginId = pluginId;
			style.appendChild(document.createTextNode(css));

			const head = document.getElementsByTagName('head')[0];
			head.appendChild(style);
		}

		static removeAllStyleElementsBy(pluginId) {
			let styles = document.querySelectorAll(`style[data-plugin-id=${pluginId}]`);
			styles.forEach((el) => {
				el.remove();
			});
		}

		static removeAllHtmlElementsBy(pluginId) {
			let styles = document.querySelectorAll(`[data-plugin-id=${pluginId}]`);
			styles.forEach((el) => {
				el.remove();
			});
		}
	}

	class PluginUtil {
		static createAboutSubMenu() {
			let subMenu = this.getAboutSubMenu();
			if (!subMenu) {
				subMenu = new Action("about_plugins", {
					name: "About Plugins...",
					icon: "info",
					children: []
				});
				MenuBar.addAction(subMenu, "help");
			}
		}

		static getAboutSubMenu() {
			return MenuBar.menus.help.structure.find(e => e.id === "about_plugins");
		}

		static addAboutAction(action) {
			const subMenu = this.getAboutSubMenu();
			subMenu.children.push(action);
		}
	}

	let addLaserPointerAction;
	let toggleGoldenRatioAction;
	let toggleGuideLinesAction;
	let toggleGuideCirclesAction;
	let showPluginAboutAction;

	Plugin.register(PLUGIN_ID, {
		title: 'Advanced Display Mode',
		author: 'Elenterius',
		description: 'Provides additional features to the display mode.',
		about: "This plugin adds guide lines to the first person display preview and adds a selection of the minecraft arm poses (crossbow holding, bow holding, trident throwing, etc.) to the third person display preview.",
		icon: 'display_settings',
		tags: ["Minecraft", "Display"],
		version: '0.0.1',
		min_version: "4.3.0",
		max_version: "5.0.0",
		variant: 'both',

		onload() {
			PluginUtil.createAboutSubMenu();
			showPluginAboutAction = new Action(`about_${PLUGIN_ID}`, {
				name: `About Advanced Display Mode...`,
				icon: 'display_settings',
				click: () => {
					new Dialog({
						id: "about",
						title: 'Advanced Display Mode v0.0.1',
						width: 800,
						buttons: [],
						lines: [`
						<style>
							dialog#about ul {
								text-align: start!important;
							}
							dialog#about li > ul {
								margin-left: 1.5rem;
							}
							dialog#about li:before {
								content: "-";
								margin-right: 1rem;
							}
							dialog#about .sections {
								display: flex;
							}
							dialog#about .sections h3 {
								margin: 10px 0;
							}
							dialog#about .sub-section {
								display: flex;
								align-items: center;
								flex-direction: column;
								padding: 0.5rem;
								flex: 1;
							}
						</style>
						<div id="content">
							<h1>Advanced Display Mode</h1>
							<h2>Authors</h2>
							<p>
							Elenterius
							</p>

							<h2>Features</h2>
							<div class="sections">
								<div class="sub-section">
									<h3>Edit Mode</h3>
									<ul>
										<li>laser pointer object for aligning the barrel in the first person display view to the crosshair</li>
									</ul>
								</div>
								<div class="sub-section">
									<h3>First Person Display</h3>
									<ul>
										<li>45 degree lines overlay</li>
										<li>circles overlay</li>
										<li>golden ratio lines overlay</li>
									</ul>
								</div>
								<div class="sub-section">
									<h3>Third Person Display</h3>
									<ul>
										<li>
											arm pose preview
											<ul>
												<li>crossbow holding</li>
												<li>bow holding</li>
												<li>blocking</li>
												<li>trident throwing</li>
												<li>spyglass holding</li>
											</ul>
										</li>
									</ul>
								</div>
							</div>
						</div>
						`]
					}).show();
				}
			});
			PluginUtil.addAboutAction(showPluginAboutAction);

			Blockbench.on('select_mode', onSelectModeEvent);
			Blockbench.on('unselect_mode', onUnselectModeEvent);

			InjectUtil.decorateObjectFunction(DisplayMode, 'loadThirdRight', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadThirdRight);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadThirdLeft', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadThirdLeft);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadFirstRight', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadFirstRight);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadFirstLeft', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadFirstLeft);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadHead', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadHead);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadGUI', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadGUI);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadGround', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadGround);
			InjectUtil.decorateObjectFunction(DisplayMode, 'loadFixed', DisplayLoadHandler.preLoad, DisplayLoadHandler.loadFixed);

			InjectUtil.decorateObjectFunction(window, 'exitDisplaySettings', resetDisplayArea, null);

			for (const [key, refModel] of Object.entries(displayReferenceObjects.refmodels)) {
				InjectUtil.decorateObjectFunction(refModel, 'load', resetDisplayArea, null);
			}

			replaceDisplayRefPlayerModel();

			FirstPersonViewOverlay.init();

			OutlinerElement.registerType(LaserPointer, LaserPointer.type);

			const lineMaterial = new THREE.LineBasicMaterial({
				color: 0x00dd00,
				linewidth: 1
			});

			new NodePreviewController(LaserPointer, {
				setup(element) {
					const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2000)];
					const geometry = new THREE.BufferGeometry().setFromPoints(points);
					const group = new THREE.Group();
					group.add(new THREE.Line(geometry, lineMaterial));

					Project.nodes_3d[element.uuid] = group;
					group.name = element.uuid;
					group.type = element.type;
					group.isElement = true;

					// Update
					this.updateTransform(element);
					group.visible = element.visibility;

					this.dispatchEvent('setup', { element });
				}
			});

			addLaserPointerAction = new Action('add_laser_pointer', {
				name: 'Add Laser Pointer',
				icon: 'flare',
				category: 'edit',
				condition: () => { return Format.display_mode && Modes.edit },
				click: function () {
					const objs = [];
					Undo.initEdit({ elements: objs, outliner: true });
					const laserPointer = new LaserPointer().addTo(Group.selected || selected[0]).init();
					laserPointer.select().createUniqueName();
					objs.push(laserPointer);
					Undo.finishEdit('Add laser pointer');
					Vue.nextTick(function () {
						if (settings.create_rename.value) {
							laserPointer.rename();
						}
					});
				}
			});
			Interface.Panels.outliner.menu.addAction(addLaserPointerAction, '3');
			MenuBar.menus.edit.addAction(addLaserPointerAction, '6');

			const validObjIds = new Set(['monitor', 'bow', 'crossbow']);
			toggleGoldenRatioAction = new Toggle('bdm_show_golden_ratio', {
				name: 'Golden Ratio Overlay',
				category: 'preview',
				default: true,
				condition: () => (display_mode && validObjIds.has(displayReferenceObjects.active.id)),
				onChange: (bool) => FirstPersonViewOverlay.showGoldenRatio(bool)
			});
			toggleGuideLinesAction = new Toggle('bdm_show_guide_lines', {
				name: '45 degree lines Overlay',
				category: 'preview',
				default: true,
				condition: () => (display_mode && validObjIds.has(displayReferenceObjects.active.id)),
				onChange: (bool) => FirstPersonViewOverlay.showGuideLines(bool)
			});
			toggleGuideCirclesAction = new Toggle('bdm_show_guide_circles', {
				name: 'Circles Overlay',
				category: 'preview',
				default: true,
				condition: () => (display_mode && validObjIds.has(displayReferenceObjects.active.id)),
				onChange: (bool) => FirstPersonViewOverlay.showGuideCircles(bool)
			});

			Preview.prototype.menu.addAction(toggleGoldenRatioAction);
			Preview.prototype.menu.addAction(toggleGuideLinesAction);
			Preview.prototype.menu.addAction(toggleGuideCirclesAction);
		},

		onunload() {
			Blockbench.removeListener('select_mode', onSelectModeEvent);
			Blockbench.removeListener('unselect_mode', onUnselectModeEvent);

			restoreDisplayRefPlayerModel();

			InjectUtil.removeDecoratedObjectFunctions();
			InjectUtil.removeAllHtmlElementsBy(PLUGIN_ID);

			addLaserPointerAction.delete();
			toggleGoldenRatioAction.delete();
			toggleGuideLinesAction.delete();
			toggleGuideCirclesAction.delete();

			showPluginAboutAction.delete();
			MenuBar.removeAction(`help.about_plugins.about_${PLUGIN_ID}`);
		}
	});

})();