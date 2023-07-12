/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 * @copyright Elenterius 2023
 * @license ARR (All Rights Reserved)
 */
"use strict";

(function () {
	"use strict";

	const PLUGIN_ID = "render_order_setter";

	function computeRenderOrder() {
		unselectAll(); //removes all gizmos & etc. that could increase the resulting bounding box

		const outlinerElements = Outliner.elements.filter((element, _) => element.mesh != null);
		if (outlinerElements.length <= 0) return;

		for (const element of outlinerElements) {
			element.aabb = new THREE.Box3().setFromObject(element.mesh);
		}

		const box = new THREE.Box3();
		const size = new THREE.Vector3();

		const intersectionResults = outlinerElements
			.map((element, index) => {
				const aabb = element.aabb;

				const otherElements = outlinerElements.filter((_, i) => i !== index);
				const isIntersecting = otherElements.some((other) => {
					box.copy(aabb).intersect(other.aabb);
					box.getSize(size);
					return size.x * size.y * size.z !== 0;
				});
				const isContained = otherElements.some((other) => other.aabb.containsBox(aabb));

				return {
					index,
					isIntersecting,
					isContained
				};
			});

		intersectionResults.sort((a, b) => {
			if (a.isIntersecting && !b.isIntersecting) {
				return 1;
			}
			else if (!a.isIntersecting && b.isIntersecting) {
				return -1;
			}
			else {
				const bContainsA = outlinerElements[b.index].aabb.containsBox(outlinerElements[a.index].aabb);
				if (bContainsA) {
					return 1;
				}

				const aContainsB = outlinerElements[a.index].aabb.containsBox(outlinerElements[b.index].aabb);
				if (aContainsB) {
					return -1;
				}

				return 0;
			}
		});

		intersectionResults.forEach((result, i) => {
			const renderOrder = !result.isContained ? 0 : -i;
			const element = outlinerElements[result.index];
			element.threejs_render_order = renderOrder;
			element.mesh.renderOrder = renderOrder;
		});
	}

	// eslint-disable-next-line no-unused-vars
	function logRenderOrder() {
		const size = Outliner.elements.length;
		for (let i = 0; i < size; i++) {
			const node = Outliner.elements[i];
			if (node.mesh) {
				console.log(i, node.name, node.mesh.renderOrder);
			}
		}
	}

	function parseInt(value) {
		let parsed = Number.parseInt(value);
		if (Number.isNaN(parsed)) return 0;
		return parsed;
	}

	class DeletableToolbar extends Toolbar {
		delete() {
			this.node.remove();
			this.label_node?.remove();
		}
	}

	let onSelectionUpdated;
	let renderOrderToolbar, renderOrderSlider, renderOrderProperty, computeRenderOrderAction;

	BBPlugin.register(PLUGIN_ID, {
		title: "Render Order Setter",
		author: "Elenterius",
		description: "Allows users to manually set the render order of objects in Blockbench and thus control the rendering sequence of transparent elements.",
		about: "When working with transparent elements in Blockbench, rendering order becomes crucial to get the correct visual preview.<br/><br/>Blockbench uses the Three.js Renderer (WebGL) and by default, Three.js renders transparent objects based on their distance from the camera (from farthest to closest). However, this calculation is based on the object's origin (pivot point), which may not always produce the desired outcome.<br/><h2>Disclaimer</h2><b>This will only partially solve the transparency issues. Transparency artifacts will still presist due to Three.js/WebGL limitations.</b>",
		icon: "logo_dev",
		tags: ["Blockbench", "Utility", "Transparency"],
		version: "0.0.1",
		min_version: "4.5.0",
		//max_version: "5.0.0",
		variant: "both",

		onload() {
			renderOrderProperty = new Property(Cube, 'number', "threejs_render_order", {
				label: "ThreeJs Render Order",
				default: 0,
				placeholder: 0,
				merge: (cube, data) => {
					const renderOrder = parseInt(data.threejs_render_order);
					const nodes3d = Project.nodes_3d;
					const uuid = cube.uuid;

					cube.threejs_render_order = renderOrder;

					setTimeout(() => {
						const mesh = nodes3d[uuid];
						if (mesh) {
							mesh.renderOrder = renderOrder;
						}
					}, 50);
				}
			});

			const description = "Rendering of transparent objects is order dependent.\nThree.js renders transparent objects from farthest to closest to the camera.\nBy default Three.js calculates the distance of the object to the camera using its origin (pivot point).";

			renderOrderSlider = new NumSlider('slider_threejs_render_order', {
				name: "Three.js Render Order (Transparency)",
				description: description,
				category: 'tools',
				condition: () => Cube.selected.length && Modes.edit,
				getInterval: () => 1,
				get: () => {
					let renderOrder = Cube.selected[0].threejs_render_order;
					if (renderOrder != null) return renderOrder;
				},
				change: function (modify) {
					Cube.selected
						.filter((node, _) => node.mesh != null)
						.forEach((node, _) => {
							let renderOrder = node.threejs_render_order;
							if (renderOrder == null) renderOrder = 0;

							renderOrder = modify(renderOrder);
							node.mesh.renderOrder = renderOrder;
							node.threejs_render_order = renderOrder;
						});
				},
				onBefore: function () {
					Undo.initEdit({ elements: Cube.selected })
				},
				onAfter: function () {
					Undo.finishEdit('Set ThreeJs Render Order');
				}
			});

			renderOrderToolbar = new DeletableToolbar({
				id: 'threejs_render_order',
				name: 'Threejs Render Order',
				label: true,
				children: [
					'slider_threejs_render_order'
				]
			});
			Interface.Panels.element.addToolbar(renderOrderToolbar);

			onSelectionUpdated = _ => {
				renderOrderSlider.update();
			};

			Blockbench.addListener("update_selection", onSelectionUpdated);

			computeRenderOrderAction = new Action('action_compute_render_order', {
                name: 'Compute Render Order',
				description: description,
                icon: 'logo_dev',
                category: 'tools',
                condition: () => { return Modes.edit },
                click: computeRenderOrder,
            });
            MenuBar.menus.tools.addAction(computeRenderOrderAction);
		},
		onunload() {
			renderOrderToolbar.delete();
			MenuBar.menus.tools.removeAction(computeRenderOrderAction);

			renderOrderSlider.delete();
			renderOrderProperty.delete();
			computeRenderOrderAction.delete();

			Blockbench.removeListener("update_selection", onSelectionUpdated);
		},
		oninstall() {},
		onuninstall() {}
	});

})();