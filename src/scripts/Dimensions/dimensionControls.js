import {
  Object3D,
  Raycaster,
  Vector3,
} from "./../../../node_modules/three/build/three.module.js";
import { Projector } from "./Projector.js";

const projector = new Projector();
const ray = new Raycaster();

/**
 * Controls for managing and interacting with 3D dimensions in a scene.
 */
class DimensionControls extends Object3D {
  constructor(scene, camera, container, control) {
    super();

    const domElement = container;
    this.dimensionGizmos = [];
    this.pickers = [];
    this.enabled = false;
    this.selectedPicker = false;
    this.snap = true;
    this.dragging = false;
    this.domElement = container;
    this.dimensionBeingAdded = false;
    const scope = this;
    this.ray = ray;
    this.control = control;

    this.domElement.addEventListener("mousedown", onPointerDown, false);
    this.domElement.addEventListener("mousemove", onPointerMove, false);
    this.domElement.addEventListener("mouseup", onPointerUp, false);
    window.addEventListener("keydown", onKeyDown, false);

    /**
     * Handles selection of dimension gizmo text.
     * @param {Object} event - The event object.
     */
    this.onGizmoTextSelected = function (event) {
      if (event.dimensionGizmo) {
        notifyGizmoSelection(event.dimensionGizmo);
        scope.select(event.dimensionGizmo.dimension);
      }
    };

    /**
     * Handles mouse down on gizmo text, initializing dragging.
     * @param {Object} event - The event object.
     */
    this.onGizmoTextMouseDown = function (event) {
      if (event.dimensionGizmo && event.originalEvent) {
        scope.selectedPicker = event.dimensionGizmo.getTextPicker();
        if (scope.selectedPicker) {
          camera.updateMatrixWorld();
          const pointer = event.originalEvent.touches
            ? event.originalEvent.touches[0]
            : event.originalEvent;
          const eye = getEyeVector(pointer);

          const planeNormal = new Vector3(0, 0, 1);
          planeNormal.unproject
            ? planeNormal.unproject(camera)
            : projector.unprojectVector(planeNormal, camera);
          const position = this.linePlaneIntersection(
            camera.position,
            eye,
            scope.selectedPicker.position,
            planeNormal
          );

          event.dimensionGizmo.dragStart(
            scope.selectedPicker.name,
            eye,
            position
          );
          scope.dragging = true;
          scope.update();
        }
        notifyGizmoSelection(event.dimensionGizmo);
      }
    };

    /**
     * Adds a new dimension to the scene.
     * @param {Object} dimension - The dimension to add.
     */
    this.add = function (dimension) {
      const gizmo = dimension.createGizmo(container);
      this.addGizmo(gizmo);
    };

    /**
     * Removes a specified dimension from the scene.
     * @param {Object} dimension - The dimension to be removed.
     */
    this.remove = function (dimension) {
      if (dimension && dimension.dimensionGizmo) {
        this.removeGizmo(dimension.dimensionGizmo);
        domElement.style.cursor = "default";
      } else if (
        dimension &&
        dimension.dimensionGizmos &&
        dimension.dimensionGizmos.length > 0
      ) {
        this.removeGizmo(dimension.dimensionGizmos[0]);
        domElement.style.cursor = "default";
      }
    };

    /**
     * Selects a dimension for interaction and highlighting.
     * @param {Object} dimension - The dimension to select.
     */
    this.select = function (dimension) {
      this.dimensionGizmos.forEach((gizmo) => gizmo.select(false));
      if (dimension && dimension.dimensionGizmo) {
        dimension.dimensionGizmo.select();
        scope.update();
        scope.dispatchEvent({
          type: "change",
          scope: "select",
          object: dimension,
        });
      }
    };

    /**
     * Updates the position and status of dimension gizmos.
     */
    this.update = function () {
      camera.updateMatrixWorld();
      this.dimensionGizmos.forEach((gizmo) => {
        gizmo.highlight(false);
        gizmo.update(camera);
      });
      if (scope.selectedPicker) {
        scope.selectedPicker.dimensionGizmo.highlight(
          scope.selectedPicker.name
        );
      }
    };

    /**
     * Notifies listeners of a gizmo selection event.
     * @param {Object} dimensionGizmo - The selected dimension gizmo.
     */
    function notifyGizmoSelection(dimensionGizmo) {
      scope.dispatchEvent({
        type: "select",
        dimension: dimensionGizmo ? dimensionGizmo.dimension : null,
      });
    }

    // Additional event handling and utility functions
    function onPointerDown(event) {
      /* Implementation */
    }
    function onPointerUp(event) {
      /* Implementation */
    }
    function onPointerMove(event) {
      /* Implementation */
    }
    function onKeyDown(event) {
      /* Implementation */
    }
    function getEyeVector(pointer) {
      /* Implementation */
    }
  }

  /**
   * Adds a dimension gizmo to the scene and updates the list.
   * @param {Object} dimensionGizmo - The gizmo to add.
   */
  addGizmo(dimensionGizmo) {
    super.add(dimensionGizmo);
    this.dimensionGizmos.push(dimensionGizmo);
    dimensionGizmo.addEventListener(
      "XButtonMouseDown",
      this.onXButtonMouseDown
    );

    if (dimensionGizmo.acceptPoints()) {
      this.domElement.style.cursor = "crosshair";
    }

    this.pickers.push(...dimensionGizmo.pickers.children);
    this.update();
  }

  /**
   * Removes a dimension gizmo from the scene and updates.
   * @param {Object} dimensionGizmo - The gizmo to remove.
   */
  removeGizmo(dimensionGizmo) {
    dimensionGizmo.pickers.children.forEach((picker) => {
      picker.material.dispose();
      picker.geometry.dispose();
      const index = this.pickers.indexOf(picker);
      if (index >= 0) this.pickers.splice(index, 1);
    });

    dimensionGizmo.handles.children.forEach((handle) => {
      handle.material.dispose();
      handle.geometry.dispose();
    });

    if (dimensionGizmo.parent.userData.subType == "manual") {
      dimensionGizmo.removeEventListener(
        "XButtonMouseDown",
        this.onXButtonMouseDown
      );
    }

    const index = this.dimensionGizmos.indexOf(dimensionGizmo);
    if (index >= 0) this.dimensionGizmos.splice(index, 1);

    dimensionGizmo.removeLabel();
    super.remove(dimensionGizmo);
    this.update();
  }
}

export { DimensionControls };
