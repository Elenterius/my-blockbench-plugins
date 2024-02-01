/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 * @copyright Elenterius 2023-2024
 * @license MIT
 */
"use strict";

(function () {
    "use strict";

    const PLUGIN_ID = "foundry";
    const SVG_ICON = '<svg style="height: 512px; width: 512px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient x1="0" x2="1" y1="0" y2="1" id="delapouite-melting-metal-gradient-1"><stop offset="0%" stop-color="#1af71a" stop-opacity="1"></stop><stop offset="100%" stop-color="#880cf3" stop-opacity="1"></stop></linearGradient></defs><g class="" style="" transform="translate(0,0)"><path d="M41 19v228h25.5c6.96 61.3 40.5 114.1 88.4 145.4l12.1 61.3-95.35-46.4a9.798 9.145 26.09 0 0-4.66-10.5 9.798 9.145 26.09 0 0-13.18 2.9 9.798 9.145 26.09 0 0 3.67 12.8 9.798 9.145 26.09 0 0 10.55-.1L144.5 496h216.6l33.4-22.3a8.636 11.2 54.07 0 0 .3 1.9 8.636 11.2 54.07 0 0 12.8 3.6 8.636 11.2 54.07 0 0 7.2-13 8.636 11.2 54.07 0 0-3.3-3.9l36.5-24.5-89.6 26.2 32.4-57.5-76.5 43.6 6.2-39.1c66.9-25.1 116.3-88.1 125-164H471V19h-30v155.4C420.1 88.03 345.3 23.87 256 23.87S91.93 87.95 71 174.2V19H41zm215 20.54c96.6 0 175.2 81.96 175.2 183.76 0 76.6-44.5 142-107.8 169.7l4.5-28.1L272 464c.1-47.1 1.5-159.3 34.6-204.7 40.7-16.6 68.4-52.4 68.4-93.3 0-56.3-52.6-103-119-103s-119 46.7-119 103c0 40.9 27.7 76.7 68.4 93.3 33.1 45.4 34.5 157.6 34.6 204.7l-51.8-128 .7 52.9-52.5-90 14.1 71.2c-42.3-33.6-69.66-86.7-69.66-146.8C80.84 121.5 159.4 39.54 256 39.54zM170.7 306.3a11.2 8.634 63.66 0 0-.9.1 11.2 8.634 63.66 0 0-5.7 11.9 11.2 8.634 63.66 0 0 11.6 9.4 11.2 8.634 63.66 0 0 5.8-12 11.2 8.634 63.66 0 0-10.8-9.4zm181 30.9a8.998 12.75 27.2 0 0-10.5 7.9 8.998 12.75 27.2 0 0 2.2 15.5 8.998 12.75 27.2 0 0 13.8-7.3 8.998 12.75 27.2 0 0-2.2-15.4 8.998 12.75 27.2 0 0-3.3-.7zM34.96 348.5a11.06 5.999 47.86 0 0-3.04 1 11.06 5.999 47.86 0 0 2.97 12.2 11.06 5.999 47.86 0 0 11.87 4.2 11.06 5.999 47.86 0 0-2.97-12.3 11.06 5.999 47.86 0 0-8.83-5.1zm363.14 26.3a6.561 14.62 40.07 0 0-12 7.8 6.561 14.62 40.07 0 0-4.4 15.4 6.561 14.62 40.07 0 0 14.5-7 6.561 14.62 40.07 0 0 4.4-15.4 6.561 14.62 40.07 0 0-2.5-.8zm81.2 59.7a7.525 16.82 50.66 0 0-15.5 7.8 7.525 16.82 50.66 0 0-5.7 15.7 7.525 16.82 50.66 0 0 18.7-7.1 7.525 16.82 50.66 0 0 5.7-15.7 7.525 16.82 50.66 0 0-3.2-.7zm-404.79 18a13.68 8.998 27.81 0 0-7.87 3.8 13.68 8.998 27.81 0 0 7.9 14.3 13.68 8.998 27.81 0 0 16.3-1.5 13.68 8.998 27.81 0 0-7.9-14.4 13.68 8.998 27.81 0 0-8.43-2.2z" fill="url(#delapouite-melting-metal-gradient-1)" transform="translate(0, 0) scale(1, 1) rotate(-360, 256, 256) skewX(0) skewY(0)"></path></g></svg>';
    const SVG_DATA_URL = `data:image/svg+xml;base64,${btoa(SVG_ICON)}`;

    const GECKOLIB_PLUGIN_ID = "animation_utils";
    const GECKOLIB_MODEL_FORMAT_ID = "animated_entity_model";

    function logWithLogoPrefix(msg, loggingFunc = console.info) {
        loggingFunc("%c %cFoundry Plugin%c %s", `
        background-image: url('${SVG_DATA_URL}');
        padding: 6px;
        padding-left: 12px;
        font-size: 12px;
        background-size: 16px 16px;
        background-position: center;
        background-repeat: no-repeat;
        background-color: #000;
        `, `
        background-color: #000;
        padding: 6px;
        padding-left: 0px;
        font-size: 12px;
        `, "", msg);
    }

    class DeletableToolbar extends Toolbar {
        delete() {
            this.node.remove();
            this.label_node?.remove();
        }
    }

    class Feature {
        load() { }
        unload() { }

        onPluginInstall() { }
        onPluginUninstall() { }

        toString() {
            return "Feature: " + this.constructor.name.replace("Feature", "");
        }
    }

    class ForgeFeature extends Feature {
        toString() {
            return "Forge " + super.toString();
        }
    }

    class GeckolibFeature extends Feature {
        toString() {
            return "Geckolib " + super.toString();
        }
    }

    //https://docs.neoforged.net/docs/1.20.x/rendering/modelextensions/facedata
    //https://docs.neoforged.net/docs/1.20.x/rendering/modelextensions/rendertypes
    class BlockModelRenderTypes {
        static #STORE_KEY = `${PLUGIN_ID}.custom_render_types`;

        static JSON_KEY = "render_type";

        static VANILLA = [
            "minecraft:solid",
            "minecraft:cutout",
            "minecraft:cutout_mipped",
            "minecraft:cutout_mipped_all", //[,1.20)
            "minecraft:translucent",
            "minecraft:translucent_moving_block", //[1.20,)
            "minecraft:translucent_no_crumbling", //[1.20,)
            "minecraft:beacon_beam",
            "minecraft:crumbling",
            "minecraft:tripwire"
        ];
        static CUSTOM = ["create:additive"];

        static addCustom(renderType) {
            BlockModelRenderTypes.CUSTOM.safePush(renderType);
            localStorage.setItem(BlockModelRenderTypes.#STORE_KEY, BlockModelRenderTypes.CUSTOM);
        }

        static validate(renderType) {
            if (renderType === "") return true;
            return BlockModelRenderTypes.VANILLA.includes(renderType) || BlockModelRenderTypes.CUSTOM.includes(renderType);
        }

        static get options() {
            const options = {
                "": "none"
            };

            BlockModelRenderTypes.CUSTOM = localStorage.getItem(BlockModelRenderTypes.#STORE_KEY).split(",");

            BlockModelRenderTypes.VANILLA.forEach(renderType => options[renderType] = renderType);
            BlockModelRenderTypes.CUSTOM.forEach(renderType => options[renderType] = renderType);

            return options;
        }
    }

    class ModelRenderTypeFeature extends ForgeFeature {

        #projectProperty;
        #onProjectSetupListener;
        #actionAddCustomRenderType;

        constructor() {
            super();
        }

        load() {
            // Generally item rendering shouldn't use mipmaps, so cutout_mipped has them off by default. To enforce them, use cutout_mipped_all.
            this.#projectProperty = new Property(ModelProject, 'string', "render_type", {
                label: "(Forge) Render Type",
                options: BlockModelRenderTypes.options,
                condition: () => Format.id === Formats.java_block.id,
                merge_validation: renderType => BlockModelRenderTypes.validate(renderType),
                exposed: true,
                default: (project) => {
                    if ('render_type' in project.unhandled_root_fields) {
                        return project.unhandled_root_fields.render_type;
                    }
                    return "";
                },
                merge: (project, data) => {
                    const renderType = data["render_type"];

                    if (renderType === "") {
                        delete project.unhandled_root_fields.render_type;
                    }
                    else {
                        project.unhandled_root_fields.render_type = renderType;
                    }

                    project.render_type = renderType;
                }
            });

            this.#onProjectSetupListener = () => {
                setTimeout(() => {
                    if (Format.id === Formats.java_block.id && 'render_type' in Project.unhandled_root_fields) {
                        Project.render_type = Project.unhandled_root_fields.render_type;
                    }
                }, 100);
            };
            Blockbench.addListener("setup_project", this.#onProjectSetupListener);

            this.#actionAddCustomRenderType = new Action('add_custom_render_type', {
				name: 'Add Custom Render Type',
				description: 'Adds a custom render type',
				icon: 'new_label',
                category: 'tools',
				click: function () {
					Blockbench.textPrompt('Add Custom Render Type', '', renderType => {
                        if (renderType.includes(",")) {
                            Blockbench.showMessageBox({
								icon: 'error',
								title: 'Error',
								message: "Render Type includes invalid character ','\n\n" + renderType
							});
                            return;
                        }
						if (!renderType.includes(":")) {
							Blockbench.showMessageBox({
								icon: 'error',
								title: 'Error',
								message: "Render Type is missing a namespace\n\n" + renderType
							});
                            return;
						}
                        BlockModelRenderTypes.addCustom(renderType);
					});
				}
			});
            MenuBar.menus.tools.addAction(this.#actionAddCustomRenderType);
        }

        unload() {
            this.#projectProperty.delete();
            this.#projectProperty = null;

            this.#actionAddCustomRenderType.delete();
            this.#actionAddCustomRenderType = null;

            Blockbench.removeListener("setup_project", this.#onProjectSetupListener);
            this.#onProjectSetupListener = null;
        }
    }

    class CompositeModelFeature extends ForgeFeature {
        #action;
        #codec;

        static SPECIFICATIONS = {
            "mc:1.17_1.19": {
                name: "Minecraft 1.17 - 1.19",
                loader: "forge:composite",
                fields: {
                    childModels: "parts"
                },
                assemble: function (compiledModel, compiledChildModels) {
                    compiledModel.loader = this.loader;
                    compiledModel[this.fields.childModels] = compiledChildModels;
                }
            },
            "mc:gte_1.19": {
                name: "Minecraft 1.19+",
                loader: "forge:composite",
                fields: {
                    childModels: "children"
                },
                assemble: function (compiledModel, compiledChildModels) {
                    compiledModel.loader = this.loader;
                    compiledModel[this.fields.childModels] = compiledChildModels;
                }
            },
            "forge:multi_layer": {
                name: "Legacy Fomat: Multi-Layer",
                loader: "forge:multi-layer",
                fields: {
                    childModels: "layers"
                },
                assemble: function (compiledModel, compiledChildModels) {
                    compiledModel.loader = this.loader;

                    const transformedChildren = {};
                    for (const [_childId, childModel] of Object.entries(compiledChildModels)) {
                        const id = childModel.render_type.replace("minecraft:", "");
                        delete childModel.render_type;
                        transformedChildren[id] = childModel;
                    }

                    compiledModel[this.fields.childModels] = transformedChildren;
                }
            },
        };

        #createCodec() {
            const ITEM_PARENTS = [
                'item/generated', 'minecraft:item/generated',
                'item/handheld', 'minecraft:item/handheld',
                'item/handheld_rod', 'minecraft:item/handheld_rod',
                'builtin/generated', 'minecraft:builtin/generated',
            ]

            class ModelCompileHelper {
                compiledModel = {
                    loader: ""
                };

                compiledChildModels = {};

                current_childModel_id = ""

                /** @type {Object[]} */
                elements = [];

                /** @type {Number[]} */
                element_index_lut = [];

                /** @type {Cube[]} */
                overflow_cubes = [];

                setChildModel(id, renderType) {
                    this.current_childModel_id = id;
                    this.compiledChildModels[id] = {
                        render_type: renderType,
                        textures_used: [],
                        textures: {},
                        elements: [],
                    };
                }

                getCurrentChildModel() {
                    return this.compiledChildModels[this.current_childModel_id];
                }

                /**
                 * @param {Cube} cube 
                 */
                updateElementLUT(cube) {
                    this.element_index_lut[Cube.all.indexOf(cube)] = this.elements.length;
                }

                addUsedTexture(texture) {
                    this.getCurrentChildModel().textures_used.safePush(texture);
                }

                isElementInsideBounds(element) {
                    const min = -16;
                    const max = 32;

                    function insideBounds(position) {
                        const [x, y, z] = position;
                        return (x >= min && x <= max) && (y >= min && y <= max) && (z >= min && z <= max);
                    }

                    return insideBounds(element.from) && insideBounds(element.to);
                }

                /**
                 * @param {Cube} cube 
                 */
                accountOverflowingElement(element, cube) {
                    if (Format.cube_size_limiter) {
                        if (!this.isElementInsideBounds(element)) {
                            this.overflow_cubes.push(cube);
                        }
                    }
                }

                addElement(element) {
                    if (Object.keys(element.faces).length) {
                        this.elements.push(element);

                        const childModel = this.getCurrentChildModel();
                        childModel.elements.push(element);
                    }
                }

                #resolveChildTextures(exportTextures, isTextureOnly) {
                    if (!exportTextures) {
                        delete childModel.textures_used;
                        delete childModel.textures;
                        return;
                    }

                    const childModel = this.getCurrentChildModel();

                    Texture.all.forEach((texture, _index) => {
                        if (!childModel.textures_used.includes(texture) && !isTextureOnly) return;

                        const link = texture.javaTextureLink();
                        if (texture.id !== link.replace(/^#/, '')) {
                            childModel.textures[texture.id] = link;
                        }
                    });

                    if (Object.keys(childModel.textures).length === 0) {
                        delete childModel.textures;
                    }

                    delete childModel.textures_used;
                }

                compileChildModel(exportElements, exportTextures, exportParent) {
                    const childModel = this.getCurrentChildModel();

                    if (exportParent) {
                        childModel.parent = Project.parent;
                    }

                    const isTextureOnly = childModel.elements.length === 0 && exportParent;

                    this.#resolveChildTextures(exportTextures, isTextureOnly);

                    console.log(childModel);

                    if (!exportElements || childModel.elements.length === 0) {
                        delete childModel.elements;
                    }
                }

                compileSharedTextures() {
                    Texture.all.forEach((texture, _index) => {
                        if (texture.particle) {
                            this.compiledModel.textures = {};
                            this.compiledModel.textures.particle = texture.javaTextureLink();
                        }
                    });
                }

                compileLast(spec) {
                    spec.assemble.bind(spec);
                    spec.assemble(this.compiledModel, this.compiledChildModels);
                }
            }

            //based on the Blockbench Java Block Codec
            return new Codec('forge_composite_block', {
                name: 'Forge Composite Block Model',
                remember: true,
                extension: 'json',
                load_filter: {
                    type: 'json',
                    extensions: ['json'],
                    condition(model) {
                        return model.loader === "forge:composite" && (model.parent || model.elements || model.textures);
                    }
                },
                async export(children, spec) {
                    if (Object.keys(this.export_options).length) {
                        await this.promptExportOptions();
                    }

                    Blockbench.export({
                        resource_id: 'model',
                        type: this.name,
                        extensions: [this.extension],
                        name: this.fileName(),
                        startpath: this.startPath(),
                        content: this.compile(children, spec),
                        custom_writer: isApp ? (a, b) => this.write(a, b) : null,
                    }, path => this.afterDownload(path))
                },
                compile(childModelsToExport, spec, options = this.getExportOptions()) {
                    if (options === undefined) {
                        options = {};
                    }

                    function checkExport(key, condition) {
                        key = options[key];
                        return key ? key : condition;
                    }

                    /**
                     * @param {Cube} cube 
                     * @param {ModelCompileHelper} context 
                     * @returns 
                     */
                    function compileElement(cube, context) {
                        if (cube.export == false) return;

                        const element = {};
                        context.updateElementLUT(cube);

                        if ((options.cube_name !== false && !settings.minifiedout.value) || options.cube_name === true) {
                            if (cube.name !== 'cube') {
                                element.name = cube.name;
                            }
                        }

                        element.from = cube.from.slice();
                        element.to = cube.to.slice();
                        if (cube.inflate) {
                            for (let i = 0; i < 3; i++) {
                                element.from[i] -= cube.inflate;
                                element.to[i] += cube.inflate;
                            }
                        }

                        if (cube.shade === false) {
                            element.shade = false;
                        }

                        if (!cube.rotation.allEqual(0) || !cube.origin.allEqual(0)) {
                            const axis = cube.rotationAxis() || 'y';
                            const angle = cube.rotation[getAxisNumber(axis)];
                            element.rotation = new oneLiner({ angle, axis, origin: cube.origin });
                        }

                        if (cube.rescale) {
                            if (element.rotation) {
                                element.rotation.rescale = true;
                            }
                            else {
                                const axis = cube.rotationAxis() || 'y';
                                element.rotation = new oneLiner({ angle: 0, axis, origin: cube.origin, rescale: true });
                            }
                        }

                        if (cube.rotation.positiveItems() >= 2) {
                            element.rotated = cube.rotation;
                        }

                        let hasTexture = false;
                        element.faces = {};
                        for (const [key, face] of Object.entries(cube.faces)) {
                            if (face.texture !== null) {
                                const tag = new oneLiner();

                                if (face.enabled !== false) {
                                    tag.uv = face.uv.slice();
                                    tag.uv.forEach((n, index) => {
                                        tag.uv[index] = n * 16 / UVEditor.getResolution(index % 2);
                                    })
                                }

                                if (face.rotation) {
                                    tag.rotation = face.rotation;
                                }

                                if (face.texture) {
                                    const texture = face.getTexture();
                                    if (texture) {
                                        tag.texture = '#' + texture.id;
                                        context.addUsedTexture(texture);
                                    }
                                    hasTexture = true;
                                }

                                if (!tag.texture) {
                                    tag.texture = '#missing';
                                }

                                if (face.cullface) {
                                    tag.cullface = face.cullface;
                                }

                                if (face.tint >= 0) {
                                    tag.tintindex = face.tint;
                                }

                                element.faces[key] = tag;
                            }
                        }

                        if (!hasTexture) {
                            element.color = cube.color
                        }

                        context.accountOverflowingElement(element, cube);
                        context.addElement(element);
                    }

                    /**
                     * @param {OutlinerNode[]} nodes 
                     * @returns 
                     */
                    function comppileOrVisit(nodes, context) {
                        if (!nodes || !nodes.length) return;

                        for (const node of nodes) {
                            if (!node.export) continue;

                            if (node.type === 'cube') {
                                compileElement(node, context);
                            }
                            else if (node.type === 'group') {
                                comppileOrVisit(node.children, context);
                            }
                        }
                    }

                    /**
                     * @param {String} id 
                     * @param {Object} data 
                     * @param {ModelCompileHelper} helper 
                     */
                    function compileCompositeChildModel(id, data, helper, exportSettings) {
                        const group = data.group;

                        helper.setChildModel(id, data.render_type)

                        comppileOrVisit([group], helper);

                        helper.compileChildModel(exportSettings.elements, exportSettings.textures, exportSettings.parent);
                    }

                    const exportSettings = {
                        comment: checkExport('comment', Project.credit || settings.credit.value),
                        elements: checkExport('elements', true),
                        textures: checkExport('textures', true),
                        parent: checkExport('parent', Project.parent != ''),
                    };

                    const compileHelper = new ModelCompileHelper();

                    for (const [id, data] of Object.entries(childModelsToExport)) {
                        compileCompositeChildModel(id, data, compileHelper, exportSettings);
                    }

                    if (options.prevent_dialog !== true && compileHelper.overflow_cubes.length > 0 && settings.dialog_larger_cubes.value) {
                        Blockbench.showMessageBox(
                            {
                                icon: 'settings_overscan',
                                translateKey: 'model_clipping',
                                message: tl('message.model_clipping.message', [compileHelper.overflow_cubes.length]),
                                buttons: ['dialog.scale.select_overflow', 'dialog.ok'],
                                confirm: 1, cancel: 1,
                            },
                            result => {
                                if (result == 0) {
                                    selected.splice(0, Infinity, ...compileHelper.overflow_cubes);
                                    updateSelection();
                                }
                            }
                        );
                    }

                    if (options.prevent_dialog !== true && compileHelper.elements.length && ITEM_PARENTS.includes(Project.parent)) {
                        Blockbench.showMessageBox({
                            icon: 'info',
                            translateKey: 'invalid_builtin_parent',
                            message: tl('message.invalid_builtin_parent.message', [Project.parent])
                        });
                        Project.parent = '';
                    }

                    if (exportSettings.comment) {
                        compileHelper.compiledModel.credit = Project.credit || settings.credit.value;
                    }

                    if (exportSettings.parent) {
                        compileHelper.compiledModel.parent = Project.parent;
                    }

                    if (checkExport('ambientocclusion', Project.ambientocclusion === false)) {
                        compileHelper.compiledModel.ambientocclusion = false;
                    }

                    if (Project.texture_width !== 16 || Project.texture_height !== 16) {
                        compileHelper.compiledModel.texture_size = [Project.texture_width, Project.texture_height];
                    }

                    compileHelper.compileSharedTextures();

                    if (checkExport('front_gui_light', Project.front_gui_light)) {
                        compileHelper.compiledModel.gui_light = 'front';
                    }
                    if (checkExport('overrides', Project.overrides instanceof Array && Project.overrides.length)) {
                        Project.overrides.forEach(override => delete override._uuid);
                        compileHelper.compiledModel.overrides = Project.overrides.map(override => new oneLiner(override));
                    }

                    if (checkExport('display', Object.keys(Project.display_settings).length >= 1)) {
                        const display = {};

                        for (const displayContext of DisplayMode.slots) {
                            if (Project.display_settings[displayContext] && Project.display_settings[displayContext].export) {
                                display[displayContext] = Project.display_settings[displayContext].export();
                            }
                        }

                        if (Object.keys(display).length) {
                            compileHelper.compiledModel.display = display;
                        }
                    }

                    if (checkExport('groups', settings.export_groups.value && Group.all.length)) {
                        const groups = compileGroups(false, compileHelper.compiledModel.element_index_lut);
                        let i = 0;
                        while (i < groups.length) {
                            if (typeof groups[i] === 'object') {
                                i = Infinity;
                            }
                            i++;
                        }

                        if (i === Infinity) {
                            compileHelper.compiledModel.groups = groups;
                        }
                    }

                    for (const [key, value] of Object.entries(Project.unhandled_root_fields)) {
                        if (key !== "render_type" && !compileHelper.compiledModel[key]) {
                            compileHelper.compiledModel[key] = value;
                        }
                    }

                    compileHelper.compileLast(spec);

                    this.dispatchEvent('compile', { model: compileHelper.compiledModel, options });

                    if (options.raw) {
                        return compileHelper.compiledModel;
                    }
                    else {
                        return autoStringify(compileHelper.compiledModel);
                    }
                },
                parse(model, path, add) {
                    if (model.loader && model.loader === "forge:composite") {
                        Blockbench.showMessageBox({ icon: 'error', message: 'Parsing of Composite Models is Not Yet Supported!' });
                        return;
                    }

                    if ((!model.loader || model.loader !== "forge:composite") || (!model.elements && !model.parent && !model.display && !model.textures)) {
                        Blockbench.showMessageBox({ icon: 'error', translateKey: 'invalid_model' });
                        return;
                    }

                    this.dispatchEvent('parse', { model });

                    var previous_texture_length = add ? Texture.all.length : 0;
                    var new_cubes = [];
                    var new_textures = [];
                    if (add) {
                        Undo.initEdit({ elements: new_cubes, outliner: true, textures: new_textures })
                        Project.added_models++;
                        var import_group = new Group(pathToName(path, false)).init();
                    }

                    //Load
                    if (typeof (model.credit || model.__comment) == 'string') {
                        Project.credit = (model.credit || model.__comment);
                    }
                    if (model.texture_size instanceof Array && !add) {
                        Project.texture_width = Math.clamp(parseInt(model.texture_size[0]), 1, Infinity);
                        Project.texture_height = Math.clamp(parseInt(model.texture_size[1]), 1, Infinity);
                    }
                    if (model.display !== undefined) {
                        DisplayMode.loadJSON(model.display);
                    }
                    if (model.overrides instanceof Array) {
                        Project.overrides = model.overrides.slice();
                    }

                    var texture_ids = {};
                    var texture_paths = {};
                    if (model.textures) {
                        //Create Path Array to fetch textures
                        var path_arr = path.split(osfs)
                        if (!path_arr.includes('cit')) {
                            var index = path_arr.length - path_arr.indexOf('models')
                            path_arr.splice(-index);
                        }

                        var texture_arr = model.textures

                        for (var key in texture_arr) {
                            if (typeof texture_arr[key] === 'string' && key != 'particle') {
                                let link = texture_arr[key];
                                if (link.startsWith('#') && texture_arr[link.substring(1)]) {
                                    link = texture_arr[link.substring(1)];
                                }
                                let texture = new Texture({ id: key }).fromJavaLink(link, path_arr.slice()).add();
                                texture_paths[texture_arr[key].replace(/^minecraft:/, '')] = texture_ids[key] = texture;
                                new_textures.push(texture);
                            }
                        }

                        if (texture_arr.particle) {
                            let link = texture_arr.particle;
                            if (link.startsWith('#') && texture_arr[link.substring(1)]) {
                                link = texture_arr[link.substring(1)];
                            }
                            if (texture_paths[link.replace(/^minecraft:/, '')]) {
                                texture_paths[link.replace(/^minecraft:/, '')].enableParticle()
                            }
                            else {
                                let texture = new Texture({ id: 'particle' }).fromJavaLink(link, path_arr.slice()).enableParticle().add();
                                texture_paths[link.replace(/^minecraft:/, '')] = texture_ids.particle = texture;
                                new_textures.push(texture);
                            }
                        }

                        //Get Rid Of ID overlapping
                        for (let i = previous_texture_length; i < Texture.all.length; i++) {
                            const texture = Texture.all[i];
                            if (getTexturesById(texture.id).length > 1) {
                                texture.id = Project.added_models + '_' + texture.id;
                            }
                        }

                        //Select Last Texture
                        if (Texture.all.length > 0) {
                            Texture.all.last().select();
                        }
                    }

                    var oid = elements.length

                    if (model.elements) {
                        model.elements.forEach(function (obj) {
                            base_cube = new Cube(obj)
                            if (obj.__comment) base_cube.name = obj.__comment
                            //Faces
                            var faces_without_uv = false;
                            for (var key in base_cube.faces) {
                                if (obj.faces[key] && !obj.faces[key].uv) {
                                    faces_without_uv = true;
                                }
                            }
                            if (faces_without_uv) {
                                base_cube.autouv = 2
                                base_cube.mapAutoUV()
                            } else {
                                base_cube.autouv = 0;
                            }

                            for (var key in base_cube.faces) {
                                var read_face = obj.faces[key];
                                var new_face = base_cube.faces[key];
                                if (read_face === undefined) {

                                    new_face.texture = null
                                    new_face.uv = [0, 0, 0, 0]
                                } else {
                                    if (typeof read_face.uv === 'object') {

                                        new_face.uv.forEach((n, i) => {
                                            new_face.uv[i] = read_face.uv[i] * UVEditor.getResolution(i % 2) / 16;
                                        })
                                    }
                                    if (read_face.texture === '#missing') {
                                        new_face.texture = false;

                                    } else if (read_face.texture) {
                                        var id = read_face.texture.replace(/^#/, '')
                                        var t = texture_ids[id]

                                        if (t instanceof Texture === false) {
                                            if (texture_paths[read_face.texture]) {
                                                var t = texture_paths[read_face.texture]
                                                if (t.id === 'particle') {
                                                    t.extend({ id: id, name: '#' + id }).loadEmpty(3)
                                                }
                                            } else {
                                                var t = new Texture({ id: id, name: '#' + id }).add(false).loadEmpty(3)
                                                texture_ids[id] = t
                                                new_textures.push(t);
                                            }
                                        }
                                        new_face.texture = t.uuid;
                                    }
                                    if (typeof read_face.tintindex == 'number') {
                                        new_face.tint = read_face.tintindex;
                                    }
                                }
                            }

                            if (!add) {
                                Outliner.root.push(base_cube)
                                base_cube.parent = 'root'
                            } else if (import_group) {
                                import_group.children.push(base_cube)
                                base_cube.parent = import_group
                            }
                            base_cube.init()
                            new_cubes.push(base_cube);
                        })
                    }
                    if (model.groups && model.groups.length > 0) {
                        if (!add) {
                            parseGroups(model.groups)
                        } else if (import_group) {
                            parseGroups(model.groups, import_group, oid)
                        }
                    }
                    if (import_group) {
                        import_group.addTo().select()
                    }
                    if (
                        !model.elements &&
                        ITEM_PARENTS.includes(model.parent) &&
                        model.textures &&
                        typeof model.textures.layer0 === 'string'
                    ) {
                        let texture_mesh = new TextureMesh({
                            name: model.textures.layer0,
                            rotation: [90, 180, 0],
                            local_pivot: [0, -7.5, -16],
                            locked: true,
                            export: false
                        }).init()
                        texture_mesh.locked = true;

                        new_cubes.push(texture_mesh);

                    } else if (!model.elements && model.parent) {
                        let can_open = isApp && !model.parent.replace(/\w+:/, '').startsWith('builtin');
                        Blockbench.showMessageBox({
                            translateKey: 'child_model_only',
                            icon: 'info',
                            message: tl('message.child_model_only.message', [model.parent]),
                            commands: can_open && {
                                open: 'message.child_model_only.open',
                                open_with_textures: { text: 'message.child_model_only.open_with_textures', condition: Texture.all.length > 0 }
                            }
                        }, (result) => {
                            if (result) {
                                let parent = model.parent.replace(/\w+:/, '');
                                let path_arr = path.split(osfs);
                                let index = path_arr.length - path_arr.indexOf('models');
                                path_arr.splice(-index);
                                path_arr.push('models', ...parent.split('/'));
                                let parent_path = path_arr.join(osfs) + '.json';

                                Blockbench.read([parent_path], {}, (files) => {
                                    loadModelFile(files[0]);

                                    if (result == 'open_with_textures') {
                                        Texture.all.forEachReverse(tex => {
                                            if (tex.error == 3 && tex.name.startsWith('#')) {
                                                let loaded_tex = texture_ids[tex.name.replace(/#/, '')];
                                                if (loaded_tex) {
                                                    tex.fromPath(loaded_tex.path);
                                                    tex.namespace = loaded_tex.namespace;
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                    updateSelection()

                    //Set Parent
                    if (model.parent !== undefined) {
                        Project.parent = model.parent;
                    }
                    //Set Ambient Occlusion
                    if (model.ambientocclusion === false) {
                        Project.ambientocclusion = false;
                    }
                    if (model.gui_light === 'front') {
                        Project.front_gui_light = true;
                    }
                    let supported_fields = new Set(['textures', 'elements', 'groups', 'parent', 'display', '__comment', 'credit', 'texture_size', 'overrides', 'ambientocclusion', 'gui_light']);
                    for (let key in model) {
                        if (!supported_fields.has(key)) {
                            Project.unhandled_root_fields[key] = model[key];
                        }
                    }

                    this.dispatchEvent('parsed', { model });
                    if (add) {
                        Undo.finishEdit('Add block model');
                    }
                    Validator.validate();
                },
            });
        }

        #createSelectChildrenDialog() {
            const groupsToExport = new Map();
            const form = {};

            Outliner.root.forEach(element => {
                if (element instanceof Group) {
                    const key = element.name.replace(" ", "_");
                    form[key] = {
                        label: element.name,
                        type: 'checkbox'
                    };
                    groupsToExport.set(key, element);
                }
            });

            const dialog = new Dialog({
                id: 'forge_composite_children_select_dialog',
                title: 'Select Forge Composite Child Models',
                form: form,
                lines: [
                    '<h2>Composite Child Models</h2>',
                    'Choose which group to export as a composite child model',
                    '<br>'
                ],
                onConfirm: formData => {
                    dialog.hide();

                    for (const [key, value] of Object.entries(formData)) {
                        if (!value) {
                            groupsToExport.delete(key);
                        }
                    }

                    this.#createSetRenderTypeDialog(groupsToExport).show();
                }
            });
            return dialog;
        }

        /**
         * @param {Map} groupsToExport 
         */
        #createSetRenderTypeDialog(groupsToExport) {
            const form = {};

            for (const key of groupsToExport.keys()) {
                form[key] = {
                    label: groupsToExport.get(key).name,
                    type: 'select',
                    options: BlockModelRenderTypes.options
                }
            }

            form['hr_1'] = "_";

            form["spec"] = {
                label: "Specification",
                type: 'select',
                options: {}
            }
            for (const [specId, spec] of Object.entries(CompositeModelFeature.SPECIFICATIONS)) {
                form["spec"].options[specId] = spec.name;
            }

            const dialog = new Dialog({
                id: 'forge_composite_dialog',
                title: 'Forge Composite Model',
                form: form,
                lines: [
                    '<h2>Render Types</h2>',
                    'Choose the render type for each child model',
                    '<br>'
                ],
                onConfirm: formData => {
                    dialog.hide();

                    const children = {};
                    for (const key of groupsToExport.keys()) {
                        children[key] = {
                            group: groupsToExport.get(key),
                            render_type: formData[key],
                        };
                    }

                    const spec = CompositeModelFeature.SPECIFICATIONS[formData["spec"]];

                    Codecs.forge_composite_block.export(children, spec);
                }
            });
            return dialog;
        }

        load() {
            this.#codec = this.#createCodec();
            console.log("created composite model codec");

            this.#action = new Action({
                id: 'export_forge_composite',
                name: 'Export Forge Composite Model',
                icon: 'layers',
                description: 'Exports a model in the Forge composite format.',
                category: 'file',
                condition: () => Format.id === Formats.java_block.id,
                click: () => {
                    this.#createSelectChildrenDialog().show();
                }
            });
            MenuBar.addAction(this.#action, 'file.export');
        }

        unload() {
            this.#action.delete();
            this.#action = null;

            this.#codec.delete();
        }
    }

    class GeckolibOverridesFeature extends GeckolibFeature {
        static #STORE_KEY = `${PLUGIN_ID}.geckolib_overrides.single_texture`;

        #toggle;

        constructor() {
            super();
        }

        /**
         * @returns {ModelFormat}
         */
        #getGeckoLibModelFormat() {
            return Formats.animated_entity_model;
        }

        /**
         * @param {boolean} flag 
         */
        #setSingleTexture(flag) {
            this.#getGeckoLibModelFormat().single_texture = flag;
        }

        #parseBoolean(value) {
            return String(value).toLowerCase() == "true" ? true : false;
        }

        load() {
            const isSingleTexture = this.#parseBoolean(localStorage.getItem(GeckolibOverridesFeature.#STORE_KEY));
            const isMultiTexture = !isSingleTexture;
            this.#setSingleTexture(isSingleTexture);

            console.info("ModelFormat Override >> SingleTexture =", isSingleTexture);

            this.#toggle = new Toggle('toggle_geckolib_single_texture_override', {
                name: 'Geckolib Override: Multi-Texture',
                icon: 'photo_prints',
                description: 'Overrides Single Texture constraint of the Geckolib ModelFormat',
                category: 'tools',
                condition: () => Format.id === GECKOLIB_MODEL_FORMAT_ID,
                default: isMultiTexture,
                onChange: value => {
                    this.#setSingleTexture(!value);
                    localStorage.setItem(GeckolibOverridesFeature.#STORE_KEY, !value);
                }
            });
            MenuBar.menus.tools.addAction(this.#toggle);
        }

        unload() {
            this.#toggle.delete();
            this.#toggle = null;

            this.#setSingleTexture(true);
        }

        onPluginUninstall() {
            localStorage.removeItem(GeckolibOverridesFeature.#STORE_KEY);
        }
    }

    class FeatureManager {
        /** @type {Feature[]} */
        static #FEATURES = [
            new GeckolibOverridesFeature(),
            new ModelRenderTypeFeature(),
            new CompositeModelFeature()
        ];

        /** @type {Feature[]} */
        static #LOADED_FEATURES = new Array();

        static onPluginInstall() {
            logWithLogoPrefix(`installing ${FeatureManager.#FEATURES.length} features...`, console.group);

            FeatureManager.#FEATURES.forEach(feature => {
                console.groupCollapsed("installing " + feature);
                try {
                    feature.onPluginInstall();
                }
                catch (error) {
                    console.error("failed to install " + feature);
                    console.error(error);
                }
                console.groupEnd();
            });

            console.groupEnd();
        }

        static loadAll() {
            logWithLogoPrefix(`loading ${FeatureManager.#FEATURES.length} features...`, console.group);

            FeatureManager.#FEATURES.forEach(feature => {
                console.groupCollapsed("loading " + feature);
                try {
                    feature.load();
                    FeatureManager.#LOADED_FEATURES.push(feature);
                }
                catch (error) {
                    console.error("failed to load " + feature);
                    console.error(error);
                }
                console.groupEnd();
            });

            console.groupEnd();
        }

        static unloadAll() {
            logWithLogoPrefix(`unloading ${FeatureManager.#LOADED_FEATURES.length} features...`, console.group);

            FeatureManager.#LOADED_FEATURES.forEach(feature => {
                console.groupCollapsed("unloading " + feature);
                try {
                    feature.unload();
                }
                catch (error) {
                    console.error("failed to unload " + feature);
                    console.error(error);
                }
                console.groupEnd();
            });
            FeatureManager.#LOADED_FEATURES = new Array();

            console.groupEnd();
        }

        static onPluginUninstall() {
            logWithLogoPrefix(`uninstalling ${FeatureManager.#FEATURES.length} features...`, console.group);

            FeatureManager.#FEATURES.forEach(feature => {
                console.groupCollapsed("uninstalling " + feature);
                try {
                    feature.onPluginUninstall();
                }
                catch (error) {
                    console.error("failed to uninstall " + feature);
                    console.error(error);
                }
                console.groupEnd();
            });

            console.groupEnd();
        }
    }

    BBPlugin.register(PLUGIN_ID, {
        title: 'Foundry',
        creation_date: "2023-07-10",
        author: 'Elenterius',
        description: 'Additional Modding Tools focused around Forge/NeoForge & Geckolib',
        icon: 'melting-metal.svg',
        tags: ["Minecraft: Java Edition", "(Neo)Forge", "Geckolib"],
        version: '0.3.0',
        min_version: "4.8.0",
        max_version: "5.0.0",
        await_loading: true,
        dependencies: [GECKOLIB_PLUGIN_ID],
        variant: 'both',

        onload() {
            FeatureManager.loadAll();
        },
        onunload() {
            FeatureManager.unloadAll();
        },
        oninstall() {
            FeatureManager.onPluginInstall();
        },
        onuninstall() {
            FeatureManager.onPluginUninstall();
        }
    });

})();