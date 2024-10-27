import {
  DoubleSide,
  EventDispatcher,
  FlatShading,
  Mesh,
  MeshPhongMaterial,
  Vector3,
} from "three";
import { DimensionControls } from "./DimensionControls.js";
import { Dimension } from "./Dimension.js";
import { DimensionDistance } from "./DimensionDistance.js";

class DimensionController extends EventDispatcher {
  constructor(dom, renderer, control, camera, scene) {
    super();
    const scope = this;
    //const container = new UI.Panel().setPosition('absolute');
    const container = document.createElement("div");
    container.className = "Panel";

    var dimensionControls, light;

    this.addDimension = function (dimension) {
      dimensionControls.add(dimension);
      dimensionControls.enabled = true;
    };

    this.removeDimension = function (dimension) {
      dimensionControls.remove(dimension);
      if (dimension.parent) dimension.parent.remove(dimension);
    };

    this.addObject = function (mesh) {
      if (!(mesh instanceof Mesh)) return null;
      var geometry = mesh.geometry;
      var boundingSphere = geometry.boundingSphere.clone();
      mesh.rotateX(-Math.PI / 2);
      mesh.updateMatrixWorld();
      scene.add(mesh);
      var center = mesh.localToWorld(boundingSphere.center);
      scope.controls.target.copy(center);
      scope.controls.minDistance = boundingSphere.radius * 0.5;
      scope.controls.maxDistance = boundingSphere.radius * 3;
      camera.position.set(0, 0, boundingSphere.radius * 0.5).add(center);
      camera.lookAt(center);
    };

    this.addGeometry = function (geometry) {
      var material = geometry.hasColors
        ? new MeshPhongMaterial({
            specular: 0x111111,
            emissive: 0x151515,
            color: 0xff5533,
            shininess: 20,
            side: DoubleSide,
            opacity: geometry.alpha,
            vertexColors: true,
            flatShading: FlatShading,
          })
        : new MeshPhongMaterial({
            specular: 0x111111,
            emissive: 0x050505,
            color: 0xff5533,
            shininess: 20,
            side: DoubleSide,
            flatShading: FlatShading,
          });

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

    this.clear = function () {
      while (scene.children.length) scene.remove(scene.children[0]);
    };

    this.clearDimensions = function () {
      console.log("SCENE", scene);

      var dimensions = [];
      for (var key in scene.children) {
        scene.children[key].traverse(function (child) {
          if (child instanceof DimensionDistance) dimensions.push(child);
        });
      }

      for (var key in dimensions) {
        this.removeDimension(dimensions[key]);
      }

      dimensions = [];
    };

    function initialize() {
      console.log("init 3d view measures");
      dom = dom ? dom : window;
      dom.appendChild(container);
      container.appendChild(renderer.domElement);

      scope.controls = control;
      scope.controls.enableDamping = true;
      scope.controls.dampingFactor = 0.25;
      scope.controls.enableZoom = true;

      // dimension controls
      dimensionControls = new DimensionControls(
        { objects: scene.children },
        camera,
        container,
        control
      );
      dimensionControls.enabled = true;
      dimensionControls.snap = true;
      scene.add(dimensionControls);

      scope.controls.addEventListener("change", function () {
        dimensionControls.update();
        //render();
        renderer.render(scene, camera);
      });

      dimensionControls.addEventListener("change", function (event) {
        scope.dispatchEvent({
          type: "dimensionChanged",
          object: event.object,
        });
        //render();
        renderer.render(scene, camera);
      });

      dimensionControls.addEventListener("objectAdded", function (event) {
        scope.dispatchEvent({ type: "dimensionAdded", object: event.object });
        //render();
        renderer.render(scene, camera);
      });
      dimensionControls.addEventListener("objectRemoved", function (event) {
        scope.dispatchEvent({
          type: "dimensionRemoved",
          object: event.object,
        });
      });
    }

    initialize();
  }
}

export { DimensionController };

class computeFaceNormal {
  constructor(geometry, face) {
    var cb = new Vector3(),
      ab = new Vector3();
    if (!face) return cb;
    //new method
    const positionAttribute = geometry.attributes.position;
    const vertex = new Vector3();
    var vA = vertex.fromBufferAttribute(positionAttribute, face.a);
    var vB = vertex.fromBufferAttribute(positionAttribute, face.b);
    var vC = vertex.fromBufferAttribute(positionAttribute, face.c);
    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab);
    cb.normalize();
    face.normal.copy(cb);
    return face.normal;
  }
}

export { computeFaceNormal };
