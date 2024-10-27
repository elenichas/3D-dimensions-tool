import { Object3D, Raycaster, Vector3 } from "three";
import { Projector } from "./Projector.js";
import {
  getCornersfromVertices,
  getGeometryEdgeMidpoints,
} from "./Snapping.js";

////////////////////////////////////////////////////////////////////////////////
//Control
//DimensionControls class
////////////////////////////////////////////////////////////////////////////////

class DimensionControls extends Object3D {
  constructor(viewport, camera, container, control) {
    super();
    const domElement = container;
    this.dimensionGizmos = [];
    this.pickers = [];
    this.enabled = false;
    this.selectedPicker = false;
    this.snap = true;
    this.dragging = false;
    this.domElement = container;
    const scope = this;
    const sceneChangedEvent = { type: "sceneChanged" };
    this.changeEvent = { type: "change" };
    this.sceneChangedEvent = { type: "sceneChanged" };
    const ray = new Raycaster();
    this.ray = ray;
    const projector = new Projector();
    this.control = control;

    this.domElement.addEventListener("mousedown", onPointerDown, false);
    this.domElement.addEventListener("touchstart", onPointerDown, false);
    this.domElement.addEventListener("mousemove", onPointerHover, false);
    this.domElement.addEventListener("touchmove", onPointerHover, false);
    this.domElement.addEventListener("mousemove", onPointerMove, false);
    this.domElement.addEventListener("touchmove", onPointerMove, false);
    this.domElement.addEventListener("mouseout", onPointerMove, false);
    this.domElement.addEventListener("mouseup", onPointerUp, false);
    this.domElement.addEventListener("mouseout", onPointerUp, false);
    this.domElement.addEventListener("touchend", onPointerUp, false);
    this.domElement.addEventListener("touchcancel", onPointerUp, false);
    this.domElement.addEventListener("touchleave", onPointerUp, false);

    window.addEventListener("keydown", onKeyDown, false);

    this.onGizmoTextSelected = function (event) {
      if (event.dimensionGizmo) {
        notifyGizmoSelection(event.dimensionGizmo);
        scope.select(event.dimensionGizmo.dimension);
      }
    };

    this.onGizmoTextMouseDown = function (event) {
      if (event.dimensionGizmo && event.originalEvent) {
        scope.selectedPicker = event.dimensionGizmo.getTextPicker();
        if (scope.selectedPicker) {
          camera.updateMatrixWorld();
          var pointer = event.originalEvent.touches
            ? event.originalEvent.touches[0]
            : event.originalEvent;
          var eye = getEyeVector(pointer);

          var planeNormal = new Vector3(0, 0, 1);
          if (planeNormal.unproject) planeNormal.unproject(camera);
          else projector.unprojectVector(planeNormal, camera);
          var position = this.linePlaneIntersection(
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

    function notifyGizmoSelection(dimensionGizmo) {
      if (dimensionGizmo)
        scope.dispatchEvent({
          type: "select",
          dimension: dimensionGizmo.dimension,
        });
      else scope.dispatchEvent({ type: "select" });
    }

    this.add = function (dimension) {
      var gizmo = dimension.createGizmo(container);
      this.addGizmo(gizmo);
    };

    this.remove = function (dimension) {
      if (dimension && dimension.dimensionGizmo)
        this.removeGizmo(dimension.dimensionGizmo);
      scope.dispatchEvent({ type: "objectRemoved", object: dimension });
    };

    this.onAddedObject = function (dimension) {
      scope.dispatchEvent({ type: "objectAdded", object: dimension });
    };

    this.select = function (dimension) {
      //unselect everything
      for (var i = 0; i < this.dimensionGizmos.length; ++i) {
        this.dimensionGizmos[i].select(false);
      }
      //select what is needed
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

    this.update = function () {
      camera.updateMatrixWorld();
      for (var i = 0; i < this.dimensionGizmos.length; ++i) {
        this.dimensionGizmos[i].highlight(false);
        this.dimensionGizmos[i].update(camera);
      }
      if (scope.selectedPicker)
        scope.selectedPicker.dimensionGizmo.highlight(
          scope.selectedPicker.name
        );
    };

    this.acceptPoints = function () {
      var dimensionGizmo =
        scope.dimensionGizmos.length > 0
          ? scope.dimensionGizmos[scope.dimensionGizmos.length - 1]
          : null;
      return dimensionGizmo && dimensionGizmo.acceptPoints();
    };

    function onPointerUp(event) {
      if (event && event.cancel) return; //the event is cancelled
      if (
        event &&
        event.type == "mouseout" &&
        event.relatedTarget &&
        event.relatedTarget.parentElement == domElement
      )
        return; //the mouse is actually over the child element

      if (scope.dragging) event.cancel = true; //prevent other listeners from getting this event
      var dimension = scope.selectedPicker
        ? scope.selectedPicker.dimensionGizmo.dimension
        : null;

      scope.dragging = false;
      scope.selectedPicker = false;
      scope.control.enabled = true;
      domElement.style.cursor = "default";

      if (!event.rendered) {
        event.rendered = true; //prevent other listeners from rendering
      }
      scope.dispatchEvent({
        type: "change",
        scope: "finishDragging",
        object: dimension,
      });
      scope.update();
    }

    function onPointerHover(event) {
      if (event && event.cancel) return; //the event is cancelled
      if (!scope.enabled || scope.dragging) return;
      event.preventDefault();
      var pointer = event.touches ? event.touches[0] : event;
      var intersect = intersectObjects(pointer, scope.pickers, false);

      if (intersect) {
        if (scope.selectedPicker !== intersect.object) {
          scope.selectedPicker = intersect.object;
          scope.update();
          if (!event.rendered) {
            event.rendered = true; //prevent other listeners from rendering
            scope.dispatchEvent({
              type: "change",
              scope: "hover",
              object: scope.selectedPicker
                ? scope.selectedPicker.dimensionGizmo.dimension
                : null,
            });
          }
        }
      } else {
        if (scope.selectedPicker !== false) {
          scope.selectedPicker = false;
          scope.update();
          if (!event.rendered) {
            event.rendered = true; //prevent other listeners from rendering
            scope.dispatchEvent({ type: "change", scope: "hover" });
          }
        }
      }
    }

    function onPointerDown(event) {
      if (event && event.cancel) return; //the event is cancelled
      if (!scope.enabled) return;
      event.preventDefault();
      event.stopPropagation();
      var pointer = event.touches ? event.touches[0] : event;
      if (pointer.button === 0 || pointer.button == undefined) {
        //check if last dimensionGizmo is accepting points
        var dimensionGizmo =
          scope.dimensionGizmos.length > 0
            ? scope.dimensionGizmos[scope.dimensionGizmos.length - 1]
            : null;
        if (dimensionGizmo && dimensionGizmo.acceptPoints()) {
          //check for intersection with scene objects
          var intersect = intersectObjects(pointer, viewport.objects, false);
          if (intersect) {
            // if (scope.snap && dimensionGizmo.mustSnapToPart()) {
            //     const v1 = snapToVertex(intersect, dimensionGizmo);
            //     const v2 = snapToMidPoint(intersect, dimensionGizmo);
            //     if (v1.distance == 1000 && v2.distance == 1000) {
            //         //do nothing
            //         console.log("NO SNAP");
            //     }
            //     else if (v1.distance <= v2.distance) {
            //         //snap to vertex wins
            //         console.log("snap to corner wins");
            //         intersect.point = v1.point;
            //     } else {

            //         //snap to mid point wins
            //         console.log("snap to mid point wins");
            //         intersect.point = v2.point;
            //     }
            // }

            dimensionGizmo.addControlPoint(
              intersect.point,
              intersect.object,
              null,
              intersect.face,
              scope.onAddedObject
            );

            if (dimensionGizmo.mustDragGizmo()) {
              scope.selectedPicker = dimensionGizmo.mustDragGizmo();
              var eye = getEyeVector(pointer);
              dimensionGizmo.addControlPoint(
                intersect.point,
                intersect.object,
                null,
                null,
                scope.onAddedObject
              );
              dimensionGizmo.dragStart(
                scope.selectedPicker.name,
                eye,
                intersect.point
              );
              domElement.style.cursor = "default";
              scope.dragging = true;
            } else
              domElement.style.cursor = dimensionGizmo.acceptPoints()
                ? "crosshair"
                : "default";

            event.cancel = true; //prevent other listeners from getting this event
            scope.update();
            notifyGizmoSelection(dimensionGizmo);
            scope.dispatchEvent(sceneChangedEvent);
          }
        } else {
          //check for intersection with gizmos
          var intersect = intersectObjects(pointer, scope.pickers, false);
          if (intersect) {
            scope.selectedPicker = intersect.object;
            var dimensionGizmo = intersect.object.dimensionGizmo;
            if (dimensionGizmo) {
              camera.updateMatrixWorld();
              var eye = getEyeVector(pointer);
              dimensionGizmo.dragStart(
                intersect.object.name,
                eye,
                intersect.point
              );
              event.cancel = true; //prevent other listeners from getting this event
              scope.dragging = true;
              scope.control.enabled = false;
              domElement.style.cursor = "pointer";
              scope.update();
              notifyGizmoSelection(dimensionGizmo);
            }
          } else {
            scope.control.enabled = true;
            domElement.style.cursor = "default";
          }
        }
      }
    }

    function onPointerMove(event) {
      if (event && event.cancel) return; //the event is cancelled
      if (!scope.enabled) return;
      var dimensionGizmo =
        scope.dimensionGizmos.length > 0
          ? scope.dimensionGizmos[scope.dimensionGizmos.length - 1]
          : null;
      if (dimensionGizmo && dimensionGizmo.acceptPoints())
        domElement.style.cursor = "crosshair";
      if (!scope.dragging) return;
      event.preventDefault();
      event.stopPropagation();
      var pointer = event.touches ? event.touches[0] : event;
      if (scope.selectedPicker && scope.selectedPicker.dimensionGizmo) {
        var dimensionGizmo = scope.selectedPicker.dimensionGizmo;
        camera.updateMatrixWorld();
        var eye = getEyeVector(pointer);
        var cameraPos = new Vector3().setFromMatrixPosition(camera.matrixWorld);
        dimensionGizmo.dragMove(scope.selectedPicker.name, eye, cameraPos);
        event.cancel = true; //prevent other listeners from getting this event
        scope.dispatchEvent({
          type: "change",
          scope: "dragging",
          object: scope.selectedPicker.dimensionGizmo.dimension,
        });
        scope.update();
      }
    }

    function onKeyDown(event) {
      if (this.enabled === false) return;
      switch (event.keyCode) {
        case 27: //ESC
          cancelDimension();
          break;
      }
    }

    function cancelDimension() {
      var dimensionGizmo =
        this.dimensionGizmos.length > 0
          ? this.dimensionGizmos[this.dimensionGizmos.length - 1]
          : null;
      if (dimensionGizmo && dimensionGizmo.acceptPoints()) {
        this.remove(dimensionGizmo.dimension);
        dimensionGizmo.removeUIObject();
        notifyGizmoSelection();
        this.dispatchEvent(this.sceneChangedEvent);
      }
    }

    function getEyeVector(pointer) {
      var rect = domElement.getBoundingClientRect();
      var x = (pointer.clientX - rect.left) / rect.width;
      var y = (pointer.clientY - rect.top) / rect.height;
      var pointerVector = new Vector3(x * 2 - 1, -y * 2 + 1, 0.5);

      if (pointerVector.unproject) pointerVector.unproject(camera);
      else projector.unprojectVector(pointerVector, camera);
      return pointerVector.sub(camera.position).normalize();
    }

    function intersectObjects(pointer, objects, recursive) {
      ray.set(camera.position, getEyeVector(pointer));
      if (!objects) {
        console.log("err");
      }
      var intersections = ray.intersectObjects(objects, recursive);
      if (intersections.length > 0) {
        while (
          intersections.length > 0 &&
          ((intersections[0].object.dimensionGizmo &&
            intersections[0].object.dimensionGizmo.isVisible() === false) ||
            (!intersections[0].object.dimensionGizmo &&
              intersections[0].object.visible === false))
        ) {
          intersections.shift();
        }
      }
      return intersections[0] ? intersections[0] : false;
    }

    function snapToVertex(intersect, dimensionGizmo) {
      console.log("snap to face corner");
      if (
        intersect &&
        intersect.face &&
        intersect.object &&
        intersect.object.geometry
      ) {
        console.log("intersect", intersect);
        const positionAttribute = intersect.object.geometry.attributes.position;
        const lists = [intersect.face.a, intersect.face.b, intersect.face.c];
        var vertices = [];
        for (const elem of lists) {
          const vertex = new Vector3();
          vertex.fromBufferAttribute(positionAttribute, elem); // read vertex
          vertices.push(vertex);
        }
        console.log("vertices", vertices);
        camera.updateMatrixWorld();
        var maxSnapDistance =
          dimensionGizmo.getWidth(intersect.point, camera) * 4;
        //var maxSnapDistance = 0.5;

        console.log("snap distance", maxSnapDistance);

        //getting min distance to the points within maxSnapDistance
        var facePoint,
          distance,
          minDistance,
          minDistancePoint = null;
        for (var i = 0; i < 3; ++i) {
          facePoint = new Vector3().copy(vertices[i]);
          intersect.object.localToWorld(facePoint);

          distance = intersect.point.distanceTo(facePoint);
          // console.log("distance of intersect with facepoint", distance);

          if (
            distance <= maxSnapDistance &&
            (!minDistancePoint || distance < minDistance)
          ) {
            minDistance = distance;
            minDistancePoint = facePoint;
            // console.log("min distance point", minDistance);
          }
        }
        if (minDistancePoint) {
          //update intersect point
          //  intersect.point = minDistancePoint;
          console.log(
            "min distance point became intersect point",
            intersect.point
          );
          return { distance: minDistance, point: minDistancePoint };
          //  return true;
        }
      }
      // return false;
      return { distance: 1000, point: null };
    }

    function snapToMidPoint(intersect, dimensionGizmo) {
      console.log("snap to mid point");
      if (
        intersect &&
        intersect.face &&
        intersect.object &&
        intersect.object.geometry
      ) {
        console.log("intersect", intersect);
        // const positionAttribute = intersect.object.geometry.attributes.position;
        // const lists = [intersect.face.a, intersect.face.b, intersect.face.c]
        // var vertices = []
        // for (const elem of lists) {
        //     const vertex = new Vector3();
        //     vertex.fromBufferAttribute(positionAttribute, elem); // read vertex
        //     vertices.push(vertex)
        // }

        //getCornersfromVertices(intersect.object);

        const vertices = getGeometryEdgeMidpoints(intersect.object.geometry);

        console.log("mid points", vertices);
        camera.updateMatrixWorld();
        //var maxSnapDistance = dimensionGizmo.getWidth(intersect.point, camera) * 4;
        // var maxSnapDistance = 0.5;

        console.log("snap distance", maxSnapDistance);

        //getting min distance to the points within maxSnapDistance
        var facePoint,
          distance,
          minDistance,
          minDistancePoint = null;
        for (var i = 0; i < vertices.length; ++i) {
          facePoint = new Vector3().copy(vertices[i]);
          intersect.object.localToWorld(facePoint);

          distance = intersect.point.distanceTo(facePoint);
          // console.log("distance of intersect with midpoint", distance);

          if (
            distance <= maxSnapDistance &&
            (!minDistancePoint || distance < minDistance)
          ) {
            minDistance = distance;
            minDistancePoint = facePoint;
            // console.log("min distance point", minDistance);
          }
        }
        if (minDistancePoint) {
          //update intersect point
          //  intersect.point = minDistancePoint;
          console.log(
            "min distance point became intersect point",
            intersect.point
          );
          //  return true;
          return { distance: minDistance, point: minDistancePoint };
        }
      }
      // return false;
      return { distance: 1000, point: null };
    }
  }

  addGizmo(dimensionGizmo) {
    super.add(dimensionGizmo);
    this.dimensionGizmos.push(dimensionGizmo);
    dimensionGizmo.addEventListener("select", this.onGizmoTextSelected);
    dimensionGizmo.addEventListener("textMouseDown", this.onGizmoTextMouseDown);
    if (dimensionGizmo.acceptPoints())
      this.domElement.style.cursor = "crosshair";

    for (var i = 0; i < dimensionGizmo.pickers.children.length; ++i) {
      var picker = dimensionGizmo.pickers.children[i];
      this.pickers.push(picker);
    }

    this.update();
    this.dispatchEvent(this.sceneChangedEvent);
  }

  removeGizmo(dimensionGizmo) {
    for (var i = 0; i < dimensionGizmo.pickers.children.length; ++i) {
      var picker = dimensionGizmo.pickers.children[i];
      var index = this.pickers.indexOf(picker);
      if (index >= 0) this.pickers.splice(index, 1);
    }
    dimensionGizmo.removeEventListener("select", this.onGizmoTextSelected);
    dimensionGizmo.removeEventListener(
      "textMouseDown",
      this.onGizmoTextMouseDown
    );
    var index = this.dimensionGizmos.indexOf(dimensionGizmo);
    if (index >= 0) this.dimensionGizmos.splice(index, 1);
    dimensionGizmo.clean();
    super.remove(dimensionGizmo);
    this.update();
  }
}

export { DimensionControls };
