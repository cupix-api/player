class App {
    constructor(model, vc) {
        App._view_controller = vc;
        App._model = model
        App._custom_obj_manager = new CustomObjectManager(vc);
        App._obj_interaction = new ObjInteraction(vc);
        App._focused_box_object = null;
        App._transform_control = null;

        App._toast_visible = true;
        App._picking_options_visible = true;
    }

    static addDim() {
        App.printToConsole("Please select the first pano.")
        App._view_controller.commandMode = App._view_controller.measureStarted;
    }

    static addBox() {
        let alpha = App.getRandomNumber(0.8, 1.0);
        const box = new Box3D(
            App.getRandomNumber(0.5, 1.5),
            App.getRandomNumber(0.5, 1.5),
            App.getRandomNumber(0.5, 1.5),
            App.getRandomColor(), alpha);

        const group_center = new THREE.Vector3();
        App._view_controller.activeGroup.boundingBox.getCenter(group_center);

        const range = 1.0;
        group_center.x += App.getRandomNumber(-range, range);
        group_center.y += App.getRandomNumber(-range, range);
        group_center.z += App.getRandomNumber(-range, range);


        box.locate(group_center.x, group_center.y, group_center.z);

        App._custom_obj_manager.add(box);
        App._obj_interaction.addObject(box.sceneObject);
        App._view_controller.render();
    }

    static addPushpin(title, desc, show_leg, auto_anchor) {
        let alpha = App.getRandomNumber(0.8, 1.0);
        const pushpin = new Pushpin(title, desc, show_leg, auto_anchor, App.getRandomColor(), alpha);
        const group_center = new THREE.Vector3();
        App._view_controller.activeGroup.boundingBox.getCenter(group_center);
        pushpin.locate(group_center.x, group_center.y, group_center.z);

        App._custom_obj_manager.add(pushpin);
        App._obj_interaction.addObject(pushpin.sceneObject);
        App._view_controller.render();
    }

    static toggleToastMessageVisibility() {
        const event_to_send = App.createEventToPlayer("UIManager", "ConfigToastMessage")

        event_to_send.args = {
            visible: !this._toast_visible
        }
        App.emitEventToPlayer(event_to_send);
        this._toast_visible = !this._toast_visible;
    }

    static togglePickingOptionVisibility() {
        const event_to_send = App.createEventToPlayer("UIManager", "ConfigPickingOption")

        event_to_send.args = {
            visible: !this._picking_options_visible
        }
        App.emitEventToPlayer(event_to_send);
        this._picking_options_visible = !this._picking_options_visible;
    }

    static measureDim(mode) {
        const event_to_send = App.createEventToPlayer("UIManager", "Measure")

        event_to_send.args = {
            mode: mode,
            snap_on_dim: true,
            axis_aligned: true
        }
        App.emitEventToPlayer(event_to_send);
    }

    static pickPoint(mode) {
        const event_to_send = App.createEventToPlayer("UIManager", "PickPoint")

        event_to_send.args = {
            mode: mode
        }
        App.emitEventToPlayer(event_to_send);
    }

    static getCamera() {
        const event_to_send = App.createEventToPlayer("Camera", "GetCurrentCamera")

        event_to_send.args = {
        }
        App.emitEventToPlayer(event_to_send);
    }

    static getAllModels() {
        const event_to_send = App.createEventToPlayer("ObjectHandler", "GetAllModels")

        event_to_send.args = {
        }
        App.emitEventToPlayer(event_to_send);

        const mgr = this._custom_obj_manager && this._custom_obj_manager._name_table;
        if (mgr) {
            let box;
            Object.keys(mgr).forEach(key => {
                if (box == undefined) {
                    model = mgr[key];
                    if (model instanceof Box3D) {
                        box = model;
                    }
                }
            });

            if (box) {
                const event_to_send = App.createEventToPlayer("ObjectHandler", "GetModel")

                event_to_send.args = {
                    id: box._cupixID
                }
                App.emitEventToPlayer(event_to_send);
            }
        }
    }

    static setViewpoint(viewpoint) {
        this._viewpoint = viewpoint;
    }

    static saveViewpoint() {
        const event_to_send = App.createEventToPlayer("TransitHandler", "GetCurrentViewpoint")

        event_to_send.args = {
        }
        App.emitEventToPlayer(event_to_send);
    }

    static loadViewpoint() {
        if (this._viewpoint == undefined) return;
        const event_to_send = App.createEventToPlayer("TransitHandler", "ChangeViewpoint")

        event_to_send.args = {
            viewpoint: this._viewpoint
        }
        App.emitEventToPlayer(event_to_send);
    }

    static cancelCommand() {
        const event_to_send = App.createEventToPlayer("UIManager", "Cancel")
        App.emitEventToPlayer(event_to_send);
    }

    static changeGroup(index) {
        App.viewController.activeGroupIndex = index;

        const event_to_send = App.createEventToPlayer("TransitHandler", "ChangeGroup")

        event_to_send.args = {
            id: App.viewController.activeGroup.cupixID
        }
        App.emitEventToPlayer(event_to_send);
    }

    static searchCustomObj(keyword) {
        if (this._custom_obj_manager)
            return this._custom_obj_manager.search(keyword);
        return null;
    }

    static makeLineObject(start, end, mat, startArrow = false, endArrow = false) {
        let geom = new THREE.BufferGeometry();
        let ends = [start.x, start.y, start.z, end.x, end.y, end.z];
        geom.addAttribute('position', new THREE.Float32BufferAttribute(ends, 3));
        let line = new THREE.LineSegments(geom, mat);
        line.computeLineDistances();

        if (!(startArrow || endArrow)) return line;

        let length = 0.1;
        let headLength = length;
        let headWidth = headLength * 0.5;

        var dir = end.clone().sub(start);
        dir.normalize();
        var rev_dir = dir.clone().negate();

        if (startArrow)
            line.add(new THREE.ArrowHelper(rev_dir, start.add(dir.clone().multiplyScalar(length)), length, mat.color, headLength, headWidth));

        if (endArrow)
            line.add(new THREE.ArrowHelper(dir, end.add(rev_dir.clone().multiplyScalar(length)), length, mat.color, headLength, headWidth));

        return line;
    }

    static clearThree(obj) {
        while (obj.children.length > 0) {
            App.clearThree(obj.children[0])
            obj.remove(obj.children[0]);
        }
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
        if (obj.texture) obj.texture.dispose()
    }

    static assignVec2Vec3D(a, b) {
        a.set(b.x, b.y, b.z);
    }

    static assignVec2Vec2D(a, b) {
        a.x = b.x;
        a.y = b.y;
    }

    static assignArray2Vec3D(a, b) {
        a.set(b[0], b[1], b[2]);
    }

    static assignVec2Array3D(a, b) {
        a[0] = b.x;
        a[1] = b.y;
        a[2] = b.z;
    }

    static getRandomColor() {
        return Math.random() * 0xffffff;
    }

    static getRandomNumber(start, end) {
        // return Math.floor(Math.random() * end) + start
        return Math.min(start, end) + (Math.abs(start - end) * Math.random());
    }

    static getRandomString(n) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < n; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    static emitEventToPlayer(e) {
        App.iframe[0].contentWindow.postMessage(e, "*");
    }

    static createEventToPlayer(s, t) {
        var e = {}
        e.sender = s;
        e.type = t;
        e.ver = "2";
        e.caller = "iframe demo";

        return e;
    }

    static printNAMessage() {
        App.printToConsole("Not Implemented");
    }

    static printToConsole(msg) {
        App.rightConsole.innerHTML += "<span class='prefix'>></span> " + msg + App.CR;
        App.rightConsoleWrapper.scrollTop(1e10);    // scroll to top very large number
    }

    static clearAll() {
        $(".dropdown-menu#setion-list .dropdown-item").remove();
        App.rightConsole.innerHTML = "";

        if (App._model != null)
            App._model.clear();
        App._model = null;

        if (App._view_controller != null)
            App._view_controller.clear();

        App._view_controller = null;
        App._custom_obj_manager = null;
        App._obj_interaction = null;
    }

    static removeFocusedObj() {
        let removed = App._obj_interaction.removeFocused();
        if (removed != null) {
            App.printToConsole(removed.name + " is removed.");
            App._custom_obj_manager.remove(removed);
            App._view_controller.render();
        } else {
            App.printToConsole("No object is selected or active.");
            return;
        }
    }

    static openURL(url) {
        App.clearAll();
        App.iframe.attr('src', url);
    }

    static toggleCamera() {
        App._view_controller.toggleCamera();
    }

    static get viewController() {
        return App._view_controller;
    }

    static get leftConsole() {
        return $("#txt-console-left")[0];
    }

    static get rightConsole() {
        return $("#txt-console-right")[0];
    }

    static get rightConsoleWrapper() {
        return $("#txt-console-right-wrapper");
    }

    static get iframe() {
        return $("#embedded-player");
    }

    static get playerContainer() {
        return $('#external-3Dviewer-container')[0]
    }

    static get CR() {
        return '\r\n';
    }

    static get sectionDivPrefix() {
        return "section-";
    }
}

class ObjInteraction {
    constructor(vc) {
        this._vc = vc;
        this._transform_control = new THREE.TransformControls(vc.activeCamera, vc.renderer.domElement);
        this._transform_control.addEventListener('change', vc.render);

        this._transform_control.addEventListener('dragging-changed', event => {
            vc.controls.enabled = !event.value;
        });

        vc.activeGroup.add(this._transform_control);

        // Hiding transform situation is a little in a mess :()
        this._transform_control.addEventListener('change', () => {
            this.cancelHideTransform();
        });

        this._transform_control.addEventListener('mouseDown', event => {
            this.cancelHideTransform();
        });
        this._transform_control.addEventListener('mouseUp', event => {
            this.delayHideTransform();
        });
        this._transform_control.addEventListener('objectChange', event => {
            if (this._focused_box == null) return;

            this._focused_box.updatePlayer();
            this._vc.controls.enabled = false;
        });

        this._drag_controls = new THREE.DragControls([],
            vc.activeCamera, vc.renderer.domElement);

        this._drag_controls.enabled = false;

        this._drag_controls.addEventListener('hoveron', event => {
            this._transform_control.attach(event.object);
            if (event.object.wrapper != null)
                this._focused_box = event.object.wrapper;
            this.cancelHideTransform();
        });

        this._drag_controls.addEventListener('hoveroff', () => {
            this.delayHideTransform();
        });
    }

    addObject(obj) {
        this._drag_controls.addObject(obj);
    }

    delayHideTransform() {
        this.cancelHideTransform();
        this.hideTransform();
    }

    hideTransform() {
        this._hiding = setTimeout(() => {
            this._focused_box = null;
            this._transform_control.detach(this._transform_control.object);
        }, 1500);
    }

    cancelHideTransform() {
        if (this._hiding) clearTimeout(this._hiding);
    }

    removeFocused() {
        if (this._focused_box == null)
            return null;

        if (this._transform_control != null)
            this._transform_control.detach(this._focused_box.sceneObject);

        this._drag_controls.removeObject(this._focused_box.sceneObject);

        return this._focused_box;
    }
}