/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 * @copyright Elenterius 2023
 * @license MIT
 */
"use strict";

(function () {
	"use strict";

	const PLUGIN_ID = 'asset_library';

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

		has(key) {
			return this.#map.has(key);
		}

		/**
		 * @param {*} key
		 * @param {Function?} computeDefault
		 * @returns {*[]}
		 */
		get(key, computeDefault = (_) => new Array()) {
			const array = this.#map.get(key);
			if(array) return array;

			const computedValue = computeDefault(key);
			this.set(key, computedValue);
			return computedValue;
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

		clear() {
			this.#map.clear();
		}

		toArray() {
			return Array.from(this.#map);
		}
	}

	class AssetCollectionHandler {
		static #STORE_KEY = `${PLUGIN_ID}.assets`;
		static #ROOT_ID = "all";

		/**	@type {AssetCollectionHandler} */
		static #INSTANCE;

		/** @type {MultiMapArray} */
		#assetToCollectionIds;

		/** @type {MultiMapArray} */
		#collectionIdToAssets;

		/** @type {String[]} */
		#rawCollectionIds;

		constructor() {
			this.#assetToCollectionIds = new MultiMapArray();
			this.#collectionIdToAssets = new MultiMapArray();
			this.#rawCollectionIds = [AssetCollectionHandler.#ROOT_ID];
		}

		/**
		 * @returns {AssetCollectionHandler}
		 */
		static get instance() {
			if (!AssetCollectionHandler.#INSTANCE) {
				AssetCollectionHandler.#INSTANCE = new AssetCollectionHandler();
			}
			return AssetCollectionHandler.#INSTANCE;
		}

		static getRootId() {
			return this.#ROOT_ID;
		}

		deserialize() {
			let storedValue = localStorage.getItem(AssetCollectionHandler.#STORE_KEY);
			if (typeof storedValue == 'string') {
				try {
					storedValue = JSON.parse(storedValue);
				} catch (ignored) {
					localStorage.removeItem(AssetCollectionHandler.#STORE_KEY);
				}
			}

			if (storedValue != null && storedValue["assetToCollectionIds"]) {
				
				const deserialized = storedValue["assetToCollectionIds"].map(([asset, collectionIds]) => [Asset.fromJSON(asset), collectionIds]);
				this.#assetToCollectionIds = new MultiMapArray(deserialized);
				this.#collectionIdToAssets = new MultiMapArray();

				for (const collectionId of storedValue["collectionIds"]) {
					this.#collectionIdToAssets.get(collectionId);
				}

				for (const [asset, collectionIds] of this.#assetToCollectionIds.entries()) {
					for (const collectionId of collectionIds) {
						this.#collectionIdToAssets.add(collectionId, asset);
					}
				}

				this.#rawCollectionIds.length = 0;
				this.#rawCollectionIds.push(AssetCollectionHandler.#ROOT_ID);
				this.#rawCollectionIds.push(...this.#collectionIdToAssets.keys());
			}
			else {
				this.#assetToCollectionIds.clear();
				this.#collectionIdToAssets.clear();

				this.#rawCollectionIds.length = 0;
				this.#rawCollectionIds.push(AssetCollectionHandler.#ROOT_ID);
			}
		}

		serialize() {
			const serialized = JSON.stringify({ 
				collectionIds: Array.from(this.#collectionIdToAssets.keys()),
				assetToCollectionIds: this.#assetToCollectionIds.toArray(),
			});
			localStorage.setItem(AssetCollectionHandler.#STORE_KEY, serialized);
		}

		deleteAllData() {
			localStorage.removeItem(AssetCollectionHandler.#STORE_KEY);
			AssetCollectionHandler.#INSTANCE = null;
			FSUtil.deletePluginFolder();
		}

		static delete() {
			if (!AssetCollectionHandler.#INSTANCE) return;

			const handler = AssetCollectionHandler.#INSTANCE;
			handler.serialize();
			handler.deleteUnusedData();

			AssetCollectionHandler.#INSTANCE = null;
		}

		deleteUnusedData() {
			const thumbnailNames = new Set();
			for (const asset of this.#assetToCollectionIds.keys()) {
				thumbnailNames.add(asset.getPathHash());
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
		}

		#onChange() {
			this.serialize();
		}

		/**
		 * @param {String} collectionId
		 * @param {Asset} asset
		 */
		addAssetToCollection(collectionId, asset) {
			if (collectionId.toLowerCase() === AssetCollectionHandler.#ROOT_ID) return;
			if (!this.#collectionIdToAssets.has(collectionId)) return;

			for (const existingAsset of this.#assetToCollectionIds.keys()) {
				if (asset.path === existingAsset.path) {
					asset = existingAsset;
					break;
				}
			}

			if (this.#assetToCollectionIds.get(asset).includes(collectionId)) return;
			this.#assetToCollectionIds.add(asset, collectionId);

			if (this.#collectionIdToAssets.get(collectionId).includes(asset)) return;
			this.#collectionIdToAssets.add(collectionId, asset);

			this.#onChange();
		}

		/**
		 * @param {String} collectionId
		 * @returns {String?}
		 */
		addCollection(collectionId) {
			if (collectionId.toLowerCase() === AssetCollectionHandler.#ROOT_ID) return;
			if (this.#collectionIdToAssets.has(collectionId)) return null;

			this.#collectionIdToAssets.set(collectionId, []);
			this.#rawCollectionIds.push(collectionId);

			this.#onChange();

			return collectionId;
		}

		/**
		 * @param {String} collectionId
		 */
		removeCollection(collectionId) {
			if (collectionId.toLowerCase() === AssetCollectionHandler.#ROOT_ID) return;
			if (!this.#collectionIdToAssets.has(collectionId)) return;

			const assets = this.#collectionIdToAssets.get(collectionId);
			for (const asset of assets) {
				this.#assetToCollectionIds.removeValue(asset, collectionId);
				if (this.#assetToCollectionIds.get(asset).length === 0) {
					this.#assetToCollectionIds.delete(asset);
				}
			}

			this.#collectionIdToAssets.delete(collectionId);

			this.#rawCollectionIds.remove(collectionId);

			this.#onChange();
		}

		/**
		 * @param {String} collectionId
		 * @param {Asset} asset
		 */
		removeAssetFromCollection(collectionId, asset) {
			if (collectionId.toLowerCase() === AssetCollectionHandler.#ROOT_ID) return;
			if (!this.#collectionIdToAssets.has(collectionId)) return;

			this.#collectionIdToAssets.removeValue(collectionId, asset);
			this.#assetToCollectionIds.removeValue(asset, collectionId);
			if (this.#assetToCollectionIds.get(asset).length === 0) {
				this.#assetToCollectionIds.delete(asset);
			}

			this.#onChange();
		}

		/**
		 * @returns {IterableIterator<String>}
		 */
		getCollectionIds() {
			return this.#collectionIdToAssets.keys();
		}

		/**
		 * @returns {String[]}
		 */
		getRawCollectionIds() {
			return this.#rawCollectionIds;
		}

		/**
		 * @param {string} collectionId
		 * @returns {IterableIterator<Asset>}
		 */
		getCollection(collectionId) {
			if (collectionId.toLowerCase() === AssetCollectionHandler.#ROOT_ID) {
				return this.#assetToCollectionIds.keys();
			}

			return this.#collectionIdToAssets.get(collectionId, () => []);
		}

		/**
		 * @param {Asset} asset
		 * @returns {Set<string>}
		 */
		getCollectionIdsFromAsset(asset) {
			return new Set(this.#assetToCollectionIds.get(asset));
		}

		/**
		 * @param {ModelProject} modelProject
		 * @returns {Map<string,Asset[]>}
		 */
		getAssociatedAssetsGroupedByCollectionId(modelProject) {
			const path = modelProject.export_path || modelProject.save_path;
			const foundAssets = new Map();
			for (let [collectionId, assets] of this.#collectionIdToAssets.entries()) {
				const asset = assets.find(x => x.path == path);
				if (asset) {
					foundAssets.set(collectionId, asset);
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
		 * @param {String} name
		 * @param {String} path
		 * @param {String} icon
		 * @param {Number} timestamp
		 */
		constructor(name, path, modelFormatId, timestamp, compiledModelHash) {
			if (name.length > 48) name = name.substring(0, 20 + 1) + '...' + name.substring(name.length - 20);

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

			let assets = AssetCollectionHandler.instance.getAssociatedAssetsGroupedByCollectionId(modelProject);
			if (assets.size < 1) return;

			const compiledModelHash = JSON.stringify(compiledModel).hashCode();

			assets = Array.from(assets.values()).filter(a => a.compiledModelHash != compiledModelHash);
			if (assets.length < 1) return;

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
			if (assets.length === 0) return;

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
			let assets = Array.from(AssetCollectionHandler.instance.getAssociatedAssetsGroupedByCollectionId(Project).values());
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

	function onBeforeClosing(_data) {
		AssetCollectionHandler.delete();
	}

	class DeletableToolbar extends Toolbar {
		delete() {
			this.node.remove();
			this.label_node?.remove();
		}
	}

	/**
	 * @type {Deletable[]}
	 */
	const DELETABLES = [];

	Plugin.register(PLUGIN_ID, {
		title: 'Asset Library',
		icon: 'icon.svg',
		author: 'Elenterius',
		description: 'Organize your projects into asset collections. View your collections in the library panel and import assets into your currently open project.',
		tags: ["Files", "Management", "Blockbench", "UX"],
		creation_date: "2022-10-02",
		version: '0.2.0',
		min_version: "4.8.0",
		max_version: "5.0.0",
		variant: 'desktop',

		onload() {
			FSUtil.setupFolderStructure();
			StateMemory.init('assets_list_type', 'string'); //tracks how assets are displayed: grid or list layout?
			AssetCollectionHandler.instance.deserialize();

			Blockbench.on('select_project', onProjectSelect);
			Blockbench.on('save_project', onProjectSave);
			Blockbench.on('close_project', onProjectClose);
			Blockbench.on('before_closing', onBeforeClosing);
			Codecs.project.on('compile', onProjectCompile);
			Codecs.project.on('parsed', onProjectParsed);

			DELETABLES.push(Blockbench.addCSS(`
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
			`));

			const actionAddCollection = new Action('add_asset_collection', {
				name: 'New Collection',
				description: 'Creates a new asset collection',
				icon: 'new_label',
				click: function () {
					Blockbench.textPrompt('Create New Collection', '', name => {
						if (!AssetCollectionHandler.instance.addCollection(name)) {
							Blockbench.showMessageBox({
								icon: 'error',
								title: 'Error',
								message: "Failed to create collection with name:\n\n" + name
							});
						}
					});
				}
			});
			const actionDeleteCollection = new Action('delete_asset_collection', {
				name: 'Delete Collection',
				description: 'Deletes a asset collection',
				icon: 'label_off',
				click: function () {
					const collectionOptions = {};
					for (const collectionId of AssetCollectionHandler.instance.getCollectionIds()) {
						collectionOptions[collectionId] = collectionId;
					}

					if (Object.keys(collectionOptions).length === 0) {
						Blockbench.showMessageBox({
							icon: 'error',
							title: 'Deletion Error',
							message: "There are no Collections that can be deleted!"
						});
						return;
					}

					const select = document.getElementById('selectCollectionId');
					const defaultValue = select ? select.value : '';

					const dialog = new Dialog({
						id: 'project',
						title: 'Delete Collection',
						width: 540,
						lines: [`Delete the following collection`],
						form: {
							collectionId: { label: 'Collection', type: 'select', default: defaultValue, options: collectionOptions }
						},
						buttons: ['Delete Collection', 'dialog.cancel'],
						onConfirm: function (formResult) {
							AssetCollectionHandler.instance.removeCollection(formResult.collectionId);
							dialog.hide();
						}
					});
					dialog.show();
				}
			});
			const actionAddProjectToCollection = new Action('add_project_to_asset_collection', {
				name: 'Add Project to Collection',
				description: 'Adds a project to the selected asset collection',
				icon: 'note_add',
				click: function () {
					const collectionOptions = {};
					for (const collectionId of AssetCollectionHandler.instance.getCollectionIds()) {
						collectionOptions[collectionId] = collectionId;
					}

					if (Object.keys(collectionOptions).length === 0) {
						Blockbench.showMessageBox({
							icon: 'error',
							title: 'Add To Collection Error',
							message: "There are no Collections available!"
						});
						return;
					}

					const select = document.getElementById('selectCollectionId');
					const defaultValue = select ? select.value : '';

					const dialog = new Dialog({
						id: 'project',
						title: 'Select Collection',
						width: 540,
						lines: [`Add assets to the following collection`],
						form: {
							collectionId: { label: 'Collection', type: 'select', default: defaultValue, options: collectionOptions }
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

											AssetCollectionHandler.instance.addAssetToCollection(
												formResult.collectionId,
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

			const assetsToolbar = new DeletableToolbar({ id: 'asset_library_tools', children: [] });
			assetsToolbar.add(actionAddCollection, 0);
			assetsToolbar.add(actionDeleteCollection, 1);
			assetsToolbar.add(actionAddProjectToCollection, 2);

			DELETABLES.push(assetsToolbar, actionAddCollection, actionDeleteCollection, actionAddProjectToCollection);

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
					name: 'Remove from Collection',
					icon: 'clear',
					click: (context, _event) => {
						AssetCollectionHandler.instance.removeAssetFromCollection(context.collectionId, context.asset);
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

						const collections = Array.from(AssetCollectionHandler.instance.getCollectionIdsFromAsset(context.asset)).map(s => `<span class="tag">${s}</span>`).join('');

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
								#asset_properties .collections {
									display: flex;
									gap: 0.5em;
								}
								#asset_properties .collections .tag {
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
									<label>Collections</label>
									<div class="collections">${collections}</div>
								</div>`
							],
							form: {
								hr: '_',
								formatName: { label: 'Model Format', type: 'info', text: context.asset.modelFormatName },
								formatId: { label: 'Model Format Id', type: 'info', text: context.asset.modelFormatId },
								hash: { label: 'Model Hash', type: 'info', text: (context.asset.compiledModelHash + "") },
							},
							onConfirm: function (_results) {
								dialog.hide();
							}
						}).show();
					}
				}
			]);

			const assetsPanel = new Panel('asset_library', {
				name: 'Asset Library',
				icon: 'photo_album',
				condition: !Blockbench.isMobile && { modes: ['edit'] },
				default_position: {
					slot: 'left_bar',
					float_position: [0, 0],
					float_size: [300, 400],
					height: 380
				},
				toolbars: [
					assetsToolbar
				],
				growable: true,
				component: {
					name: 'panel-assets',
					data: {
						collectionIds: AssetCollectionHandler.instance.getRawCollectionIds(),
						selectedCollectionId: AssetCollectionHandler.getRootId(),
						selectedCollection: AssetCollectionHandler.instance.getCollection(AssetCollectionHandler.getRootId()),

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
							const context = { collectionId: this.selectedCollectionId, asset: asset };
							assetContextMenu.open(event, context);
						},
						openModel(asset, _event) {
							Blockbench.read([asset.path], {}, files => {
								loadModelFile(files[0]);
							});
						},
						getCollectionIds(asset) {
							return Array.from(AssetCollectionHandler.instance.getCollectionIdsFromAsset(asset)).join(', ');
						},
						hasAssets() {
							return this.selectedCollection.length != 0;
						}
					},
					watch: {
						collectionIds(newValues, _oldValues) {
							if (newValues.length == 0) {
								this.selectedCollectionId = null;
							}
							else if (!newValues.includes(this.selectedCollectionId)) {
								this.selectedCollectionId = newValues[0];
							}
						},
						selectedCollectionId(newId, _oldId) {
							this.selectedCollection = AssetCollectionHandler.instance.getCollection(newId);
						}
					},
					computed: {
						assets() {
							if (!this.search_term) return this.selectedCollection;
							const terms = this.search_term.toLowerCase().split(/\s/);

							return this.selectedCollection.filter(asset => {
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
								<select id="selectCollectionId" v-model="selectedCollectionId" :disabled="!selectedCollectionId">
									<option v-for="collectionId in collectionIds">{{ collectionId }}</option>
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
							<div v-if="!hasAssets()">No Projects are associated with this collection</div>
						</div>
					</div>
					`
				}
			});
			DELETABLES.push(assetsPanel);
		},

		onunload() {
			AssetCollectionHandler.delete();

			DELETABLES.forEach(x => x.delete());
			DELETABLES.length = 0;

			Blockbench.removeListener('select_project', onProjectSelect);
			Blockbench.removeListener('save_project', onProjectSave);
			Blockbench.removeListener('close_project', onProjectClose);
			Blockbench.removeListener('before_closing', onBeforeClosing);
			Codecs.project.removeListener('compile', onProjectCompile);
			Codecs.project.removeListener('parsed', onProjectParsed);
		},

		onuninstall() {
			AssetCollectionHandler.instance.deleteAllData();
		}
	});

})();