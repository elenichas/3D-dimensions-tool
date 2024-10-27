import {
  ArrowHelper,
  Raycaster,
  CylinderGeometry,
  Mesh,
  BoxGeometry,
  Vector3,
  Color,
  Object3D,
  DoubleSide,
  Matrix4,
  Vector2,
  MeshBasicMaterial,
  MaterialLoader,
} from "./../../../node_modules/three/build/three.module.js";
import { Projector } from "./Projector.js";
import { UI } from "./DimensionLabel.js";

class DimensionDistance extends Object3D {
  constructor(container) {
    super();
    this.container = container;
    this.color = new Color(0xc75050);
    this.visible = true;

    /**
     * Creates and returns a gizmo for this dimension.
     * @param {Object} container - The HTML container for the gizmo.
     * @returns {Object} The created gizmo.
     */
    this.createGizmo = function (container) {
      this.dimensionGizmo = new DimensionGizmo(this, container);
      return this.dimensionGizmo;
    };

    /**
     * Gets the current dimension value.
     * @returns {number} The dimension value.
     */
    this.getValue = function () {
      return this.dimensionGizmo.getValue();
    };

    /**
     * Gets information about the dimension's control points.
     * @returns {Array} Control points with names and values.
     */
    this.getInfo = function () {
      const controlPoints = this.dimensionGizmo.getControlPointsWorld();
      const info = [];
      for (let i = 0; i < Math.min(2, controlPoints.length); ++i) {
        info.push({
          name: `Point ${i + 1}`,
          values: [controlPoints[i].x, controlPoints[i].y, controlPoints[i].z],
        });
      }
      return info;
    };

    /**
     * Returns the type of this dimension.
     * @returns {string} The dimension type.
     */
    this.getType = function () {
      return "Distance";
    };

    /**
     * Provides a description of the dimension.
     * @returns {string} The description with dimension value.
     */
    this.getDescription = function () {
      const value = this.getValue();
      return value == null ? "distance" : `distance = ${value.toFixed(2)}`;
    };
  }
}

export { DimensionDistance };

const cylinder = new CylinderGeometry(0.2, 0.2, 1, 8, 1, false);
const arrow = new CylinderGeometry(1, 0, 2.5, 8, 1, false);
const box = new BoxGeometry(0.5, 0.5, 0.5);
const loader = new MaterialLoader();
const Material = new MeshBasicMaterial({
  color: 0xff0000,
});

const lightGrayMaterial = Material;
const darkGrayMaterial = Material;
const magendaMaterial = Material;

/**
 * Represents the visual and interactive gizmo for dimensions.
 */
class DimensionGizmo extends Object3D {
  constructor(dimension, container) {
    super();

    let showPickers = true;
    this.dragNormal = new Vector3();
    this.dragOrigin = new Vector3();
    this.lastPosition = new Vector3();
    this.dragGizmo = "";
    this.selected = false;
    const scope = this;
    this.controlPoints = [];
    const projector = new Projector();

    this.container = container;
    this.dimension = dimension;

    let material = null;
    if (
      this.dimension.userData.subType == "auto" &&
      this.dimension.userData.auxType == "simple"
    ) {
      material = darkGrayMaterial;
    } else if (
      this.dimension.userData.subType == "auto" &&
      this.dimension.userData.auxType == "cross"
    ) {
      material = magendaMaterial;
    } else {
      material = lightGrayMaterial;
    }

    const hexColor = material.color.getHex();
    const hexString = `#${hexColor.toString(16).padStart(6, "0")}`;

    material.opacity = 1;
    material.transparent = false;

    this.init = function () {
      this.handles = new Object3D();
      this.pickers = new Object3D();
      this.add(this.handles);
      this.add(this.pickers);

      if (this.container) {
        this.label = new UI.Label("0 mm", this.dimension.userData);
        this.label.dom.style.cssText = `
                    padding:3px 8px 3px;
                    display: none;
                    position: absolute;
                    background-color: ${hexString};
                    opacity:0.65;
                    color: #ffffff;
                    border-radius: 8px;`;
        this.container.appendChild(this.label.dom);

        if (this.dimension.userData.subType == "manual") {
          this.label.dom.children[1].addEventListener("mousedown", (event) => {
            event.cancel = true;
            scope.dispatchEvent({
              type: "XButtonMouseDown",
              dimensionGizmo: scope,
              originalEvent: event,
            });
          });
        }
      }

      // Initialize gizmos and pickers for handles and actions
      for (const handleName in this.handleGizmos) {
        const handle = this.handleGizmos[handleName][0];
        handle.name = handleName;
        this.transformGizmo(
          handle,
          this.handleGizmos[handleName][1],
          this.handleGizmos[handleName][2]
        );
        handle.visible = false;
        this.handles.add(handle);
      }

      for (const pickerName in this.pickerGizmos) {
        const picker = this.pickerGizmos[pickerName][0];
        picker.name = pickerName;
        this.transformGizmo(
          picker,
          this.pickerGizmos[pickerName][1],
          this.pickerGizmos[pickerName][2]
        );
        picker.visible = showPickers;
        picker.dimensionGizmo = this;
        this.pickers.add(picker);
      }
    };

    /**
     * Shows the gizmo and its components.
     */
    this.show = function () {
      this.handles.children.forEach((child) => (child.visible = true));
      this.pickers.children.forEach((child) => (child.visible = true));
      if (this.label.dom.className == "TextComplete") {
        if (this.label && this.label.dom.textContent)
          this.label.setDisplay("flex");
      }
      this.dimension.visible = true;
    };

    /**
     * Sets the value of the gizmo text display.
     * @param {string} text - Text to display.
     * @param {Vector3} position - Position of the text in world space.
     * @param {Camera} camera - The camera used for view adjustments.
     */
    this.setText = function (text, position, camera) {
      if (!this.label) return;

      if (this.label.dom.className == "Text") {
        this.label.setDisplay("flex");
        this.label.setClass("TextComplete");
      }

      const coords = this.getScreenCoords(position, camera);
      const rect = this.label.dom.getBoundingClientRect();
      const offsetX = rect.width / 2;
      const offsetY = rect.height / 2;

      const left = `${coords.x - offsetX}px`;
      const top = `${coords.y - offsetY}px`;

      if (this.label.dom.style.left !== left) this.label.setLeft(left);
      if (this.label.dom.style.top !== top) this.label.setTop(top);

      if (text && this.label.getValue() !== text) this.label.setValue(text);
    };

    // Additional methods here
    this.init();
  }

  /**
   * Projects the given point to a target object using specified directions.
   * @param {Vector3} pointFrom - The starting point.
   * @param {Vector3} pointTo - The target point.
   * @param {Object3D} objectFrom - The starting object.
   * @param {Object3D} objectTo - The target object.
   * @param {Vector3} direction1 - The first direction vector.
   * @param {Vector3} direction2 - The second direction vector.
   * @returns {Vector3|null} The projected point, or null if no intersection.
   */
  projectPoint(
    pointFrom,
    pointTo,
    objectFrom,
    objectTo,
    direction1,
    direction2
  ) {
    const raycast = (origin, direction, targetObject) => {
      const raycaster = new Raycaster(origin, direction);
      return raycaster.intersectObject(targetObject.parent, true);
    };

    const intersects1 = raycast(pointFrom, direction1, objectTo);
    const intersects2 = raycast(pointFrom, direction2, objectTo);
    const intersects3 = raycast(pointTo, direction1, objectFrom);
    const intersects4 = raycast(pointTo, direction2, objectFrom);

    const allIntersections = [
      intersects1,
      intersects2,
      intersects3,
      intersects4,
    ];
    for (const intersects of allIntersections) {
      if (intersects.length > 0) {
        return intersects[0].point;
      }
    }
    return null;
  }
}

export { DimensionGizmo };
