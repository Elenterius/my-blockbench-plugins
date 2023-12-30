/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 * @copyright Elenterius 2023
 * @license MIT
 */
"use strict";

(function () {
    'use strict';

    const PLUGIN_ID = 'tentacle_generator';

    function generateTentacle(config) {
        Undo.initEdit({ outliner: true, group: null, elements: [] });

        const elements = [];
        const baseName = config.rootName;

        const selectedGroup = getCurrentGroup();
        let offset = selectedGroup ? selectedGroup.origin.slice() : [0, 0, 0];

        const root = new Group({ name: baseName, origin: offset.slice() });
        root.addTo(selectedGroup);
        root.init();

        let parent = root;
        let colorId = 0;
        let maxSegments = config.segments;

        let source;

        for (let i = 0; i < maxSegments; i++) {
            let widthXZ = config.getSizeXZ(i, maxSegments);
            let height = config.getSizeY(i, maxSegments); 

            let bone = new Group({ name: baseName + '_bone_' + i, origin: offset.slice() });
            bone.addTo(parent);
            bone.init();

            if (i === 0) {
                source = bone;
            }

            let halfWidth = widthXZ * 0.5;
            let posA = [offset[0] - halfWidth, offset[1], offset[2] - halfWidth];
            let posB = [offset[0] + halfWidth, offset[1] + height, offset[2] + halfWidth];
            let cube = new Cube({ origin: offset.slice(), from: posA, to: posB, name: 'cube' + i, color: colorId++ });
            cube.addTo(bone);
            cube.init();

            elements.push(cube);

            parent = bone;
            offset[1] += height;

            if (colorId > 7) colorId = 0;
        }

        let endEffector = new Group({ name: baseName + '_end_effector', origin: offset.slice() });
        endEffector.addTo(parent);
        endEffector.init();

        const ikTarget = new NullObject({ name: baseName + '_ik_target', from: [offset[0], offset[1] + 1, offset[2]] });
        ikTarget.addTo(root);
        ikTarget.init();
        ikTarget.ik_target = endEffector.uuid;
        ikTarget.ik_source = source.uuid;

        elements.push(ikTarget);

        Canvas.updateAll();
        Undo.finishEdit('generate tentacle', { outliner: true, group: root, elements: elements });
    }

    class IllegalValueError extends Error {
        get name() {
            return "IllegalValueError";
        }
    }

    class CustomDialog extends Dialog {
        show() {
            super.show();

            this.onFormChange(this.getFormResult()); //trigger validation

            //remove inline textarea height
            const textareas = document.querySelectorAll("dialog#" + this.id + " textarea");
            textareas.forEach(element => {
                element.style.height = "";
            });
        }
    }

    class DeletableToolbar extends Toolbar {
		delete() {
			this.node.remove();
			this.label_node?.remove();
		}
	}

    /**
     * @returns {Dialog}
     */
    function createGenerateTentacleDialog() {
        return new CustomDialog({
            id: 'tentacle_generator_config',
            title: `Tentacle Generator`,
            lines: [
                `<style>
                dialog#tentacle_generator_config {
                    width: 600px;
                }
                button:disabled {
                    background-color: var(--color-button) !important;
                    color: var(--color-text) !important;
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                input:invalid {
                    border-color: var(--color-error);
                }
                textarea:invalid {
                    border-color: var(--color-error);
                }
                textarea {
                    cursor: text;
                    height: 3.6em;
                }
                textarea:focus {
                    resize: vertical;
                }
                input[readonly] {
                    border-style: none;
                    background-color: transparent;
                    cursor: default;
                }

                .form_bar_segmentHeightError {
                    visibility: hidden;
                    padding: 0.3em;
                  
                    color: var(--color-bright_ui_text);
                    background-color: var(--color-error);
                    border-radius: 5px;

                    margin: 0;
                    position: absolute;
                    left: calc(100% - 24px + 9px);
                }
                .form_bar_segmentHeightError::after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    right: 100%;
                    margin-top: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: transparent var(--color-error) transparent transparent;
                }
                .form_bar_segmentHeightError.show-error {
                    visibility: visible;
                    width: max-content;
                }

                .form_bar_segmentWidthError {
                    visibility: hidden;
                    padding: 0.3em;
                  
                    color: var(--color-bright_ui_text);
                    background-color: var(--color-error);
                    border-radius: 5px;

                    margin: 0;
                    position: absolute;
                    left: calc(100% - 24px + 9px);
                }
                .form_bar_segmentWidthError::after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    right: 100%;
                    margin-top: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: transparent var(--color-error) transparent transparent;
                }
                .form_bar_segmentWidthError.show-error {
                    visibility: visible;
                    width: max-content;
                }

                .form_bar_rotorAngleConstraintError {
                    visibility: hidden;
                    padding: 0.3em;
                  
                    color: var(--color-bright_ui_text);
                    background-color: var(--color-error);
                    border-radius: 5px;

                    margin: 0;
                    position: absolute;
                    left: calc(100% - 24px + 9px);
                }
                .form_bar_rotorAngleConstraintError::after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    right: 100%;
                    margin-top: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: transparent var(--color-error) transparent transparent;
                }
                .form_bar_rotorAngleConstraintError.show-error {
                    visibility: visible;
                    width: max-content;
                }
                </sytle>`,
            ],
            form: {
                rootName: { label: 'Name', type: 'text', value: 'tentacle' },
                hr: '_',
                segments: { label: 'segments', type: 'number', value: 5, step: 1, min: 1, max: 20 },
                i: { label: 'i', type: 'info', text: 'Index of the current segment. [0, ..., segments - 1]' },

                segmentHeightError: { type: 'info', text: "" },
                segmentHeightFunc: { label: 'Height Function', type: 'textarea', value: 'Math.max(1, segments - i + (i % 1))' },

                segmentWidthError: { type: 'info', text: "" },
                segmentWidthFunc: { label: 'Width Function', type: 'textarea', value: 'Math.max(1, segments - i + (i % 1))' },

                hr2: '_',
                i2: { type: 'info', text: 'Stats' },
                divideBy16: { label: 'Show in World Scale', type: 'checkbox', value: false },
                totalHeight: { label: 'Total Height', type: 'number', value: '0', readonly: true },
                maxWidth: { label: 'Max Width', type: 'number', value: '0', readonly: true },
                minWidth: { label: 'Min Width', type: 'number', value: '0', readonly: true }
            },
            onFormChange: function (formData) {
                const dialogElement = document.querySelector("dialog#" + this.id);
                const confirmButton = dialogElement.querySelector(".confirm_btn");
                confirmButton.disabled = true; //disable button

                const showError = (id, error) => {
                    let input = dialogElement.querySelector("#" + id);
                    input.setCustomValidity(error.name);
                    let errorMsg = dialogElement.querySelector((".form_bar_" + id).replace("Func", "Error"));
                    errorMsg.innerHTML = "<span><strong>" + error.name + "</strong><br>" + error.message + "</span>";
                    errorMsg.classList.add("show-error");
                };

                const hideError = (id) => {
                    let input = dialogElement.querySelector("#" + id);
                    input.setCustomValidity("");
                    let errorMsg = dialogElement.querySelector((".form_bar_" + id).replace("Func", "Error"));
                    errorMsg.innerHTML = "";
                    errorMsg.classList.remove("show-error");
                };

                const executeFunction = (id, i, segments) => {
                    try {
                        const result = eval(formData[id]);
                        if (isNaN(result)) throw new IllegalValueError("not a number");
                        if (!isFinite(result)) throw new IllegalValueError("number is not finite");

                        hideError(id);
                        return result;
                    }
                    catch (error) {
                        showError(id, error);
                    }
                }

                const widthFunc = (i, segments) => {
                    const id = "segmentWidthFunc";
                    return executeFunction(id, i, segments);
                };
                const heightFunc = (i, segments) => {
                    const id = "segmentHeightFunc";
                    return executeFunction(id, i, segments);
                }

                const maxSegments = formData.segments;

                let totalHeight = 0;
                let maxWidth = Number.MIN_SAFE_INTEGER;
                let minWidth = Number.MAX_SAFE_INTEGER;

                for (let i = 0; i < maxSegments; i++) {
                    const width = widthFunc(i, maxSegments);
                    if (width > maxWidth) maxWidth = width;
                    if (width < minWidth) minWidth = width;

                    const height = heightFunc(i, maxSegments);
                    totalHeight += height;

                    if (height === undefined || width === undefined) return; //a error is present, abort everything
                }

                confirmButton.disabled = false; //enable button

                if (formData.divideBy16) {
                    totalHeight /= 16;
                    maxWidth /= 16;
                    minWidth /= 16;
                }

                const updatedData = {};

                if (formData.totalHeight !== totalHeight) {
                    updatedData.totalHeight = totalHeight;
                }

                if (formData.maxWidth !== maxWidth) {
                    updatedData.maxWidth = maxWidth;
                }

                if (formData.minWidth !== minWidth) {
                    updatedData.minWidth = minWidth;
                }

                if (Object.keys(updatedData).length === 0) return;
                console.log("update data");
                this.setFormValues(updatedData);
            },
            onConfirm: function (formData) {
                const config = {
                    rootName: formData.rootName,
                    segments: formData.segments,
                    getSizeXZ: function (i, segments) { return eval(formData.segmentWidthFunc) },
                    getSizeY: function (i, segments) { return eval(formData.segmentHeightFunc) },
                };
                generateTentacle(config);
                this.hide();
            }
        });
    }

    /** @type {Action} */
    let generateTentacleAction;

    /** @type {Dialog} */
    let generateTentacleDialog;

    BBPlugin.register(PLUGIN_ID, {
        title: 'Tentacle Generator',
        creation_date: "2023-01-01",
        author: 'Elenterius',
        description: 'Parametric Tentacle Generator',
        icon: 'curled-tentacle.svg',
        tags: ["Generator"],
        version: '0.8.0',
        min_version: "4.8.0",
        max_version: "5.0.0",
        variant: 'both',

        onload() {
            generateTentacleDialog = createGenerateTentacleDialog();

            generateTentacleAction = new Action('generate_tentacle', {
                name: 'Generate Tentacle',
                icon: 'precision_manufacturing',
                category: 'edit',
                condition: () => Modes.edit && Format.rotation_limit === false,
                click: function () {
                    generateTentacleDialog.show();
                }
            });
            Interface.Panels.outliner.menu.addAction(generateTentacleAction.id, '5');
            MenuBar.menus.tools.addAction(generateTentacleAction);
        },

        onunload() {
            generateTentacleAction.delete();
            generateTentacleDialog.delete();
        }
    });

})();