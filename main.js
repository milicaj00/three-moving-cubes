import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
);
camera.position.set(0, 10, 10);
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x606060);
document.body.appendChild(renderer.domElement);

var controls = new OrbitControls(camera, renderer.domElement);

var dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
dirLight.position.setScalar(10);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x404040));

scene.add(new THREE.GridHelper(20, 20, 0x404040, 0x404040));

var plane = new THREE.Plane();
plane.setFromCoplanarPoints(
    new THREE.Vector3(),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 1)
);

var controlPoints = [];
controlPoints.push(createPoint(new THREE.Vector3(-5, 0, 0), "white"));
controlPoints.push(createPoint(new THREE.Vector3(5, 0, -5), "white"));
controlPoints.push(createPoint(new THREE.Vector3(0, 0, 5), "white"));
controlPoints.push(createPoint(new THREE.Vector3(0, 0, 0), "white"));

// controlPoints[0].onmousedown(e => {
//     console.log(e.clientX);
//     console.log(e.clientY);
//     console.log(e.clientZ);
// });

function createPoint(position, color) {
    var viewGeometry = new THREE.BoxGeometry(0.5, 1.55, 0.5, 1, 3, 1);
    viewGeometry.translate(0, 0.75, 0);
    var viewMaterial = new THREE.MeshBasicMaterial({
        color: color
        // wireframe: false,
        // transparent: true,
        // opacity: 0.5
    });

    var view = new THREE.Mesh(viewGeometry, viewMaterial);
    view.position.copy(position);

    view.scale.x = 2;
    view.scale.y = 1;
    view.scale.z = 1;

    scene.add(view);

    return view;
}

var points = [];

controlPoints.forEach(vertex => {
    points.push(new THREE.Vector2(vertex.x, vertex.z)); // fill the array of points with THREE.Vector2() for re-use
});

window.addEventListener("mousedown", onMouseDown, false);
window.addEventListener("mouseup", onMouseUp, false);
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("keydown", onKey, false);

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersects;
var dragging = false;
var dragObject;
var pointOfIntersection = new THREE.Vector3();
var planeNormal = new THREE.Vector3(0, 1, 0);
var shift = new THREE.Vector3();
let key = false;

function onKey(ev) {
    console.log("key", ev.keyCode);
    if (ev.keyCode === 16) {
        key = true;
    }
}

function onMouseDown(event) {
   // raycaster.linePrecision = 5
   console.log({controlPoints})
    intersects = raycaster.intersectObjects(controlPoints);
    console.log({ event });
    console.log((event.clientX / window.innerWidth) * 2);
    console.log(intersects[0].object.position);
    console.log(intersects[0].point);
    console.log({mouse})
    if (key) {
        if (intersects.length > 0) {
            controls.enableRotate = false;
            dragObject = intersects[0].object;
            // dragObject.scale.x = 2;
            // dragObject.scale.y = 4;
            console.log({ dragObject });
            var intersectPoint = intersects[0].point;
            var line = new THREE.Line3();
            console.log({ controlPoints });
            var positions = dragObject.geometry.getAttribute("position").array;
            let minDistance = 0;
            let distance;
            let closestEdgeIndex;
            console.log({ intersectPoint });
            for (var i = 0; i < positions.length; i += 2) {
                line.start.fromArray(positions, i * 3);
                line.end.fromArray(positions, i * 3 + 3);

                var closestPoint = line.closestPointToPoint(intersectPoint);
                if (closestPoint)
                    distance = closestPoint.distanceTo(intersectPoint);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestEdgeIndex = i;
                }
            }
            console.log({ closestEdgeIndex });
        }
    }
    else if (intersects.length > 0) {
        controls.enableRotate = false;
        dragObject = intersects[0].object;

        plane.setFromNormalAndCoplanarPoint(planeNormal, intersects[0].point);
        shift.subVectors(dragObject.position, intersects[0].point);
        dragging = true;
    }
}

function onMouseUp(event) {
    controls.enableRotate = true;
    dragObject = null;
    dragging = false;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (intersects?.length == 0 || !dragging) return;
    raycaster.ray.intersectPlane(plane, pointOfIntersection);
    dragObject.position.copy(pointOfIntersection).add(shift);
}

var time = 0;
var curShift = 0;
render();
function render() {
    time = Date.now() * 0.001;
    requestAnimationFrame(render);
    raycaster.setFromCamera(mouse, camera);
    controlPoints.forEach((cp, idx) => {
        curShift = (Math.PI / 2) * idx;
        cp.material.opacity = 0.6 + Math.sin(time - curShift) * 0.2;
    });
    renderer.render(scene, camera);
}
