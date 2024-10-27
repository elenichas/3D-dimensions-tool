import * as THREE from 'three';

export function getCornersfromVertices(cube) {
    const geometry = cube.geometry;
    const positionAttribute = geometry.getAttribute('position');

    const corners = [];

    const worldMatrix = cube.matrixWorld;

    for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positionAttribute, i);
        vertex.applyMatrix4(worldMatrix);
        corners.push(vertex);
    }

    const uniqueCorners = corners.filter((corner, index, self) =>
        index === self.findIndex((t) => (
            t.x === corner.x && t.y === corner.y && t.z === corner.z
        ))
    );

    console.log("corners from vertices", uniqueCorners);
    visualizePoints(uniqueCorners, cube,0xff00ff,0.05);
    const midPoints = getGeometryEdgeMidpoints(cube.geometry);
    visualizePoints(midPoints,cube,0xFF8633,0.025);

    return uniqueCorners;
}

export function getCornersfromSize(cube) {
    // Assuming cube.geometry.parameters.width, height, and depth represent the dimensions
    const width = cube.geometry.parameters.width;
    const height = cube.geometry.parameters.height;
    const depth = cube.geometry.parameters.depth;

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const corners = [];

    for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
            for (let z = -1; z <= 1; z += 2) {
                let corner = new THREE.Vector3(
                    cube.position.x + x * halfWidth,
                    cube.position.y + y * halfHeight,
                    cube.position.z + z * halfDepth
                );
                corners.push(corner);
            }
        }
    }

    console.log("corners from  size", corners);
    visualizePoints(corners, cube);
    return corners;
}

// helper function to visualize corners with spheres
export function visualizePoints(corners, cube,color,size) {

    const sphereGeometry = new THREE.SphereGeometry(size, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: color});

    corners.forEach(corner => {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(corner);

        cube.add(sphere);
    });
}

function getMidpoints(corners) {
    // if (corners.length !== 8) {
    //   //  throw new Error('There must be exactly 8 corners.');
    //     return [];
        
    // }

    const midpoints = [];

    // A function to create a string key for a pair of points to help with uniqueness
    function createKey(v1, v2) {
        const sorted = [v1, v2].sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
        return `${sorted[0].x},${sorted[0].y},${sorted[0].z}-${sorted[1].x},${sorted[1].y},${sorted[1].z}`;
    }

    const uniquePairs = new Set();

    // Iterate over all pairs of corners
    for (let i = 0; i < corners.length; i++) {
        for (let j = i + 1; j < corners.length; j++) {
            const corner1 = corners[i];
            const corner2 = corners[j];

            // Calculate the distance between corners to identify edges
            const distance = corner1.distanceTo(corner2);
            if (distance > 0 && distance <= Math.sqrt(3)) {  // Edges of the cube
                const key = createKey(corner1, corner2);
                if (!uniquePairs.has(key)) {
                    uniquePairs.add(key);
                    // Calculate the midpoint
                    const midpoint = new THREE.Vector3(
                        (corner1.x + corner2.x) / 2,
                        (corner1.y + corner2.y) / 2,
                        (corner1.z + corner2.z) / 2
                    );
                    midpoints.push(midpoint);
                }
            }
        }
    }

    return midpoints;
}

/**
 * Calculate the unique midpoints of the edges of a Three.js geometry.
 * @param {THREE.Geometry|THREE.BufferGeometry} geometry - The geometry of the object.
 * @returns {THREE.Vector3[]} - Array of Vector3 representing the unique midpoints.
 */
export function getGeometryEdgeMidpoints(geometry) {
    // Ensure the geometry is up-to-date
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edges = edgesGeometry.attributes.position.array;
    const vertices = geometry.attributes.position.array;

    const midpoints = [];

    // A function to create a string key for a pair of points to help with uniqueness
    function createKey(v1, v2) {
        const sorted = [v1, v2].sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
        return `${sorted[0].x},${sorted[0].y},${sorted[0].z}-${sorted[1].x},${sorted[1].y},${sorted[1].z}`;
    }

    const uniquePairs = new Set();

    // Iterate over all edges
    for (let i = 0; i < edges.length; i += 6) {
        const v1 = new THREE.Vector3(edges[i], edges[i + 1], edges[i + 2]);
        const v2 = new THREE.Vector3(edges[i + 3], edges[i + 4], edges[i + 5]);

        const key = createKey(v1, v2);
        if (!uniquePairs.has(key)) {
            uniquePairs.add(key);
            // Calculate the midpoint
            const midpoint = new THREE.Vector3(
                (v1.x + v2.x) / 2,
                (v1.y + v2.y) / 2,
                (v1.z + v2.z) / 2
            );
            midpoints.push(midpoint);
        }
    }

    return midpoints;
}