import * as THREE from "./node_modules/three/build/three.module.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { DimensionDistance } from "./src/scripts/Dimensions/dimensionDistance.js";
import { DimensionControls } from "./src/scripts/Dimensions/dimensionControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Initialize renderer with canvas element
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x808080); // Set background color to gray

// Enable OrbitControls for scene rotation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping for smoother rotation
controls.dampingFactor = 0.1;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let dimensionControls;
let dimension;
let clickCount = 0;
let selectedPoints = [];

// Initialize the scene, camera, and controls
function init() {
  console.log("init");
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // Add ambient and directional light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);
  console.log("scene?", scene);

  // Add a test cube to interact with
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Set cube color to blue
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Initialize dimension controls
  dimensionControls = new DimensionControls(
    scene,
    camera,
    renderer.domElement,
    camera
  );
  scene.add(dimensionControls);

  // Set up event listener for click interaction
  window.addEventListener("click", onClick, false);
}

// Handle click events for adding dimensions
function onClick(event) {
  console.log("click");
  // Calculate pointer position in normalized device coordinates
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Perform raycasting
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectPoint = intersects[0].point.clone();

    // Add the intersected point to the selected points array
    selectedPoints.push(intersectPoint);
    clickCount++;

    // Add dimension if two points are selected
    if (clickCount === 2) {
      addDimension(selectedPoints[0], selectedPoints[1]);

      // Reset after adding a dimension
      selectedPoints = [];
      clickCount = 0;
    }
  }
}

// Add dimension logic between two points
function addDimension(point1, point2) {
  // Create a new dimension object
  dimension = new DimensionDistance(renderer.domElement);

  // Set up the dimension and add control points
  dimension.addPoint(point1, null, null); // First control point
  dimension.addPoint(point2, null, null); // Second control point

  // Add dimension to the dimension controls
  dimensionControls.add(dimension);

  // Optionally, update the display to show the dimension
  dimensionControls.update();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update OrbitControls for smooth rotation
  renderer.render(scene, camera);
}

// Initialize and animate
init();
animate();
