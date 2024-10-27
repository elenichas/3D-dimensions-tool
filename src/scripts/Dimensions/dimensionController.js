import {
  EventDispatcher,
  Mesh,
  Vector3,
  MeshStandardMaterial,
} from "./../../../node_modules/three/build/three.module.js";
import { DimensionControls } from "./DimensionControls.js";
import { DimensionDistance } from "./DimensionDistance.js";

const material = new MeshStandardMaterial({ color: 0xff5533 });

/**
 * Controller for handling 3D dimensions in a scene.
 * Allows adding, removing, and managing dimension objects.
 */
class DimensionController extends EventDispatcher {
  constructor(
    dom,
    renderer,
    control,
    camera,
    scene,
    layer,
    viewport,
    userData
  ) {
    super();
    const scope = this;
    let container;
    let dimensionControls;
    let dimension;

    /**
     * Adds a new dimension to the scene and enables controls.
     */
    this.addDimension = function () {
      dimension = new DimensionDistance();
      dimension.userData = userData;
      dimensionControls.add(dimension);
      dimensionControls.enabled = true;
    };

    /**
     * Removes a specified dimension from the scene.
     * @param {Object} dimension - The dimension to be removed.
     */
    this.removeDimension = function (dimension) {
      if (dimension.parent) {
        dimension.parent.remove(dimension);
      }
      dimension.domElement.removeChild(dimension.children[0].label.dom);
    };

    /**
     * Returns the current dimension object.
     * @returns {Object} The current dimension.
     */
    this.returnDimension = function () {
      return dimension;
    };

    /**
     * Adds a mesh object to the scene with appropriate settings.
     * @param {Mesh} mesh - The mesh to be added.
     * @returns {Mesh|null} The added mesh or null if invalid.
     */
    this.addObject = function (mesh) {
      if (!(mesh instanceof Mesh)) return null;

      const geometry = mesh.geometry;
      const boundingSphere = geometry.boundingSphere.clone();

      mesh.rotateX(-Math.PI / 2);
      mesh.updateMatrixWorld();
      scene.add(mesh);

      const center = mesh.localToWorld(boundingSphere.center);
      scope.controls.target.copy(center);
      scope.controls.minDistance = boundingSphere.radius * 0.5;
      scope.controls.maxDistance = boundingSphere.radius * 3;
      camera.position.set(0, 0, boundingSphere.radius * 0.5).add(center);
      camera.lookAt(center);
    };

    /**
     * Adds a geometry as a mesh to the scene with default material and settings.
     * @param {THREE.Geometry} geometry - The geometry to add as a mesh.
     * @returns {Mesh} The added mesh.
     */
    this.addGeometry = function (geometry) {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(-0.7, -0.7, -0.7);
      mesh.scale.set(0.15, 0.15, 0.15);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.normalsNeedUpdate = true;
      mesh.center = true;
      geometry.computeBoundingSphere();
      return this.addObject(mesh);
    };

    /**
     * Clears all objects from the scene.
     */
    this.clear = function () {
      while (scene.children.length) scene.remove(scene.children[0]);
    };

    /**
     * Initializes the controller, setting up event listeners and controls.
     */
    function initialize() {
      dom = dom || window;
      container = dom;

      scope.controls = control;
      scope.controls.enableDamping = true;
      scope.controls.dampingFactor = 0.25;
      scope.controls.enableZoom = true;

      dimensionControls = new DimensionControls(
        scene,
        camera,
        container,
        control
      );
      dimensionControls.enabled = true;
      dimensionControls.snap = true;
      dimensionControls.userData = userData;

      scene.add(dimensionControls);

      scope.controls.addEventListener("change", function () {
        dimensionControls.update();
      });
    }

    initialize();
  }
}

/**
 * Computes the normal vector for a face in geometry.
 */
class computeFaceNormal {
  constructor(geometry, face) {
    const cb = new Vector3(),
      ab = new Vector3();
    if (!face) return cb;

    // Calculate face normal
    const positionAttribute = geometry.attributes.position;
    const vertex = new Vector3();
    const vA = vertex.fromBufferAttribute(positionAttribute, face.a);
    const vB = vertex.fromBufferAttribute(positionAttribute, face.b);
    const vC = vertex.fromBufferAttribute(positionAttribute, face.c);

    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab);
    cb.normalize();
    face.normal.copy(cb);
    return face.normal;
  }
}

export { DimensionController };
export { computeFaceNormal };
