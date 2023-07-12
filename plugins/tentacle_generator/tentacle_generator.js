/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 * @copyright Elenterius 2023
 * @license MIT
 */
"use strict";

//import * as FIK from 'ikts'; //hack for type hints, comment out before you install the plugin

(function () {
    'use strict';

    const PLUGIN_ID = 'tentacle_generator';

    // class IKTarget extends NullObject {
    //     static type = createIdentifier('ik_target');
    //     static animator = null;
    //     static {
    //         this.prototype.title = 'IK Target';
    //         this.prototype.type = this.type;
    //         this.prototype.icon = 'sports_score';
    //         this.prototype.movable = true;
    //         this.prototype.scalable = false;
    //         this.prototype.rotatable = false;
    //         this.prototype.needsUniqueName = true;
    //         this.prototype.visibility = true;
    //         this.prototype.menu = new Menu([
    //             createIdentifier('set_end_effector'),
    //             '_',
    //             ...Outliner.control_menu_group,
    //             '_',
    //             'rename',
    //             'delete'
    //         ]);
    //         this.prototype.buttons = [
    //             Outliner.buttons.locked,
    //             Outliner.buttons.visibility,
    //         ];

    //         new Property(IKTarget, 'string', 'name', { default: this.type });
    //         new Property(IKTarget, 'vector', 'position');
    //         new Property(IKTarget, 'string', 'end_effector');
    //         new Property(IKTarget, 'boolean', 'lock_end_effector_rotation');
    //         new Property(IKTarget, 'boolean', 'visibility', { default: true });
    //     }
    //     static setup() {
    //         IKTarget.animator = IKAnimator;
    //         OutlinerElement.registerType(IKTarget, this.type);

    //         const map = new THREE.TextureLoader().load('assets/null_object.png');
    //         map.magFilter = map.minFilter = THREE.NearestFilter;

    //         new NodePreviewController(IKTarget, {
    //             setup(element) {
    //                 const material = new THREE.SpriteMaterial({
    //                     map,
    //                     alphaTest: 0.1,
    //                     sizeAttenuation: false
    //                 });
    //                 const mesh = new THREE.Sprite(material);

    //                 Project.nodes_3d[element.uuid] = mesh;
    //                 mesh.name = element.uuid;
    //                 mesh.type = element.type;
    //                 mesh.isElement = true;
    //                 mesh.visible = element.visibility;
    //                 mesh.rotation.order = 'ZYX';

    //                 element.mesh.fix_position = new THREE.Vector3();

    //                 this.updateTransform(element);

    //                 this.dispatchEvent('setup', { element });
    //                 this.dispatchEvent('update_selection', { element });
    //             },
    //             updateTransform(element) {
    //                 NodePreviewController.prototype.updateTransform(element);

    //                 element.mesh.fix_position.copy(element.mesh.position);

    //                 this.updateWindowSize(element);
    //                 this.dispatchEvent('update_transform', { element });
    //             },
    //             updateSelection(element) {
    //                 const { mesh } = element;
    //                 mesh.material.color.set(element.selected ? gizmo_colors.outline : CustomTheme.data.colors.text);
    //                 mesh.material.depthTest = !element.selected;
    //                 mesh.renderOrder = element.selected ? 100 : 0;

    //                 this.dispatchEvent('update_selection', { element });
    //             },
    //             updateWindowSize(element) {
    //                 const size = 17 / Preview.selected.height;
    //                 element.mesh.scale.set(size, size, size);
    //             }
    //         })
    //     }

    //     constructor(data, uuid) {
    //         super(data, uuid);

    //         for (var key in IKTarget.properties) {
    //             IKTarget.properties[key].reset(this);
    //         }

    //         if (data && typeof data === 'object') {
    //             this.extend(data)
    //         }
    //     }

    //     init() {
    //         if (this.parent instanceof Group == false) {
    //             this.addTo(Group.selected)
    //         }
    //         super.init();
    //         return this;
    //     }

    //     extend(object) {
    //         if (object.from) this.position.V3_set(object.from);
    //         for (var key in IKTarget.properties) {
    //             IKTarget.properties[key].merge(this, object)
    //         }
    //         this.sanitizeName();
    //         return this;
    //     }

    //     getUndoCopy() {
    //         const copy = new IKTarget(this);
    //         copy.uuid = this.uuid;
    //         copy.type = this.type;
    //         delete copy.parent;
    //         return copy;
    //     }

    //     getSaveCopy() {
    //         let save = {};
    //         for (var key in IKTarget.properties) {
    //             IKTarget.properties[key].copy(this, save)
    //         }
    //         save.uuid = this.uuid;
    //         save.type = IKTarget.type;
    //         return save;
    //     }

    //     get origin() {
    //         return this.position;
    //     }

    //     getWorldCenter(with_animation) {
    //         let pos = Reusable.vec1.set(0, 0, 0);
    //         const up = Reusable.quat1.set(0, 0, 0, 1);

    //         if (this.parent instanceof Group) {
    //             THREE.fastWorldPosition(this.parent.mesh, pos);
    //             this.parent.mesh.getWorldQuaternion(up);
    //             const offset = Reusable.vec2.fromArray(this.parent.origin).applyQuaternion(up);
    //             pos.sub(offset);
    //         }

    //         if (with_animation && Animation.selected) {
    //             const offset = Reusable.vec3.copy(this.mesh.position);
    //             if (this.parent instanceof Group) {
    //                 offset.x += this.parent.origin[0];
    //                 offset.y += this.parent.origin[1];
    //                 offset.z += this.parent.origin[2];
    //             }
    //             offset.applyQuaternion(up);
    //             pos.add(offset);

    //             return pos;
    //         }

    //         const offset = Reusable.vec3.fromArray(this.position).applyQuaternion(up);
    //         pos.add(offset);
    //         return pos;
    //     }

    //     select(event, isOutlinerClick) {
    //         super.select(event, isOutlinerClick);
    //         if (Animator.open && Animation.selected) {
    //             Animation.selected.getBoneAnimator(this).select(true);
    //         }
    //         return this;
    //     }

    //     unselect(...args) {
    //         if (Animator.open && Timeline.selected_animator && Timeline.selected_animator.element == this) {
    //             Timeline.selected_animator.selected = false;
    //         }
    //         return super.unselect(...args);
    //     }

    //     flip(axis, center) {
    //         var offset = this.position[axis] - center
    //         this.position[axis] = center - offset;

    //         if (axis == 0 && this.name.includes('right')) {
    //             this.name = this.name.replace(/right/g, 'left').replace(/2$/, '');
    //         }
    //         else if (axis == 0 && this.name.includes('left')) {
    //             this.name = this.name.replace(/left/g, 'right').replace(/2$/, '');
    //         }
    //         this.createUniqueName();
    //         return this;
    //     }
    // }

    class IKAnimator extends NullObjectAnimator {
        static {
            this.prototype.type = NullObject.prototype.type;
            this.prototype.channels = {
                position: {
                    name: tl('timeline.position'),
                    mutable: true, transform: true, max_data_points: 2
                },
            }
        }

        #name;

        constructor(uuid, animation, name) {
            super(uuid, animation);
            this.uuid = uuid;
            this.#name = name;

            this.solver = new FIK.Structure3D(scene);
            this.chain = new FIK.Chain3D();

            this.position = [];
        }

        get name() {
            let element = this.getElement();
            if (element) return element.name;
            return this.#name;
        }

        set name(name) {
            this.#name = name;
        }

        /**
         * @returns {NullObject}
         */
        getElement() {
            this.element = OutlinerNode.uuids[this.uuid];
            return this.element
        }

        select(isElementSelected) {
            if (!this.getElement()) {
                unselectAll();
                return this;
            }
            if (this.getElement().locked) return;

            if (isElementSelected !== true && this.element) {
                this.element.select();
            }
            GeneralAnimator.prototype.select.call(this);

            if (this[Toolbox.selected.animation_channel] && (Timeline.selected.length == 0 || Timeline.selected[0].animator != this)) {
                let nearest;
                this[Toolbox.selected.animation_channel].forEach(kf => {
                    if (Math.abs(kf.time - Timeline.time) < 0.002) {
                        nearest = kf;
                    }
                })
                if (nearest) {
                    nearest.select();
                }
            }

            if (this.element && this.element.parent && this.element.parent !== 'root') {
                this.element.parent.openUp();
            }
            return this;
        }

        doRender() {
            this.getElement();
            return (this.element && this.element.mesh);
        }

        displayPosition(arr, multiplier = 1) {
            const bone = this.element.mesh
            if (arr) {
                bone.position.x -= arr[0] * multiplier;
                bone.position.y += arr[1] * multiplier;
                bone.position.z += arr[2] * multiplier;
            }
            return this;
        }

        /**
        * @param {THREE.Euler} rotation 
        */
        #sampleRotation(rotation) {
            const sampledRotation = new THREE.Euler().copy(rotation);
            return {
                euler: sampledRotation,
                array: [
                    Math.radToDeg(-sampledRotation.x),
                    Math.radToDeg(-sampledRotation.y),
                    Math.radToDeg(sampledRotation.z),
                ]
            }
        }

        /**
         * @param {NullObject} ikTarget 
         * @param {Group} endEffector 
         * @returns {Group[]}
         */
        #buildIKChain(ikTarget, endEffector) {
            if (!ikTarget || !endEffector) return null;

            const bones = [];
            let current = endEffector.parent;

            while (current !== ikTarget.parent) {
                bones.push(current);
                current = current.parent;
            }
            if (!bones.length) return;
            bones.reverse();

            bones.forEach(bone => {
                if (bone.mesh.fix_rotation) bone.mesh.rotation.copy(bone.mesh.fix_rotation);
            });

            function perpendicularVectorQuick(vec) {
                const pVec = vec.clone();
                return Math.abs(vec.y) < 0.99 ? pVec.set(-vec.z, 0, vec.x).normalize() : pVec.set(0, vec.z, -vec.y).normalize();
            }

            bones.forEach((bone, i) => {
                const startPos = new FIK.V3(0, 0, 0).copy(bone.mesh.getWorldPosition(new THREE.Vector3()));
                const endPos = new FIK.V3(0, 0, 0).copy(bones[i + 1] ? bones[i + 1].mesh.getWorldPosition(new THREE.Vector3()) : ikTarget.getWorldCenter(false));

                if (i == 0) {
                    let baseBone = new FIK.Bone3D(startPos, endPos);
                    this.chain.addBone(baseBone);
                    //const constraintAxis = endPos.minus(startPos).normalize(); //direction
                    const constraintAxis = new FIK.V3(0, 1, 0);
                    this.chain.setRotorBaseboneConstraint("local", constraintAxis, bone.ik_rotorAngleConstraint);
                }
                else {
                    //const direction = endPos.minus(startPos).normalize();
                    const length = startPos.distanceTo(endPos);
                    const constraintAxis = new FIK.V3(0, 1, 0);
                    this.chain.addConsecutiveRotorConstrainedBone(constraintAxis, length, bone.ik_rotorAngleConstraint); //TODO: replace this global chain
                    //const rotationAxis = new FIK.V3(1, 0, 0);
                    //this.chain.addConsecutiveFreelyRotatingHingedBone(direction, length, "local", rotationAxis);
                    //this.chain.addConsecutiveHingedBone(direction, length, "local", rotationAxis,  bone.ik_rotorAngleConstraint, bone.ik_rotorAngleConstraint, perpendicularVectorQuick(rotationAxis));
                }
            });

            return bones;
        }

        displayIK(isSampling) {
            const ikTarget = this.getElement();
            const endEffector = [...Group.all, ...Locator.all].find(node => node.uuid == ikTarget.ik_target);
            if (!ikTarget || !endEffector) return;

            const targetPos = new THREE.Vector3().copy(ikTarget.getWorldCenter(true));
            const originalEndEffectorQuaternion = ikTarget.lock_ik_target_rotation && endEffector instanceof Group ? endEffector.mesh.getWorldQuaternion(new THREE.Quaternion()) : null;

            const bones = this.#buildIKChain(ikTarget, endEffector);
            if (bones == null) return;

            const activeIKChain = this.chain;

            const boneReferences = [];
            bones.forEach((bone, i) => {
                const nextBone = bones[i + 1] ? bones[i + 1] : endEffector;
                boneReferences.push({
                    bone,
                    lastDifference: new THREE.Vector3(
                        nextBone.origin[0] - bone.origin[0],
                        nextBone.origin[1] - bone.origin[1],
                        nextBone.origin[2] - bone.origin[2]
                    ).normalize()
                });
            });

            this.solver.add(activeIKChain, targetPos, true);
            // this.solver.meshChains[0].forEach(mesh => {
            //     mesh.visible = true;
            // });
            this.solver.update();
            const solvedIKChain = this.solver.chains[0];

            const samples = {};

            boneReferences.forEach((reference, i) => {
                const startPos = Reusable.vec1.copy(solvedIKChain.bones[i].start);
                const endPos = Reusable.vec2.copy(solvedIKChain.bones[i].end);
                bones[i].mesh.worldToLocal(startPos);
                bones[i].mesh.worldToLocal(endPos);

                Reusable.quat1.setFromUnitVectors(reference.lastDifference, endPos.sub(startPos).normalize());
                const rotation = Reusable.euler1.setFromQuaternion(Reusable.quat1, 'ZYX');

                const referenceBone = reference.bone;
                referenceBone.mesh.rotation.x += rotation.x;
                referenceBone.mesh.rotation.y += rotation.y;
                referenceBone.mesh.rotation.z += rotation.z;
                referenceBone.mesh.updateMatrixWorld();

                if (isSampling) samples[referenceBone.uuid] = this.#sampleRotation(rotation);
            });

            if (originalEndEffectorQuaternion != null) {
                const rotation = Reusable.euler1.copy(endEffector.mesh.rotation);

                endEffector.mesh.quaternion.copy(originalEndEffectorQuaternion); //restore previous quaternion
                const parentQuaternion = endEffector.mesh.parent.getWorldQuaternion(Reusable.quat1);
                endEffector.mesh.quaternion.premultiply(parentQuaternion.invert())
                endEffector.mesh.updateMatrixWorld();

                rotation.x = endEffector.mesh.rotation.x - rotation.x;
                rotation.y = endEffector.mesh.rotation.y - rotation.y;
                rotation.z = endEffector.mesh.rotation.z - rotation.z;

                if (isSampling) samples[endEffector.uuid] = this.#sampleRotation(rotation);
            }

            //TODO: this part is bad, clearing the chain/solver is a bad idea and leads to instability
            this.solver.clear();
            this.chain.clear();
            this.chain.lastTargetLocation.set(1e9, 0, 0); //this should be the target position

            if (isSampling) return samples;
        }

        displayFrame(multiplier = 1) {
            if (!this.doRender()) return;
            this.getElement();

            if (!this.muted.position) {
                this.displayPosition(this.interpolate('position'), multiplier);
                this.displayIK();
            }
        }
    }

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

        for (let i = 0; i < maxSegments; i++) {
            let widthXZ = config.getSizeXZ(i, maxSegments);
            let height = config.getSizeY(i, maxSegments); 

            let bone = new Group({ name: baseName + '_bone_' + i, origin: offset.slice() });
            bone.ik_rotorAngleConstraint = config.getRotorAngleConstraint(i, maxSegments);
            bone.addTo(parent);
            bone.init();

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

                rotorAngleConstraintError: { type: 'info', text: "" },
                rotorAngleConstraintFunc: { label: 'Rotor Angle Constraint', type: 'textarea', value: 'Math.min(90, 40 + i * 5)' },

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
                const rotorAngleFunc = (i, segments) => {
                    const id = "rotorAngleConstraintFunc";
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

                    const rotorAngle = rotorAngleFunc(i, maxSegments);

                    if (height === undefined || width === undefined || rotorAngle === undefined) return; //a error is present, abort everything
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
                    getRotorAngleConstraint: function (i, segments) { return eval(formData.rotorAngleConstraintFunc) }
                };
                generateTentacle(config);
                this.hide();
            }
        });
    }

    // let addIKTarget;
    // let setEndEffector;

    /**
     * @type {Action}
     */
    let generateTentacleAction;

    /**
     * @type {Dialog}
     */
    let generateTentacleDialog;
	
    /**
     * @type {Property}
     */
	let rotorAngleConstraintProperty;

    let onSelectionUpdated;
    let ikToolbar, ikRotorAngleConstraintSlider;

    BBPlugin.register(PLUGIN_ID, {
        title: 'Tentacle Generator',
        creation_date: "2023-01-01",
        author: 'Elenterius',
        description: 'Enables more fine grained IK constrains and a tentacle generator',
        icon: 'tentacle.png',
        tags: ["Minecraft", "Generator"],
        version: '0.7.0',
        min_version: "4.5.0",
        max_version: "5.0.0",
        new_repository_format: true,
        variant: 'both',

        onload() {
            {
            // IKTarget.setup();
            // addIKTarget = new Action(createIdentifier('add_ik_target'), {
            //     name: 'Add IK Target',
            //     icon: 'sports_score',
            //     category: 'edit',
            //     condition: () => Format.animation_mode && Modes.edit,
            //     click: function () {
            //         const objs = [];
            //         Undo.initEdit({ elements: objs, outliner: true });

            //         const selectedGroup = getCurrentGroup();
            //         const ikTarget = new IKTarget().addTo(selectedGroup).init();
            //         ikTarget.select().createUniqueName();
            //         objs.push(ikTarget);

            //         Undo.finishEdit('Add IK Target');
            //         Vue.nextTick(function () {
            //             if (settings.create_rename.value) {
            //                 ikTarget.rename();
            //             }
            //         });
            //     }
            // });
            // MenuBar.menus.edit.addAction(addIKTarget, '6');

            // setEndEffector = new Action(createIdentifier('set_end_effector'), {
            //     name: 'Set End-Effector',
            //     icon: 'fa-paperclip',
            //     category: 'edit',
            //     condition() {
            //         let action = setEndEffector;
            //         return IKTarget.selected.length && action.children(action).length;
            //     },
            //     searchable: true,
            //     children() {
            //         let nodes = [];
            //         iterate(IKTarget.selected[0].getParentArray(), 0);
        
            //         function iterate(arr, level) {
            //             arr.forEach(node => {
            //                 if (node instanceof Group) {
            //                     if (level) nodes.push(node);
            //                     iterate(node.children, level+1);
            //                 }
            //                 if (node instanceof Locator) {
            //                     if (level) nodes.push(node);
            //                 }
            //             });
            //         }

            //         return nodes.map(node => {
            //             return {
            //                 name: node.name + (node.uuid == IKTarget.selected[0].end_effector ? ' (✔)' : ''),
            //                 icon: node instanceof Locator ? 'fa-anchor' : 'folder',
            //                 color: markerColors[node.color % markerColors.length] && markerColors[node.color % markerColors.length].standard,
            //                 click() {
            //                     Undo.initEdit({elements: IKTarget.selected});
            //                     IKTarget.selected.forEach(ikTarget => {
            //                         ikTarget.end_effector = node.uuid;
            //                         ikTarget.ik_target = node.uuid;
            //                     })
            //                     Undo.finishEdit('Set IK target');
            //                 }
            //             }
            //         });
            //     },
            //     click(event) {
            //         new Menu(createIdentifier('set_end_effector'), this.children(this), {searchable: true}).show(event.target, this);
            //     }
            // })
            }

            //override NUllObject Animator
            NullObject.animator = IKAnimator;
            Blockbench.NullObjectAnimator = IKAnimator;

            rotorAngleConstraintProperty = new Property(Group, 'number', "ik_rotorAngleConstraint", { 
                condition: () => Format.rotation_limit === false,
                default: 180,
                export: false
            });

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

            ikRotorAngleConstraintSlider = new NumSlider('slider_ik_rotorAngleConstraint', {
				name: "IK Rotor Angle Constraint",
				description: "",
				category: 'tools',
				condition: () => Group.selected && Modes.edit && Format.rotation_limit === false,
				getInterval: () => 1,
				get: () => {
					let constraint = Group.selected.ik_rotorAngleConstraint;
					if (constraint != null) return constraint;
				},
				change: function (modify) {
                    const group = Group.selected;
                    let constraint = group.ik_rotorAngleConstraint;
                    if (constraint == null) constraint = 180; //equivalent to 360° (-180 to 180)

                    constraint = modify(constraint);
                    group.ik_rotorAngleConstraint = constraint;
				},
				onBefore: function () {
					Undo.initEdit({ group: Group.selected })
				},
				onAfter: function () {
					Undo.finishEdit('Set Bone IK constraints');
				}
			});

            onSelectionUpdated = _ => {
				ikRotorAngleConstraintSlider.update();
			};
			Blockbench.addListener("update_selection", onSelectionUpdated);

            ikToolbar = new DeletableToolbar({
				id: 'tentacle_ik_settings',
				name: 'Tentacle IK Settings',
                condition: () => Group.selected && Format.rotation_limit === false,
				label: true,
				children: [
					'slider_ik_rotorAngleConstraint'
				]
			});
			Interface.Panels.element.addToolbar(ikToolbar);
        },

        onunload() {
            //MenuBar.menus.tools.removeAction(generateTentacleAction);

            // addIKTarget.delete();
            // setEndEffector.delete();
            generateTentacleAction.delete();
            generateTentacleDialog.delete();
            
            rotorAngleConstraintProperty.delete();

            ikToolbar.delete();
            ikRotorAngleConstraintSlider.delete();
            Blockbench.removeListener("update_selection", onSelectionUpdated);

            NullObject.animator = NullObjectAnimator;
            Blockbench.NullObjectAnimator = NullObjectAnimator;
        }
    });

})();