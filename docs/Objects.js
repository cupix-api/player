class TourModel {
    constructor(tour_structure) {
        //
        // Use Three's scene graph as the tour structure
        //
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x000000);

        this._section_hash_table = {};
        this._pano_hash_table = {};
        this._section_groups = [];

        this.build(tour_structure);
    }

    build(tour_structure) {
        // Note that the length unit of the player data is meter.
        for (var i = 0; i < tour_structure.groups.length; ++i) {
            const _group = tour_structure.groups[i];

            // Create a scene graph group node for the section
            var section_group = new THREE.Group();

            // Set the cross reference
            this._section_hash_table[_group.id] = section_group;
            section_group.cupixID = _group.id;
            section_group.name = _group.name;
            section_group.type = "group";
            const group_bounding_box = new THREE.Box3();

            // Lowest elevation among sections
            var group_elevation = Number.MAX_VALUE;

            for (var j = 0; j < _group.sections.length; ++j) {
                const section_bounding_box = new THREE.Box3();
                const pano_container = new THREE.Group();
                const _section = _group.sections[j];

                group_elevation = Math.min(group_elevation, _section.elevation);

                for (var k = 0; k < _section.panos.length; ++k) {
                    const _pano = _section.panos[k];

                    // Add spheres at the centers of panos with random colors
                    let col = App.getRandomColor();
                    const pano_sphere = new THREE.Mesh(
                        // Sphere radius is 0.1 meter.
                        new THREE.SphereBufferGeometry(0.1, 16, 8),
                        new THREE.MeshPhongMaterial({ color: col, wireframe: false })
                    );
                    pano_sphere.castShadow = true;
                    let pos = new THREE.Vector3(_pano.pos[0], _pano.pos[1], _pano.pos[2]);
                    App.assignVec2Vec3D(pano_sphere.position, pos)
                    pano_container.add(pano_sphere);
                    pano_container.add(App.makeLineObject(
                        pos, new THREE.Vector3(pos.x, pos.y, 0.0),
                        new THREE.LineDashedMaterial({ color: col, dashSize: 0.2, gapSize: 0.05 })
                    ));
                    pano_sphere.type = "pano";

                    section_bounding_box.expandByPoint(pos);

                    // Set the cross reference
                    this._pano_hash_table[_pano.id] = pano_sphere;
                    pano_sphere.cupixID = _pano.id;
                    pano_sphere.name = _pano.name;
                }
                group_bounding_box.expandByPoint(section_bounding_box.min);
                group_bounding_box.expandByPoint(section_bounding_box.max);
                pano_container.type = "section";
                section_group.add(pano_container);
            }

            // Custom properties
            section_group.boundingBox = group_bounding_box;
            section_group.elevation = group_elevation;

            this.addSectionCamera(section_group);
            this.addFloor(section_group);
            this.addSectionLights(section_group);
            this.addAxesHelper(section_group);

            this._scene.add(section_group);
            this._section_groups.push(section_group);
        }
    }

    addSectionCamera(section_group) {
        const camera = new THREE.PerspectiveCamera(50, 1, 1, 100);
        App.assignVec2Vec3D(camera.position, section_group.boundingBox.max);
        camera.position.z += 2; // 2 meter above
        camera.up.set(0, 0, 1);
        const center = new THREE.Vector3();
        section_group.boundingBox.getCenter(center);
        camera.lookAt(center)

        const camera_light = new THREE.PointLight(0x999999);
        camera.add(camera_light);

        section_group.camera = camera;
        section_group.add(camera);
    }

    addSectionLights(section_group) {
        const ambient_light = new THREE.AmbientLight(0x222222);
        section_group.add(ambient_light);

        const directional_light = new THREE.DirectionalLight(0x999999);
        directional_light.castShadow = true;
        directional_light.position.set(0, 0, 10);   // directional light from the sky
        section_group.add(directional_light);
    }

    // Draw a floor at section coordinate system z=0
    addFloor(section_group) {
        let floor_size_margin = 1.2;
        let volume = new THREE.Vector3();
        section_group.boundingBox.getSize(volume);
        let floor_size = Math.max(volume.x, volume.y) * floor_size_margin;
        var floor_mat = new THREE.MeshPhongMaterial({ color: 0x808080, dithering: true });
        var floor_geom = new THREE.PlaneBufferGeometry(floor_size, floor_size);
        var floor_mesh = new THREE.Mesh(floor_geom, floor_mat);
        floor_mesh.rotation.z = - Math.PI * 0.5;
        const trans_vec = new THREE.Vector3();;
        section_group.boundingBox.getCenter(trans_vec);
        trans_vec.z = section_group.elevation;

        App.assignVec2Vec3D(floor_mesh.position, trans_vec);
        floor_mesh.receiveShadow = true;

        section_group.add(floor_mesh);

        var grid = new THREE.GridHelper(floor_size, Math.floor(floor_size));    // grid size = 1 m
        grid.rotation.x = - Math.PI * 0.5;
        App.assignVec2Vec3D(grid.position, trans_vec)
        section_group.add(grid);
    }

    addAxesHelper(section_group) {
        const axes_helper = new THREE.AxesHelper(1);
        const center = new THREE.Vector3();
        section_group.boundingBox.getCenter(center)
        App.assignVec2Vec2D(axes_helper.position, center);

        section_group.axesHelper = axes_helper;
        section_group.add(axes_helper);
    }

    clear() {
    }

    get scene() {
        return this._scene;
    }
}

class CustomObj {
    constructor(color, opacity = 1.0) {
        this._color = color;
        this._opacity = opacity;

        this._object = null;    // Three.js object
    }

    // virtual methods
    makePlayerAddEvent() {
        return {};
    }

    locate(x, y, z) {
        if (this._object)
            this._object.position.set(x, y, z);
    }

    get x() { return (this._object ? this._object.position.x : 0.0) };
    get y() { return (this._object ? this._object.position.y : 0.0) };
    get z() { return (this._object ? this._object.position.z : 0.0) };

    get color() { return this._color };
    get opacity() { return this._opacity };

    get sceneObject() {
        return this._object;
    }

    set sceneObject(o) {
        this._object = o;
    }

    set cupixID(id) {
        this._cupixID = id;
        this._object.cupixID = id;
    }

    get cupixID() {
        return this._cupixID;
    }

    set name(n) {
        this._name = n;
    }

    get name() {
        return this._name;
    }
}

class Box3D extends CustomObj {
    constructor(width, height, depth, color, opacity = 1.0) {
        super(color, opacity);
        this._width = width;
        this._height = height;
        this._depth = depth;
        const geometry = new THREE.BoxBufferGeometry(width, height, depth);
        this._object = new THREE.Mesh(geometry,
            new THREE.MeshLambertMaterial(
                {
                    color: color,
                    transparent: true,
                    opacity: opacity
                }
            ));
        this._object.wrapper = this;
    }

    makePlayerAddEvent() {
        const event = App.createEventToPlayer("ObjectHandler", "AddBox");
        event.args = {
            name: this.name,
            color: this.color,
            opacity: this.opacity,
            geom: {
                pos: [this.x, this.y, this.z],
                quat: [1, 0, 0, 0],
                size: [this.width, this.height, this.depth]
            }
        }
        return event;
    }

    updatePlayer() {
        const event_to_send = App.createEventToPlayer("ObjectHandler", "Change")
        event_to_send.args = {
            name: this.name,
            id: this.cupixID,
            geom: {
                pos: [this.x, this.y, this.z],
                quate: [1, 0, 0, 0],
                size: [this.width, this.height, this.depth]
            }
        }
        App.emitEventToPlayer(event_to_send);
    }

    get width() { return this._width };
    get height() { return this._height };
    get depth() { return this._depth };
}

class Pushpin extends CustomObj {
    constructor(title, desc, show_leg, auto_anchor, color, opacity = 1.0) {
        super(color, opacity);
        this._title = title;
        this._desc = desc;
        this._show_leg = show_leg;
        this._auto_anchor = auto_anchor;
        this._color = color;
        this._opacity = opacity;
        let dim = 0.2;
        const geometry = new THREE.TorusBufferGeometry(dim, dim / 3, 16, 100);
        this._object = new THREE.Mesh(geometry,
            new THREE.MeshLambertMaterial(
                {
                    color: color,
                    transparent: true,
                    opacity: opacity
                }
            ));
        this._object.rotation.x = - Math.PI * 0.5;
        this._object.wrapper = this;
    }

    makePlayerAddEvent() {
        const event = App.createEventToPlayer("ObjectHandler", "AddPushPin")
        event.args = {
            name: this.name,
            color: this.color,
            opacity: this.opacity,
            geom: {
                pos: [this.x, this.y, this.z],
                anchor: [this.x, this.y, 0.0],
                anchor_norm: [0.0, 0.0, 1.0],
                show_leg: this._show_leg,
                auto_anchor: this._auto_anchor,
                title: this._title,
                content: this._desc
            }
        }
        return event;
    }

    updatePlayer() {
        const event_to_send = App.createEventToPlayer("ObjectHandler", "Change")
        event_to_send.args = {
            name: this.name,
            id: this.cupixID,
            geom: {
                pos: [this.x, this.y, this.z],
                anchor: [this.x, this.y, 0.0],
                anchor_norm: [0.0, 0.0, 1.0],
                show_leg: this._show_leg,
                auto_anchor: this._auto_anchor,
                title: this._title,
                content: this._desc
            }
        }
        App.emitEventToPlayer(event_to_send);
    }
}

class CustomObjectManager {
    constructor(vc) {
        this._name_table = {};
        this._view_controller = vc;
    }

    add(obj) {
        let name = App.getRandomString(6);    // 6 letter random string
        this._name_table[name] = obj;
        obj.name = name;

        if (obj.sceneObject)
            this._view_controller.activeGroup.add(obj.sceneObject);

        this.addToPlayer(obj);
        return name;
    }

    addToPlayer(obj) {
        App.emitEventToPlayer(obj.makePlayerAddEvent());
    }

    remove(obj) {
        this.removeFromPlayer(obj.cupixID);
        let so = obj.sceneObject;
        if (so) {
            if (so.parent)
                so.parent.remove(so);
            else
                this._view_controller.scene.remove(so);

            so.geometry.dispose();
            so.material.dispose();
            obj.sceneObject = null;
        }
    }

    removeFromPlayer(id) {
        const event_to_send = App.createEventToPlayer("ObjectHandler", "Delete");
        event_to_send.args = {
            id: id
        }
        App.emitEventToPlayer(event_to_send);
    }

    search(name) {
        return this._name_table[name];
    }
}
