class SceneViewController {
    constructor(tour_model, div_container) {
        this._tour_model = tour_model;
        this._scene = this._tour_model.scene;
        this._container = div_container;
        this._handled_object_hash_table = {};

        this._active_group_index = 0;
        this.initGroups();

        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(div_container.clientWidth, div_container.clientHeight);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Enable key up/down event in the canvas
        this._renderer.domElement.tabIndex = 1;

        this.activeCamera = this.activeGroup.camera;
        var controls = new THREE.TrackballControls(this.activeCamera, div_container);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 83, 68];
        this._controls = controls;
        this._controls.addEventListener('change', this.render);

        // Pano-Camera: A camera attachable to a pano. There is just one pano-camera.
        // Pano-Camera uses the global coordiante system.
        this._pano_camera = new THREE.PerspectiveCamera(60, div_container.clientWidth / div_container.clientHeight, 0.1, 1.0);
        this._pano_camera_helper = new THREE.CameraHelper(this._pano_camera);
        this._pano_camera.add(new THREE.PointLight(0x999999));

        var first_person = new THREE.OrbitControls(this._pano_camera, div_container);
        first_person.enabled = false;
        this._first_person_controls = first_person;

        this._scene.add(this._pano_camera);
        this._scene.add(this._pano_camera_helper);

        div_container.appendChild(this._renderer.domElement);
        this._renderer.autoClear = false;
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this._ray_caster = new THREE.Raycaster();
        this._mouse_pos = new THREE.Vector2();

        // Mouse event handling
        this.default = 0
        this.measureStarted = 1;
        this.measurePickcedFirst = 2;

        this._command_mode = this.default;

        this._renderer.domElement.addEventListener('mousemove', event => {
            event.preventDefault();
            this._mouse_pos.x = (event.offsetX / this._renderer.domElement.width) * 2 - 1;
            this._mouse_pos.y = - (event.offsetY / this._renderer.domElement.height) * 2 + 1;

            this.checkMouseOnPano();
        }, false);

        this._renderer.domElement.addEventListener('mousedown', event => {
            var event_to_send;

            if (this._pano_on_mouse) {
                App.printToConsole(this._pano_on_mouse.name + " is selected.");

                switch (this._command_mode) {
                    case this.measureStarted:
                        this._pano_picked = this._pano_on_mouse;
                        this._command_mode = this.measurePickedFirst;
                        App.printToConsole("Select one more pano.");
                        break;
                    case this.measurePickedFirst:
                        if (this._pano_picked == this._pano_on_mouse) {
                            App.printToConsole("Two panos are the same. Select a different pano.");
                            return;
                        }
                        let col = App.getRandomColor();
                        var start = [0, 0, 0];
                        var end = [0, 0, 0];
                        App.assignVec2Array3D(start, this._pano_picked.position);
                        App.assignVec2Array3D(end, this._pano_on_mouse.position);
                        this.scene.add(App.makeLineObject(
                            this._pano_picked.position.clone(),
                            this._pano_on_mouse.position.clone(),
                            new THREE.LineBasicMaterial({ color: col }),
                            true, true));

                        this.render();

                        event_to_send = App.createEventToPlayer("ObjectHandler", "AddDimension")
                        event_to_send.args = {
                            name: this._pano_on_mouse.name + "-" + this._pano_picked.name,
                            geom: {
                                start: start,
                                end: end
                            }
                        }
                        App.emitEventToPlayer(event_to_send);

                        let dx = Math.abs(start[0] - end[0]).toPrecision(3);
                        let dy = Math.abs(start[1] - end[1]).toPrecision(3);
                        let dz = Math.abs(start[2] - end[2]).toPrecision(3);
                        let dd = Math.sqrt(dx * dx + dy * dy + dz * dz).toPrecision(3);
                        App.printToConsole("Distane is: " + dd + " (" + dx + ", " + dy + ", " + dz + ")");
                        this._pano_picked = null;
                        this._command_mode = this.default;
                        break;
                    default:
                        this._pano_picked = null;
                        event_to_send = App.createEventToPlayer("TransitHandler", "ChangePano")
                        event_to_send.args = {
                            id: this._pano_on_mouse.cupixID,
                            name: this._pano_on_mouse.name
                        }
                        App.emitEventToPlayer(event_to_send);
                }
            }
        }, false);
    }

    render() {
        if (this.renderer)
            this.renderer.render(this.scene, this.activeCamera);

        if (this.controls)
            this.controls.update();
    }

    onWindowResize() {
        this.activeCamera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.activeCamera.updateProjectionMatrix();

        if (this.renderer)
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        this.controls.handleResize();
        this.render();
    }

    highlightObject(obj) {
        obj.material.emissive.setHex(0x333333);
    }

    deHighlightObject(obj) {
        obj.material.emissive.setHex(0);
    }

    checkMouseOnPano() {
        let cam = this.activeCamera;
        cam.updateMatrixWorld();
        this._ray_caster.setFromCamera(this._mouse_pos, cam);
        var intersects = this._ray_caster.intersectObjects(this.activeGroup.children, true);
        var found = false;
        for (var i = 0; i < intersects.length; ++i) {
            if (intersects[i].object.type != undefined && intersects[i].object.type == "pano") {
                if (this._pano_on_mouse != intersects[i].object) {
                    this._pano_on_mouse = intersects[i].object;
                    this.highlightObject(this._pano_on_mouse);
                }
                $('canvas').css('cursor', 'pointer');
                found = true;
                break;
            }
        }
        if (!found) {
            if (this._pano_on_mouse)
                this.deHighlightObject(this._pano_on_mouse)
            this._pano_on_mouse = null;
            $('canvas').css('cursor', 'default');
        }

        this.render();
    }

    handleObjectEventsFromPlayer(event_type, event_args) {
        var customObj = App.searchCustomObj(event_args.name);

        switch (event_type) {
            case "Selected":
                if (event_args.type == "Dimension" && this._handled_object_hash_table[event_args.id] == undefined) {
                    let col = 0x00ff00;
                    const start = event_args.geom.start;
                    const end = event_args.geom.end;
                    this.scene.add(App.makeLineObject(
                        new THREE.Vector3(start[0], start[1], start[2]),
                        new THREE.Vector3(end[0], end[1], end[2]),
                        new THREE.LineBasicMaterial({ color: col }),
                        true, true));

                    this._handled_object_hash_table[event_args.id] = true;
                    this.render();
                }
                break;
            case "Focused":
                if (customObj != null) {
                    this.highlightObject(customObj.sceneObject);
                    this.render();
                }
                break;
            case "Blurred":
                if (customObj != null) {
                    this.deHighlightObject(customObj.sceneObject);
                    this.render();
                }
                break;
            case "Added":
                // Object was created from parent
                // Set the id generated in the player 
                if (customObj != null)
                    customObj.cupixID = event_args.id;
                break;
            default: break;
        }
    }

    clear() {
        $(this._renderer.domElement).remove();
        window.removeEventListener('resize', this.onWindowResize);
        App.clearThree(this._scene);
        this._renderer = null;
        this._scene = null;
    }

    initGroups() {
        for (let i = 0; i < this._tour_model._section_groups.length; ++i) {
            const section_group = this._tour_model._section_groups[i];
            var section_dropdown = $(".dropdown-menu#setion-list");
            let sectino_div_id = App.sectionDivPrefix + i;
            section_dropdown.append("<a class='dropdown-item' id='" + sectino_div_id + "' href='#'>" + section_group.name + "</a>");
            if (i == 0) {
                $("#txt-active-section").val(section_group.name);
            } else {
                section_group.visible = false;
            }
        }
    }

    toggleCamera() {
        if (this.activeCamera == this._pano_camera) {
            this.activeCamera = this.activeGroup.camera;
            this._pano_camera.far = 1.0;
            this._pano_camera_helper.visible = true;
            this.activeGroup.axesHelper.visible = true;

            this.controls.enabled = true;
            this.panoControls.enabled = false;
        } else {
            this.activeCamera = this._pano_camera;
            this._pano_camera.far = 100.0;
            this._pano_camera_helper.visible = false;
            this.activeGroup.axesHelper.visible = false;

            this.controls.enabled = false;

            // TODO: not working
            //this.panoControls.enabled = true;
        }

        this.render();
    }

    updatePanoCameraHelper() {
        this._pano_camera.updateProjectionMatrix();
        this._pano_camera_helper.update();

        this.render();
    }

    updatePanoCamera(player_pano_camera) {
        //
        // player_pano_camera is in the global cooridnate sytem
        //
        // No need to update player_pano_camera.pos 
        // (currently pano-cam is attached to the ativePano)
        // assignArray2Vec3D(this._pano_camera.position, player_pano_camera.pos);

        App.assignArray2Vec3D(this._pano_camera.up, player_pano_camera.up);
        this._pano_camera.lookAt(
            player_pano_camera.pos[0] + player_pano_camera.lookat[0],
            player_pano_camera.pos[1] + player_pano_camera.lookat[1],
            player_pano_camera.pos[2] + player_pano_camera.lookat[2]);

        this._pano_camera.fov = player_pano_camera.fov;
        this.updatePanoCameraHelper();
    }

    get activeGroup() {
        return this._tour_model._section_groups[this._active_group_index];
    }

    set activeGroup(id) {
        for (let i = 0; i < this._tour_model._section_groups.length; ++i) {
            if (this._tour_model._section_groups[i].cupixID == id) {
                this.activeGroupIndex = i;
                break;
            }
        }
    }

    get activeGroupIndex() {
        return this._active_group_index;
    }

    set activeGroupIndex(i) {
        if (i == NaN || i < 0 || i > this._tour_model._section_groups.length) return;
        if (this._active_group_index == i) return;

        this.activeGroup.visible = false;

        this._active_group_index = i;
        let group = this._tour_model._section_groups[i];
        group.visible = true;

        this.activeCamera = group.camera;

        this.controls.object = this.activeCamera;
        this.controls.enabled = true;
        this.panoControls.enabled = false;

        this.render();
    }

    get activeCamera() {
        return this._active_camera;
    }

    set activeCamera(c) {
        c.aspect = this._container.clientWidth / this._container.clientHeight;
        this._active_camera = c;
    }

    get activePano() {
        return this._active_pano;
    }

    set activePano(pano_id) {
        this._active_pano = this._tour_model._pano_hash_table[pano_id];
        App.assignVec2Vec3D(this._pano_camera.position, this._active_pano.position);
        this.updatePanoCameraHelper();
    }

    get scene() {
        return this._scene;
    }

    get renderer() {
        return this._renderer;
    }

    get controls() {
        return this._controls;
    }

    get panoControls() {
        return this._first_person_controls;
    }

    get container() {
        return this._container;
    }

    get commandMode() {
        return this._command_mode;
    }

    set commandMode(m) {
        this._command_mode = m
    }
}
