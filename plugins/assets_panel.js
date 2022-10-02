/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 */

(function () {
	"use strict";

	const PLUGIN_ID = 'assets_panel';

	class FSUtil {
		static SUB_FOLDERS = [];

		static getPluginFolderPath() {
			return PathModule.join(app.getPath('userData'), 'plugins', PLUGIN_ID);
		}

		static getSubFolderPath(subfolderName) {
			return PathModule.join(FSUtil.getPluginFolderPath(), subfolderName);
		}

		static makeSubFolder(folderName) {
			const path = PathModule.join(FSUtil.getPluginFolderPath(), folderName);
			if (!fs.existsSync(path)) fs.mkdirSync(path);
		}

		static setupFolderStructure() {
			const path = FSUtil.getPluginFolderPath();
			if (!fs.existsSync(path)) fs.mkdirSync(path);

			FSUtil.SUB_FOLDERS.forEach(FSUtil.makeSubFolder);
		}

		static deletePluginFolder() {
			const folderPath = FSUtil.getPluginFolderPath();
			if (!fs.existsSync(folderPath)) return;

			try {
				fs.rmSync(folderPath, { recursive: true, force: true });
			}
			catch (e) {
				console.error(`[${PLUGIN_ID}] Failed to delete plugin folder`, e);
			}
		}
	}

	class MultiMapArray {
		#map;

		constructor(iterable) {
			this.#map = new Map(iterable);
		}

		#computeDefault(key) {
			const value = [];
			this.set(key, value);
			return value;
		}

		has(key) {
			return this.#map.has(key);
		}

		/**
		 * @param {*} key
		 * @param {function} computeDefault
		 * @returns {*[]}
		 */
		get(key, computeDefault = this.#computeDefault) {
			const array = this.#map.get(key);
			return array ? array : computeDefault(key);
		}

		/**
		 * @param {*} key
		 * @param {*[]} value
		 */
		set(key, value) {
			this.#map.set(key, value);
		}

		add(key, value) {
			const array = this.get(key);
			return array.push(value);
		}

		addIf(key, value, predicate) {
			const array = this.get(key);
			if (predicate(array)) {
				array.push(value);
				return true;
			}
			return false;
		}

		delete(key) {
			return this.#map.delete(key);
		}

		removeValue(key, value) {
			return this.#map.get(key)?.remove(value) || false;
		}

		keys() {
			return this.#map.keys();
		}

		/**
		 * @returns {IterableIterator<[any, any[]]>}
		 */
		entries() {
			return this.#map.entries();
		}

		toArray() {
			return Array.from(this.#map);
		}
	}

	class AssetCategoryHandler {
		static #STORE_KEY = `${PLUGIN_ID}.assets_categories`;
		static #INSTANCE;
		#CATEGORY_ASSETS;
		#CATEGORY_IDS;

		constructor() {
			this.#CATEGORY_ASSETS = new MultiMapArray();
			this.#CATEGORY_IDS = [];
		}

		/**
		 * @returns {AssetCategoryHandler}
		 */
		static get instance() {
			if (!AssetCategoryHandler.#INSTANCE) {
				AssetCategoryHandler.#INSTANCE = new AssetCategoryHandler();
			}
			return AssetCategoryHandler.#INSTANCE;
		}

		deserialize() {
			let storedValue = localStorage.getItem(AssetCategoryHandler.#STORE_KEY);
			if (typeof storedValue == 'string') {
				try {
					storedValue = JSON.parse(storedValue);
				} catch (ignored) {
					localStorage.removeItem(AssetCategoryHandler.#STORE_KEY);
				}
			}

			if (storedValue != null) {
				const deserialized = storedValue.map(([categoryId, assets]) => [categoryId, assets.map(obj => Asset.fromJSON(obj))]);
				this.#CATEGORY_ASSETS = new MultiMapArray(deserialized);
				this.#CATEGORY_IDS.length = 0; //clear array
				this.#CATEGORY_IDS.safePush(...this.#CATEGORY_ASSETS.keys());
			}
			else {
				this.#CATEGORY_ASSETS = new MultiMapArray();
				this.#CATEGORY_IDS.length = 0; //clear array
			}
		}

		serialize() {
			const serialized = JSON.stringify(this.#CATEGORY_ASSETS.toArray());
			localStorage.setItem(AssetCategoryHandler.#STORE_KEY, serialized);
		}

		deleteAllData() {
			localStorage.removeItem(AssetCategoryHandler.#STORE_KEY);
			AssetCategoryHandler.#INSTANCE = null;
			FSUtil.deletePluginFolder();
		}

		deleteUnusedData() {
			this.serialize();

			const thumbnailNames = new Set();
			for (let [_categoryId, assets] of this.#CATEGORY_ASSETS.entries()) {
				assets.forEach(a => thumbnailNames.add(a.getPathHash()));
			}
			const folderPath = FSUtil.getSubFolderPath(Asset.THUMBNAILS_FOLDER_NAME);
			fs.readdir(folderPath, (err, files) => {
				if (!err) {
					files.forEach(fileName => {
						if (!thumbnailNames.has(fileName.replace(/\..+$/, ''))) {
							try {
								const filePath = PathModule.join(folderPath, fileName);
								const lastModifiedTime = fs.statSync(filePath).mtime;
								const elapsedTime = Date.now() - lastModifiedTime;
								if (elapsedTime / 3.6e+6 >= 24) fs.unlinkSync(filePath); //delete unused thumbnails that are older then 24hrs
							}
							catch (e) {
								console.error(`[${PLUGIN_ID}] Failed to delete unused asset thumbnail`, e);
							}
						}
					});
				}
			});

			AssetCategoryHandler.#INSTANCE = null;
		}

		#onChange() {
			this.serialize();
		}

		/**
		 * @param {string} categoryId
		 * @param {Asset} asset
		 */
		addAssetToCategory(categoryId, asset) {
			if (!this.#CATEGORY_ASSETS.has(categoryId)) return;

			if (this.#CATEGORY_ASSETS.addIf(categoryId, asset, (v) => !v.find(x => x.path === asset.path))) {
				this.#onChange();
			}
		}

		/**
		 * @param {string} categoryId
		 * @returns nullable categoryId
		 */
		addCategory(categoryId) {
			if (this.#CATEGORY_ASSETS.has(categoryId)) return null;

			this.#CATEGORY_ASSETS.set(categoryId, []);
			this.#CATEGORY_IDS.push(categoryId);

			this.#onChange();

			return categoryId;
		}

		/**
		 * @param {string} categoryId
		 */
		removeCategory(categoryId) {
			this.#CATEGORY_IDS.remove(categoryId);
			this.#CATEGORY_ASSETS.delete(categoryId);

			this.#onChange();
		}

		/**
		 * @param {string} categoryId
		 * @param {Asset} asset
		 */
		removeAssetFromCategory(categoryId, asset) {
			if (this.#CATEGORY_ASSETS.removeValue(categoryId, asset)) {
				this.#onChange();
			}
		}

		/**
		 * @returns {string[]}
		 */
		getCategories() {
			return this.#CATEGORY_IDS;
		}

		/**
		 * @param {string} categoryId
		 * @returns {Asset[]}
		 */
		getAssetsBy(categoryId) {
			return this.#CATEGORY_ASSETS.get(categoryId, () => []);
		}

		/**
		 * @param {Asset} asset
		 * @returns {Set<string>}
		 */
		getCategoriesByAsset(asset) {
			const categories = new Set();
			for (let [categoryId, assets] of this.#CATEGORY_ASSETS.entries()) {
				if (assets.find(x => x.path === asset.path)) {
					categories.add(categoryId);
				}
			}
			return categories;
		}

		/**
		 * @param {ModelProject} modelProject
		 * @returns {Map<string,Asset[]>}
		 */
		getAssociatedAssets(modelProject) {
			const path = modelProject.export_path || modelProject.save_path;
			const foundAssets = new Map();
			for (let [categoryId, assets] of this.#CATEGORY_ASSETS.entries()) {
				const asset = assets.find(x => x.path == path);
				if (asset) {
					foundAssets.set(categoryId, asset);
				}
			}
			return foundAssets;
		}
	}

	class Asset {
		static THUMBNAILS_FOLDER_NAME;
		static {
			this.THUMBNAILS_FOLDER_NAME = 'thumbnails';
			FSUtil.SUB_FOLDERS.safePush(this.THUMBNAILS_FOLDER_NAME);
		}

		/**
		 * @param {string} name
		 * @param {string} path
		 * @param {string} icon
		 * @param {number} timestamp
		 */
		constructor(name, path, modelFormatId, timestamp, compiledModelHash) {
			if (name.length > 48) name = name.substr(0, 20) + '...' + name.substr(-20);

			this.name = name;
			this.path = path;
			this.modelFormatId = modelFormatId;
			this.timestamp = timestamp || Date.now();

			this.tempId = this.#getTempId();

			this.compiledModelHash = compiledModelHash;
		}

		get icon() {
			return Formats[this.modelFormatId]?.icon || 'icon-blockbench_file';
		}

		get modelFormatName() {
			return Formats[this.modelFormatId]?.name || this.modelFormatId;
		}

		static fromJSON(jsonObj) {
			return new Asset(jsonObj.name, jsonObj.path, jsonObj.modelFormatId, jsonObj.timestamp, jsonObj.compiledModelHash);
		}

		toJSON() {
			return { name: this.name, path: this.path, modelFormatId: this.modelFormatId, timestamp: this.timestamp, compiledModelHash: this.compiledModelHash };
		}

		#getTempId() {
			return this.getPathHash() + '-' + this.timestamp;
		}

		getPathHash() {
			return this.path.hashCode().toString().replace(/^-/, '0');
		}

		getThumbnailPath() {
			return PathModule.join(FSUtil.getSubFolderPath(Asset.THUMBNAILS_FOLDER_NAME), `${this.getPathHash()}.png`);
		}

		getThumbnailSrc() {
			const path = this.getThumbnailPath();
			if (fs.existsSync(path)) return path + '?' + this.timestamp;
		}

		hasThumbnail() {
			return fs.existsSync(this.getThumbnailPath()) ? true : false;
		}

		fileExists() {
			return fs.existsSync(this.path);
		}

		updateTimestamp() {
			this.timestamp = Date.now();
			this.tempId = this.#getTempId(); //this forces vue to replace the element
		}

		refresh() {
			if (fs.existsSync(this.path)) {
				const scope = this;
				Blockbench.read([this.path], {}, files => {
					const bbModel = autoParseJSON(files[0].content);
					scope.modelFormatId = bbModel.meta?.model_format;
					scope.compiledModelHash = JSON.stringify(bbModel).hashCode();
					scope.updateTimestamp();
				});
			}
			else {
				this.updateTimestamp();
			}
		}
	}

	class ModelProjectUtil {
		static getActive() {
			return Project;
		}
		static getAll() {
			return ModelProject.all;
		}

		/**
		 * @param {ModelProject} modelProject
		 */
		static updateAssetsFor(modelProject) {
			ModelProjectUtil.runInProjectEnv(modelProject, () => {
				const compiledModel = Codecs.project.compile({ compressed: false, backup: false, raw: true });
				ModelProjectUtil.updateAssets(modelProject, compiledModel);
			});
		}

		/**
		 * @param {ModelProject} modelProject
		 * @param {object} compiledModel
		 */
		static updateAssets(modelProject, compiledModel) {
			if (Outliner.elements.length == 0) return;

			let assets = AssetCategoryHandler.instance.getAssociatedAssets(modelProject);
			if (assets.size < 1) return;

			const compiledModelHash = JSON.stringify(compiledModel).hashCode();

			assets = Array.from(assets.values()).filter(a => a.compiledModelHash != compiledModelHash);
			if (assets.size < 1) return;

			assets.forEach(a => {
				a.modelFormatId = compiledModel.meta?.model_format;
				a.compiledModelHash = compiledModelHash;
				a.updateTimestamp();
			});

			ModelProjectUtil.#createThumbnail(assets);
		}

		/**
		 * @param {Asset[]} assets
		 */
		static async #createThumbnail(assets) {
			MediaPreview.resize(180, 100);
			MediaPreview.loadAnglePreset(DefaultCameraPresets[0]);
			MediaPreview.setFOV(30);
			MediaPreview.controls.target.fromArray(getSelectionCenter(true));
			MediaPreview.controls.target.add(scene.position);

			const box = Canvas.getModelSize();
			MediaPreview.camera.position.multiplyScalar(Math.max(box[0], box[1] * 2) / 50);

			await new Promise((resolve, _reject) => {
				MediaPreview.screenshot({ crop: false }, url => {
					const uniquePaths = new Set(assets.map(a => a.getThumbnailPath()));
					uniquePaths.forEach(path => {
						try {
							Blockbench.writeFile(path, { savetype: 'image', content: url });
							console.info(`[${PLUGIN_ID}] Saved asset thumbnail at ${path}`);
						}
						catch (e) {
							console.warn(`[${PLUGIN_ID}] Failed to save asset thumbnail at ${path}`, e);
						}
					});

					assets.forEach(a => a.updateTimestamp());
					resolve();
				});
			});
		}

		/**
		 * Most Blockbench functions that do project specific tasks only work with the currently active project.
		 *
		 * This is partially caused by them using global variables such as "Project" and other things.
		 *
		 * This helper function makes sure that the passed in function is called with the provided project being active.
		 * @param {ModelProject} modelProject the env to use for the function call
		 * @param {function} func function to call
		 * @returns result of calling fun
		 */
		static runInProjectEnv(modelProject, func) {
			const activeProject = ModelProjectUtil.getActive();
			if (modelProject == activeProject) {
				return func();
			}
			else {
				modelProject.select(); //make the passed in project active
				let result;
				try {
					result = func();
				}
				catch (e) {
					console.error(`[${PLUGIN_ID}] Failed to execute function ${func} with ${modelProject.name} project as its env`, e);
					//this makes sure the previous active project is restored even if an exception was thrown
				}

				activeProject.select(); //restore previous active project

				return result;
			}
		}

		/**
		 * @param {FileResult} file
		 */
		static findCodecForFile(file) {
			const extension = pathToExtension(file.path);

			const isCompatible = (codec, type, content) => {
				if (codec.load_filter && codec.load_filter.type == type) {
					if (codec.load_filter.extensions.includes(extension) && Condition(codec.load_filter.condition, content)) {
						return true;
					}
				}
				return false;
			}

			for (let id in Codecs) {
				const codec = Codecs[id];
				if (isCompatible(codec, 'text', file.content)) return codec;
			}

			const model = autoParseJSON(file.content);
			for (let id in Codecs) {
				const codec = Codecs[id];
				if (isCompatible(codec, 'json', model)) return codec;
			}

			return null;
		}
	}

	function onProjectClose(_data) {
		if (Project.saved) {
			let assets = Array.from(AssetCategoryHandler.instance.getAssociatedAssets(Project).values());
			if (assets.find(a => !a.compiledModelHash || !a.hasThumbnail())) {
				ModelProjectUtil.updateAssetsFor(Project);
			}
		}
	}
	function onProjectSave(_data) { }
	function onProjectCompile(data) {
		if (!data.options.backup && Project) {
			ModelProjectUtil.updateAssets(Project, data.model); // data.model == compiledModel
		}
	}
	function onProjectSelect(_data) { }

	/**
	 * called after bbmodel project was loaded or merged
	 */
	function onProjectParsed(data) {
		setTimeout(() => {
			ModelProjectUtil.updateAssets(Project, data.model); // data.model == compiledModel
		}, 100);
	}

	let assetsPanel;
	let assetsToolbar;
	let actionAddAssetCategory;
	let actionDeleteAssetCategory;
	let actionAddProjectToCategory;

	let styles;

	Plugin.register(PLUGIN_ID, {
		title: 'Assets Panel',
		icon: 'photo_album',
		author: 'Elenterius',
		description: 'This plugin adds an Assets Panel which displays all models from a specified collection.',
		tags: ["UI", "UX", "Model Import"],
		version: '0.0.2',
		variant: 'desktop',

		onload() {
			FSUtil.setupFolderStructure();
			StateMemory.init('assets_list_type', 'string'); //tracks how assets are displayed: grid or list layout?
			AssetCategoryHandler.instance.deserialize();

			Blockbench.on('select_project', onProjectSelect);
			Blockbench.on('save_project', onProjectSave);
			Blockbench.on('close_project', onProjectClose);
			Codecs.project.on('compile', onProjectCompile);
			Codecs.project.on('parsed', onProjectParsed);

			styles = Blockbench.addCSS(`
			#assets-panel #assets_view_menu {
				display: flex;
				flex-wrap: wrap;
				margin: 0 5px;
				margin-top: 5px;
			}
			#assets-panel #assets_view_menu .flex-end {
				display: flex;
				justify-content: end;
			}
			#assets-panel #assets_view_menu li.selected {
				border-bottom: 3px solid var(--color-accent);
			}
			#assets-panel #assets_view_menu .tool {
				height: 30px;
			}
			#assets-panel #assets_view_menu .search_bar {
				min-width: 38px;
				flex: 1;
			}

			#assets-panel ul {
				overflow-y: auto;
				grid-template-columns: repeat(auto-fit, minmax(160px ,1fr));
				grid-gap: 5px;
				margin-left: 10px;
			}
			#assets-panel ul.assets_list_grid {
				display: grid;
				margin-left: 0;
			}

			#assets-panel .asset {
				margin: 2px 0;
				display: flex;
				cursor: pointer;
			}
			#assets-panel .asset:hover {
				color: var(--color-light);
			}
			#assets-panel .asset .icon_wrapper {
				flex-shrink: 0;
				margin-top: 1px;
			}
			#assets-panel .asset_name {
				font-size: 1.1em;
				overflow-x: hidden;
				flex-shrink: 0;
				flex-grow: 1;
				margin: 0 4px;
			}
			#assets-panel .asset_model_format {
				flex-shrink: 0;
				color: var(--color-subtle_text);
			}

			#assets-panel .asset.thumbnail {
				display: flex;
				flex-direction: column;
				gap: 0.25em;
				margin: 0;
				position: relative;
				background-color: var(--color-back);
				border: 1px solid transparent;
				cursor: pointer;
			}
			#assets-panel .asset.thumbnail .thumbnail_image {
				display: block;
				max-width: 160px;
				max-height: 100px;
				min-height: 100px;
				object-fit: contain;
				align-self: center;
				opacity: 0.85;

				pointer-events: none;
			}

			#assets-panel .asset.thumbnail .thumbnail_icon {
				position: absolute;
				left: 0.25em;
				top: 0.25em;
			}

			#assets-panel .asset.thumbnail .error_icon {
				color: red !important;
				width: 100%;
				height: 100px;
				top: 0;
				left: 0;
				display: flex;
				justify-content: center;
				align-items: center;
				font-size: 70px !important;
    			opacity: 0.5;
			}
			#assets-panel .asset.thumbnail .error_icon i {
				max-width: fit-content;
				font-size: inherit;
			}

			#assets-panel .asset.thumbnail .thumbnail_placeholder {
				display: flex;
				flex: 1;
				max-width: 160px;
				width: 100%;
				max-height: 100px;
				min-height: 100px;

				align-items: center;
				justify-content: center;

				font-size: 3em;
				color: var(--color-text);
				background-color: var(--color-back);

				align-self: center;

				pointer-events: none;
			}
			#assets-panel .asset.thumbnail .thumbnail_placeholder i {
				max-width: fit-content;
				font-size: inherit;
			}

			#assets-panel .asset.thumbnail .asset_name {
				margin: 0;
				font-size: 1em;
				overflow-wrap: anywhere;
				text-align: center;
			}

			#assets-panel .asset.thumbnail:hover {
				border: 1px dashed var(--color-light);
			}
			#assets-panel .asset.thumbnail:hover .asset_name {
				color: var(--color-accent_text);
				background-color: var(--color-light);
			}
			#assets-panel .asset.thumbnail:hover .thumbnail_image {
				opacity: 1.0;
			}
			#assets-panel .asset.thumbnail:hover .thumbnail_placeholder {
				color: var(--color-light);
				background-color: inherit;
			}

			#assets-panel .select-wrapper select {
				width: 100%;
				border: solid 1px var(--color-border);
				border-radius: 5px;
				background-color: var(--color-back);
				padding: 0.1em 0.5em;
			}
			#assets-panel .select-wrapper select:disabled {
				cursor: not-allowed;
			}
			#assets-panel .select-wrapper select:disabled + .select-overlay {
				opacity: 0.7;
			}
			#assets-panel .select-wrapper .select-overlay {
				position: absolute;
				width: 100%;
				height: 100%;
				top: 0;
				pointer-events: none;
			}
			#assets-panel .select-wrapper {
				position: relative;
				width: 100%;
			}
			#assets-panel .select-wrapper .select-overlay:before {
				font-family: "Material Icons";
				font-size: 1.5em;
				content: "arrow_drop_down";
				pointer-events: none;
				display: inline-block;
				position: absolute;
				right: 0.1em;
				top: 0;
				color: var(--color-text);
			}
			#assets-panel .select-wrapper .select-overlay:after {
				font-family: "Material Icons";
				font-size: 1.5em;
				content: "arrow_drop_up";
				pointer-events: none;
				display: inline-block;
				position: absolute;
				right: 0.1em;
				bottom: 0;
				color: var(--color-text);
			}
			#assets-panel .select-wrapper:hover .select-overlay:after {
				color: var(--color-light);
			}
			#assets-panel .select-wrapper:hover .select-overlay:before {
				color: var(--color-light);
			}
			`);

			actionAddAssetCategory = new Action('add_asset_category', {
				name: 'New Category',
				description: 'Creates a new assets category',
				icon: 'new_label',
				click: function () {
					Blockbench.textPrompt('Category Name', '', name => {
						if (!AssetCategoryHandler.instance.addCategory(name)) {
							Blockbench.showMessageBox({
								icon: 'error',
								title: 'Error',
								message: "Failed to create asset category with name:\n\n" + name
							});
						}
					});
				}
			});

			actionDeleteAssetCategory = new Action('delete_asset_category', {
				name: 'Delete Category',
				description: 'Deletes a assets category',
				icon: 'label_off',
				click: function () {
					const categoryOptions = {};
					AssetCategoryHandler.instance.getCategories().forEach(id => {
						categoryOptions[id] = id;
					});

					const select = document.getElementById('selectCategoryId');
					const defaultValue = select ? select.value : '';

					const dialog = new Dialog({
						id: 'project',
						title: 'Delete Category',
						width: 540,
						lines: [`Delete the following assets category`],
						form: {
							categoryId: { label: 'Category', type: 'select', default: defaultValue, options: categoryOptions }
						},
						buttons: ['Delete', 'dialog.cancel'],
						onConfirm: function (formResult) {
							AssetCategoryHandler.instance.removeCategory(formResult.categoryId);
							dialog.hide();
						}
					});
					dialog.show();
				}
			});

			actionAddProjectToCategory = new Action('add_project_to_category', {
				name: 'Add Project to Assets',
				description: 'Adds a blockbench project to the currently selected asset category',
				icon: 'note_add',
				click: function () {
					const categoryOptions = {};
					AssetCategoryHandler.instance.getCategories().forEach(id => {
						categoryOptions[id] = id;
					});

					const select = document.getElementById('selectCategoryId');
					const defaultValue = select ? select.value : '';

					const dialog = new Dialog({
						id: 'project',
						title: 'Select Category',
						width: 540,
						lines: [`Choose to which category you want to add assets`],
						form: {
							categoryId: { label: 'Category', type: 'select', default: defaultValue, options: categoryOptions }
						},
						buttons: ['Add Assets', 'dialog.cancel'],
						onConfirm: function (formResult) {
							Blockbench.import(
								{
									resource_id: 'model',
									extensions: [Codecs.project.extension],
									type: Codecs.project.name,
									multiple: true
								},
								function (files) {
									files.forEach(file => {
										if (file.path && !file.no_file) {
											const modelFormatId = autoParseJSON(file.content).meta?.model_format;

											AssetCategoryHandler.instance.addAssetToCategory(
												formResult.categoryId,
												new Asset(pathToName(file.path, false), file.path, modelFormatId)
											);
										}
									});
								});
							dialog.hide();
						}
					});
					dialog.show();
				}
			});

			assetsToolbar = new Toolbar({ id: 'assets', children: [] });
			assetsToolbar.add(actionAddAssetCategory, 0);
			assetsToolbar.add(actionDeleteAssetCategory, 1);
			assetsToolbar.add(actionAddProjectToCategory, 2);

			const assetContextMenu = new Menu('asset_context', [
				{
					id: 'open',
					name: 'Open Model',
					icon: 'icon-blockbench_file',
					click: (context, _event) => {
						Blockbench.read([context.asset.path], {}, files => {
							loadModelFile(files[0]);
						});
					}
				},
				{
					id: 'import',
					name: 'Import Model',
					icon: 'input',
					click: (context, _event) => {
						const importModel = () => {
							Blockbench.read([context.asset.path], {}, files => {
								const bbmodel = autoParseJSON(files[0].content);
								Codecs.project.merge(bbmodel);
							});
						};

						if (!Format.single_texture) {
							importModel();
							return;
						}

						Blockbench.showMessageBox({
							title: "Warning",
							icon: "warning",
							buttons: ["Cancel Import"],
							message: `The current project does not support multiple Textures.`,
							commands: {
								withoutTexture: "Import without Texture",
								includeTexture: "Force Import with Texture"
							}
						}, buttonId => {
							if (buttonId === "includeTexture") {
								Format.single_texture = false;
								importModel();
								Format.single_texture = true;
							}
							else if (buttonId === "withoutTexture") {
								importModel();
							}
						});
					}
				},
				{
					name: "Texture Stitcher Plugin",
					condition: () => Plugins.registered.texture_stitcher?.installed,
					icon: Plugins.registered.texture_stitcher?.icon || '',
					children: [
						{
							name: 'Import Model and Stitch All Textures',
							condition: () => Plugins.registered.texture_stitcher?.installed,
							icon: 'input',
							click: (context, _event) => {
								if (Texture.all.length == 0) {
									Blockbench.showMessageBox({
										icon: 'error',
										title: 'Failure',
										message: "Import Failed!<br><br><br>Project has no textures for stitching."
									});
									return;
								}

								Blockbench.read([context.asset.path], {}, files => {
									const bbmodel = autoParseJSON(files[0].content);

									const isSingleTexture = Format.single_texture;
									if (isSingleTexture) Format.single_texture = false;
									Codecs.project.merge(bbmodel);
									if (isSingleTexture) Format.single_texture = true;

									//we have to wait a little bit for the textures to finish loading inside the project
									setTimeout(() => {
										try {
											Keybinds.actions.filter(k => k instanceof Action).find(a => a.id.includes('texture_stitcher'))?.click();
										}
										catch (e) {
											console.error(`[${PLUGIN_ID}] Failed to stitch textures using "texture_stitcher" plugin`, e);
										}
									}, 100);
								});
							}
						}
					]
				},
				'_',
				{
					id: 'file_explorer',
					name: 'Reveal in File Explorer',
					icon: 'folder',
					click: (context, _event) => {
						if (!fs.existsSync(this.path)) {
							Blockbench.showQuickMessage('texture.error.file');
							return;
						}
						shell.showItemInFolder(context.asset.path);
					}
				},
				{
					icon: 'refresh',
					name: 'Refresh',
					click: (context, _event) => {
						context.asset.refresh();
					}
				},
				'_',
				{
					id: 'remove',
					name: 'Remove from Category',
					icon: 'clear',
					click: (context, _event) => {
						AssetCategoryHandler.instance.removeAssetFromCategory(context.categoryId, context.asset);
					}
				},
				'_',
				{
					icon: 'list',
					name: 'Asset Properties',
					click: (context, _event) => {
						const arr = context.asset.path.split(osfs);
						arr[arr.length - 1] = `<span class="accent_color">${arr[arr.length - 1]}</span>`;
						const path = arr.join('<span class="slash">/</span>');

						const categories = Array.from(AssetCategoryHandler.instance.getCategoriesByAsset(context.asset)).map(s => `<span class="tag">${s}</span>`).join('');

						const dialog = new Dialog({
							id: 'asset_properties',
							title: `Asset Properties (${context.asset.name})`,
							singleButton: true,
							lines: [
								`<style>
								#asset_properties .layout {
									display: flex;
									gap: 1em;
								}
								#asset_properties .layout.column {
									flex-direction: column;
								}
								#asset_properties .layout .text-property {
									flex-grow: 1;
									display: flex;
									flex-direction: column;
									height: fit-content;
								}
								#asset_properties .layout label {
									font-size: 1.1em;
									text-transform: uppercase;
									color: var(--color-subtle_text);
								}
								#asset_properties .layout .text-property p {
									margin: 0;
									user-select: text;
    								cursor: text;
								}
								#asset_properties .layout .text-property p * {
									user-select: text;
								}
								#asset_properties .layout .thumbnail {
									flex: 0 0 auto;
									height: 128px;
									background-color: var(--color-back);
									display: flex;
									align-items: center;
									justify-content: center;
								}
								#asset_properties .categories {
									display: flex;
									gap: 0.5em;
								}
								#asset_properties .categories .tag {
									padding: 0.1em 0.5em;
									border-radius: 0.5em;
									background-color: var(--color-button);
									color: var(--color-text);
								}
								</style>`,
								`<div class="layout">
									<div class="layout column">
										<div class="text-property"><label>Name</label><p>${context.asset.name}</p></div>
										<div class="text-property"><label>Path</label><p>${path}</p></div>
									</div>
									<div class="thumbnail"><img src="${context.asset.getThumbnailSrc()}" /></div>
								</div>
								`,
								`<div class="layout column" style="gap:0.25em; margin-top: 1em;">
									<label>Categories</label>
									<div class="categories">${categories}</div>
								</div>`
							],
							form: {
								hr: '_',
								formatId: { label: 'Model Format Id', type: 'info', text: context.asset.modelFormatId },
								formatName: { label: 'Model Format Name', type: 'info', text: context.asset.modelFormatName },
							},
							onConfirm: function (_results) {
								dialog.hide();
							}
						}).show();
					}
				}
			]);

			assetsPanel = new Panel('assets', {
				name: 'Assets',
				icon: 'photo_album',
				condition: !Blockbench.isMobile && { modes: ['edit'] },
				default_position: {
					slot: 'left_bar',
					float_position: [0, 0],
					float_size: [300, 400],
					height: 380
				},
				toolbars: {
					head: assetsToolbar
				},
				growable: true,
				component: {
					name: 'panel-assets',
					data: {
						categories: AssetCategoryHandler.instance.getCategories(),
						selectedCategoryId: AssetCategoryHandler.instance.getCategories()[0],
						selectedCategoryAssets: AssetCategoryHandler.instance.getAssetsBy(AssetCategoryHandler.instance.getCategories()[0]),

						list_type: StateMemory.assets_list_type || 'grid',
						search_term: '',
						isStreamerMode: settings.streamer_mode.value,
						redacted: tl('generic.redacted'),
						getIconNode: Blockbench.getIconNode
					},
					methods: {
						setListType(type) {
							this.list_type = type;
							StateMemory.assets_list_type = type;
							StateMemory.save('assets_list_type');
						},
						showContextMenu(asset, event) {
							const context = { categoryId: this.selectedCategoryId, asset: asset };
							assetContextMenu.open(event, context);
						},
						openModel(asset, _event) {
							Blockbench.read([asset.path], {}, files => {
								loadModelFile(files[0]);
							});
						},
						getCategory(asset) {
							return Array.from(AssetCategoryHandler.instance.getCategoriesByAsset(asset)).join(', ');
						},
						hasAssets() {
							return this.selectedCategoryAssets.length != 0;
						}
					},
					watch: {
						categories(newValues, _oldValues) {
							if (newValues.length == 0) {
								this.selectedCategoryId = null;
							}
							else if (!newValues.includes(this.selectedCategoryId)) {
								this.selectedCategoryId = newValues[0];
							}
						},
						selectedCategoryId(newId, _oldId) {
							this.selectedCategoryAssets = AssetCategoryHandler.instance.getAssetsBy(newId);
						}
					},
					computed: {
						assets() {
							if (!this.search_term) return this.selectedCategoryAssets;
							const terms = this.search_term.toLowerCase().split(/\s/);

							return this.selectedCategoryAssets.filter(asset => {
								return !terms.find(term => (
									!asset.path.toLowerCase().includes(term)
								));
							});
						}
					},
					template: `
					<div id="assets-panel">
						<div id="assets_view_menu">
							<div class="select-wrapper">
								<select id="selectCategoryId" v-model="selectedCategoryId" :disabled="!selectedCategoryId">
									<option v-for="category in categories">{{ category }}</option>
								</select>
								<div class="select-overlay"></div>
							</div>
							<search-bar :hide="true" v-model="search_term"></search-bar>
							<div class="flex-end">
								<li class="tool" v-bind:class="{selected: list_type == 'grid'}" v-on:click="setListType('grid')">
									<i class="material-icons">view_module</i>
								</li>
								<li class="tool" v-bind:class="{selected: list_type == 'list'}" v-on:click="setListType('list')">
									<i class="material-icons">list</i>
								</li>
							</div>
						</div>
						<div class="list mobile_scrollbar">
							<ul v-if="list_type == 'list'" style="overflow-x: clip;">
								<li v-for="asset in assets" :key="asset.tempId" class="asset"
									v-bind:title="isStreamerMode ? '' : asset.path"
									@click="showContextMenu(asset, $event)"
									@contextmenu="showContextMenu(asset, $event)">

									<span v-if="asset.fileExists()" class="icon_wrapper" v-html="getIconNode(asset.icon).outerHTML"></span>
									<span v-else style="color:red;" class="icon_wrapper" v-html="getIconNode('error_outline').outerHTML"></span>

									<span class="asset_name">{{ asset.name }}</span>
									<span style="width:10px; flex-shrink:0"></span>
									<span class="asset_model_format">{{ asset.modelFormatName }}</span>
								</li>
							</ul>
							<ul v-else :class="{redact: isStreamerMode, assets_list_grid: true}">
								<li v-for="asset in assets" :key="asset.tempId" class="asset thumbnail"
									v-bind:title="isStreamerMode ? '' : asset.path"
									@click="showContextMenu(asset, $event)"
									@contextmenu="showContextMenu(asset, $event)">

									<img v-if="asset.hasThumbnail()" class="thumbnail_image" :src="asset.getThumbnailSrc()" />

									<span v-if="asset.fileExists()" :class="{thumbnail_icon: asset.hasThumbnail(), thumbnail_placeholder: !asset.hasThumbnail()}" :title="asset.modelFormatName" v-html="getIconNode(asset.icon).outerHTML"></span>
									<span v-else title="File not found!" :class="{error_icon: true, thumbnail_icon: asset.hasThumbnail(), thumbnail_placeholder: !asset.hasThumbnail()}" v-html="getIconNode('error_outline').outerHTML"></span>

									<span class="asset_name">{{ asset.name }}</span>
								</li>
							</ul>
							<div v-if="!hasAssets()">No Models are associated with this category</div>
						</div>
					</div>
					`
				}
			});

		},

		onunload() {
			AssetCategoryHandler.instance.deleteUnusedData();

			assetsPanel.delete();
			actionAddAssetCategory.delete();
			actionDeleteAssetCategory.delete();
			actionAddProjectToCategory.delete();

			styles.delete();

			Blockbench.removeListener('select_project', onProjectSelect);
			Blockbench.removeListener('save_project', onProjectSave);
			Blockbench.removeListener('close_project', onProjectClose);
			Codecs.project.removeListener('compile', onProjectCompile);
			Codecs.project.removeListener('parsed', onProjectParsed);
		},

		onuninstall() {
			AssetCategoryHandler.instance.deleteAllData();
		}
	});

})();