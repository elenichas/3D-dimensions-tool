import * as THREE from "three";
import {
  PerspectiveCamera,
  WebGLRenderer,
  sRGBEncoding,
  HemisphereLight,
  Scene,
} from "three";
import { OrbitControls } from "./js/threejsScripts/OrbitControls.js";
import { DimensionController } from "./js/dimension/DimensionController.js";
import { DimensionDistance } from "./js/dimension/DimensionDistance.js";
import { getCornersfromVertices } from "./js/dimension/Snapping.js";

let container, camera, scene, renderer;
let control;

function init() {
  console.log("init");

  container = document.getElementById("container");
  document.body.appendChild(container);
  scene = new Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1500
  );
  camera.position.set(3, 0.15, 3);

  // renderer
  renderer = new WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = sRGBEncoding;
  renderer.shadowMap.enabled = true;

  container.appendChild(renderer.domElement);

  //scene orbit controls
  control = new OrbitControls(camera, renderer.domElement);
  control.enableDamping = true;
  control.dampingFactor = 0.25;
  control.enableZoom = true;

  //add cube
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xd8d8d8 });
  const cube = new THREE.Mesh(geometry, material);

  scene.add(cube);
  getCornersfromVertices(cube);

  //add cylinder
  const geometry2 = new THREE.CylinderGeometry(1, 1, 1, 32);
  const material2 = new THREE.MeshStandardMaterial({ color: 0xd8d8d8 });
  const cylinder = new THREE.Mesh(geometry2, material2);
  cylinder.position.set(0, 0, 2);
  scene.add(cylinder);

  getCornersfromVertices(cylinder);

  // add dodecahedron
  const geometry3 = new THREE.DodecahedronGeometry(1);
  const material3 = new THREE.MeshStandardMaterial({ color: 0xd8d8d8 });
  const dodecahedron = new THREE.Mesh(geometry3, material3);
  dodecahedron.position.set(0, 0, 5);
  scene.add(dodecahedron);

  getCornersfromVertices(dodecahedron);

  //Lights
  scene.add(new HemisphereLight(0x443333, 0x111122));
  addShadowedLight(10, 10, 10, 0xffffff, 1);
  addShadowedLight(0.5, 1, -1, 0xffffff, 1);

  var dimensionController = new DimensionController(
    document.getElementById("container"),
    renderer,
    control,
    camera,
    scene
  );

  var element = document.getElementById("clearbutton");
  var listener = element.addEventListener("click", function (event) {
    dimensionController.clearDimensions();
    render();
  });

  var element = document.getElementById("distancebutton");
  var listener = element.addEventListener("click", function (event) {
    dimensionController.addDimension(new DimensionDistance());
  });

  //on dimension added
  dimensionController.addEventListener("dimensionAdded", function (event) {
    var dimension = event.object;

    if (dimension) {
      console.log("added", dimension, dimension.getInfo());
    }
  });

  //on dimension changed
  dimensionController.addEventListener("dimensionChanged", function (event) {
    var dimension = event.object;

    if (dimension) {
      console.log("changed", dimension, dimension.getInfo());
    }
  });

  //on dimension removed
  dimensionController.addEventListener("dimensionRemoved", function (event) {
    var dimension = event.object;

    if (dimension) {
      console.log("removed", dimension, dimension.getInfo());
    }
  });

  //window
  window.addEventListener("resize", onWindowResize, false);
  onWindowResize();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // dimensionControls.update();
}

function animate() {
  // requestAnimationFrame(animate);
  control.update();
  // light.position.copy(camera.position);
  render();
}

function render() {
  renderer.render(scene, camera);
}

init();
animate();

function addShadowedLight(x, y, z, color, intensity) {
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  scene.add(directionalLight);
  directionalLight.castShadow = true;
  const d = 1;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 4;
  directionalLight.shadow.bias = -0.002;
}
