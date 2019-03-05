$(document).ready(function() {
    if ( WEBGL.isWebGLAvailable() === false ) {
        document.body.appendChild( WEBGL.getWebGLErrorMessage() );
        return;
    }

    let CR = '\r\n';
    let iframePlayer = $("#embedded-player");
    let container = $('#external-3Dviewer-container')[0];
    let leftConsoleWindow = $("#txt-console-left")[0];
    let rightConsoleWrapper = $("#txt-console-right-wrapper");
    let rightConsoleWindow = $("#txt-console-right")[0];       
    let sectionDivPrefix = "section-";

    var model = null;
    var viewController = null;
    var customObjManager = null;
    var boxDragInteraction = null;

    class TourModel{
        constructor(tour_structure){
            //
            // Use Three's scene graph as the tour structure
            //
            this._scene = new THREE.Scene();
            this._scene.background = new THREE.Color( 0x000000 );

            this._section_hash_table = {};
            this._pano_hash_table = {};
            this._section_groups = [];
            
            this.build(tour_structure);
        }

        build(tour_structure){
            // Note that the length unit of the player data is meter.
            for(var i=0;i<tour_structure.groups.length;++i){
                const _group = tour_structure.groups[i];
                
                // Create a scene graph group node for the section
                var section_group = new THREE.Group();
    
                // Set the cross reference
                this._section_hash_table[_group.id] = section_group;
                section_group.cupixID = _group.id;
                section_group.name = _group.name;
                const group_bounding_box = new THREE.Box3();

                // Lowest elevation among sections
                var group_elevation = Number.MAX_VALUE;
                
                for(var j=0;j<_group.sections.length;++j){
                    const section_bounding_box = new THREE.Box3();
                    const pano_container = new THREE.Group();
                    const _section = _group.sections[j];

                    group_elevation = Math.min(group_elevation, _section.elevation);
                    
                    for(var k=0;k<_section.panos.length;++k){
                        const _pano = _section.panos[k];
                        
                        // Add spheres at the centers of panos with random colors
                        let col = getRandomColor();
                        const pano_sphere = new THREE.Mesh(
                            // Sphere radius is 0.1 meter.
                            new THREE.SphereBufferGeometry( 0.1, 16, 8 ),
                            new THREE.MeshPhongMaterial( { color: col, wireframe: false } )
                        );
                        pano_sphere.castShadow = true;
                        let pos = new THREE.Vector3(_pano.pos[0],_pano.pos[1],_pano.pos[2]);
                        assignVec2Vec3D(pano_sphere.position, pos)
                        pano_container.add(pano_sphere);
                        pano_container.add(makeLineObject(
                            pos, new THREE.Vector3(pos.x, pos.y, 0.0), 
                            new THREE.LineDashedMaterial( { color: col, dashSize: 0.2, gapSize: 0.05 } )
                        ));
                        
                        section_bounding_box.expandByPoint(pos);
        
                        // Set the cross reference
                        this._pano_hash_table[ _pano.id ] = pano_sphere;
                        pano_sphere.cupixID = _pano.id;
                        pano_sphere.name = _pano.name;
                    }
                    group_bounding_box.expandByPoint (section_bounding_box.min);
                    group_bounding_box.expandByPoint (section_bounding_box.max);

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

        addSectionCamera(section_group){
            const camera = new THREE.PerspectiveCamera( 50, 1, 1, 100 );
            assignVec2Vec3D(camera.position, section_group.boundingBox.max);
            camera.position.z += 2; // 2 meter above
            camera.up.set(0,0,1);
            const center = new THREE.Vector3();
            section_group.boundingBox.getCenter(center);
            camera.lookAt(center)
            
            const camera_light = new THREE.PointLight( 0x999999 );
            camera.add(camera_light);
    
            section_group.camera = camera;
            section_group.add( camera );
        }

        addSectionLights(section_group){
            const ambient_light = new THREE.AmbientLight( 0x222222 );
            section_group.add( ambient_light );
    
            const directional_light = new THREE.DirectionalLight( 0x999999 );
            directional_light.castShadow = true;
            directional_light.position.set(0,0,10);   // directional light from the sky
            section_group.add( directional_light );
        }
    
        // Draw a floor at section coordinate system z=0
        addFloor(section_group){
            let floor_size_margin = 1.2;  
            let volume = new THREE.Vector3();
            section_group.boundingBox.getSize(volume);
            let floor_size = Math.max(volume.x, volume.y) * floor_size_margin;
            var floor_mat = new THREE.MeshPhongMaterial( { color: 0x808080, dithering: true } );
            var floor_geom = new THREE.PlaneBufferGeometry( floor_size , floor_size );
            var floor_mesh = new THREE.Mesh( floor_geom, floor_mat );
            floor_mesh.rotation.z = - Math.PI * 0.5;
            const trans_vec =  new THREE.Vector3(); ;
            section_group.boundingBox.getCenter(trans_vec);
            trans_vec.z = section_group.elevation;
            
            assignVec2Vec3D(floor_mesh.position, trans_vec);
            floor_mesh.receiveShadow = true;
            
            section_group.add( floor_mesh );
            
            var grid = new THREE.GridHelper(floor_size, Math.floor(floor_size));    // grid size = 1 m
            grid.rotation.x = - Math.PI * 0.5;
            assignVec2Vec3D(grid.position, trans_vec)
            section_group.add(grid);
        }
    
        addAxesHelper(section_group){
            const axes_helper = new THREE.AxesHelper(1);
            const center =  new THREE.Vector3();
            section_group.boundingBox.getCenter(center)
            assignVec2Vec2D(axes_helper.position, center);
            
            section_group.axesHelper = axes_helper;
            section_group.add(axes_helper);
        }

        clear(){
        }

        get scene(){
            return this._scene;
        }
    }

    class SceneViewController{
        constructor(tour_model, div_container){
            this._tour_model = tour_model;
            this._scene = this._tour_model.scene;
            this._container = div_container;
            this._handled_object_hash_table = {};

            this._active_group_index = 0;
            this.initGroups();
            
            this._renderer = new THREE.WebGLRenderer( { antialias: true } );
            this._renderer.setPixelRatio( window.devicePixelRatio );
            this._renderer.setSize( div_container.clientWidth, div_container.clientHeight );
            this._renderer.shadowMap.enabled = true;
            this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Enable key up/down event in the canvas
            this._renderer.domElement.tabIndex = 1;

            this.activeCamera = this.activeGroup.camera;
            var controls = new THREE.TrackballControls( this.activeCamera, div_container);
            controls.rotateSpeed = 1.0;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
            controls.noZoom = false;
            controls.noPan = false;
            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.3;
            controls.keys = [ 65, 83, 68 ];
            this._controls = controls;
            this._controls.addEventListener( 'change', this.render );

            // Pano-Camera: A camera attachable to a pano. There is just one pano-camera.
            // Pano-Camera uses the global coordiante system.
            this._pano_camera = new THREE.PerspectiveCamera( 60, div_container.clientWidth / div_container.clientHeight, 0.1, 1.0 );
            this._pano_camera_helper = new THREE.CameraHelper( this._pano_camera );
            this._pano_camera.add(new THREE.PointLight( 0x999999 ));

            var first_person = new THREE.OrbitControls(this._pano_camera, div_container);
            first_person.enabled = false;
            this._first_person_controls = first_person;
            
            this._scene.add( this._pano_camera );
            this._scene.add( this._pano_camera_helper );
        
            div_container.appendChild( this._renderer.domElement );
		    this._renderer.autoClear = false;
            window.addEventListener( 'resize', this.onWindowResize, false );
            
            this._ray_caster = new THREE.Raycaster();
            this._mouse_pos = new THREE.Vector2();

            // Mouse event handling
            this.default = 0
            this.measureStarted = 1;
            this.measurePickcedFirst = 2;

            this._command_mode = this.default;

            this._renderer.domElement.addEventListener( 'mousemove', event => {
                event.preventDefault();
                this._mouse_pos.x = ( event.offsetX / this._renderer.domElement.width ) * 2 - 1;
                this._mouse_pos.y = - ( event.offsetY / this._renderer.domElement.height) * 2 + 1;
    
                this.checkMouseOnPano();
            }, false );

            this._renderer.domElement.addEventListener( 'mousedown', event => {
                var event_to_send;

                if(this._pano_on_mouse){
                    printToConsole(this._pano_on_mouse.name + " is selected.");
                    
                    switch(this._command_mode){
                    case this.measureStarted:
                        this._pano_picked = this._pano_on_mouse;
                        this._command_mode = this.measurePickedFirst;
                        printToConsole("Select one more pano.");
                    break;
                    case this.measurePickedFirst:
                        if(this._pano_picked == this._pano_on_mouse){
                            printToConsole("Two panos are the same. Select a different pano.");
                            return;
                        }
                        let col = getRandomColor();
                        var start = [0,0,0];
                        var end = [0,0,0];
                        assignVec2Array3D (start, this._pano_picked.position);
                        assignVec2Array3D (end, this._pano_on_mouse.position);
                        this.scene.add(makeLineObject(
                            this._pano_picked.position.clone(),
                            this._pano_on_mouse.position.clone(), 
                            new THREE.LineBasicMaterial( { color: col} ), 
                            true, true ));

                        this.render();

                        event_to_send = createEventToPlayer ("ObjectHandler", "AddDimension")            
                        event_to_send.args = {
                            name : this._pano_on_mouse.name + "-" + this._pano_picked.name,
                            geom : {
                                start: start,
                                end: end
                            }
                        }
                        emitEventToPlayer(event_to_send);

                        let dx = Math.abs(start[0] - end[0]).toPrecision(3);
                        let dy = Math.abs(start[1] - end[1]).toPrecision(3);
                        let dz = Math.abs(start[2] - end[2]).toPrecision(3);
                        let dd = Math.sqrt(dx*dx + dy*dy + dz*dz).toPrecision(3);
                        printToConsole("Distane is: " + dd + " (" + dx + ", " + dy + ", " + dz +")");
                        this._pano_picked = null;
                        this._command_mode = this.default;
                    break;
                    default:
                        this._pano_picked = null;
                        event_to_send = createEventToPlayer ("TransitHandler", "ChangePano")            
                        event_to_send.args = {
                            id : this._pano_on_mouse.cupixID,
                            name : this._pano_on_mouse.name
                        }
                        emitEventToPlayer(event_to_send);
                    }
                }
            }, false );
        }

        animate() {
            if(viewController == null ) return;

            requestAnimationFrame( viewController.animate );
            viewController.controls.update();
        }

        render() {
            viewController.renderer.render( viewController.scene, viewController.activeCamera );
        }

        onWindowResize() {
            viewController.activeCamera.aspect = viewController.container.clientWidth / viewController.container.clientHeight;
            viewController.activeCamera.updateProjectionMatrix();
            viewController.renderer.setSize( viewController.container.clientWidth, viewController.container.clientHeight );
            viewController.controls.handleResize();
            viewController.render();
        }

        highlightObject(obj){
            obj.material.emissive.setHex( 0x333333 );
        }

        deHighlightObject(obj){
            obj.material.emissive.setHex( 0 );
        }

        checkMouseOnPano(){
            let cam = this.activeCamera;
            cam.updateMatrixWorld();
            this._ray_caster.setFromCamera( this._mouse_pos, cam );
            var intersects = this._ray_caster.intersectObjects( this.activeGroup.children, true );
            var found = false;
            for(var i=0;i<intersects.length;++i){
                if(intersects[i].object.cupixID != undefined){
                    if ( this._pano_on_mouse != intersects[i].object ) {
                        this._pano_on_mouse = intersects[i].object;
                        this.highlightObject(this._pano_on_mouse);
                    }
                    $('canvas').css('cursor','pointer');
                    found = true;
                    break;
                }
            }
            if (!found) {
                if ( this._pano_on_mouse )
                    this.deHighlightObject( this._pano_on_mouse )
                this._pano_on_mouse = null;
                $('canvas').css('cursor','default');
            }
    
            this.render();
        }

        handleObjectEventsFromPlayer(event_type, event_args){
            var customObj = null; 
            
            if (customObjManager != null)
                customObj = customObjManager.search(event_args.name);
            
            switch(event_type){
            case "Selected":
                if(event_args.type=="Dimension" && this._handled_object_hash_table[event_args.id] == undefined){
                    let col = 0x00ff00;
                    const start = event_args.geom.start;
                    const end = event_args.geom.end;
                    this.scene.add(makeLineObject(
                            new THREE.Vector3(start[0], start[1], start[2]),
                            new THREE.Vector3(end[0], end[1], end[2]), 
                            new THREE.LineBasicMaterial( { color: col} ), 
                            true, true ));

                    this._handled_object_hash_table[event_args.id] = true;
                    this.render();
                }
                break;
            case "Focused":
                if( customObj != null ){
                    this.highlightObject (customObj.sceneObject);
                    this.render();
                }
                break;
            case "Blurred":
                if( customObj != null ){
                    this.deHighlightObject (customObj.sceneObject);
                    this.render();
                }
                break;
            case "Added":
                // Object was created from parent
                // Set the id generated in the player 
                if( customObj != null )
                    customObj.cupixID = event_args.id;
                break;
            default: break;
            }
        }
    
        clear(){
            $(this._renderer.domElement).remove();
            window.removeEventListener( 'resize', this.onWindowResize );
            clearThree(this._scene);
            this._renderer = null;
            this._scene = null;
        }

        initGroups(){
            for(let i = 0;i<this._tour_model._section_groups.length;++i){
                const section_group = this._tour_model._section_groups[i];
                var section_dropdown = $(".dropdown-menu#setion-list");
                let sectino_div_id = sectionDivPrefix+i;
                section_dropdown.append("<a class='dropdown-item' id='" + sectino_div_id + "' href='#'>" + section_group.name + "</a>");
                if(i==0){
                    $("#txt-active-section").val(section_group.name);
                }else{
                    section_group.visible = false;
                }
            }
        }

        toggleCamera(){
            if(this.activeCamera == this._pano_camera){
                this.activeCamera = this.activeGroup.camera;
                this._pano_camera.far = 1.0;
                this._pano_camera_helper.visible = true;
                this.activeGroup.axesHelper.visible = true;

                this.controls.enabled = true;
                this.panoControls.enabled = false;
            }else{
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

        updatePanoCameraHelper(){
            this._pano_camera.updateProjectionMatrix();
            this._pano_camera_helper.update();
            
            // TODO: not working
            //this._first_person_controls.target = this._pano_camera.position;
            //this._first_person_controls.update();
            
            this.render();
        }
    
        updatePanoCamera(player_pano_camera){
            //
            // player_pano_camera is in the global cooridnate sytem
            //
            // No need to update player_pano_camera.pos 
            // (currently pano-cam is attached to the ativePano)
            // assignArray2Vec3D(this._pano_camera.position, player_pano_camera.pos);
            
            assignArray2Vec3D(this._pano_camera.up, player_pano_camera.up);
            this._pano_camera.lookAt(
                player_pano_camera.pos[0] + player_pano_camera.lookat[0], 
                player_pano_camera.pos[1] + player_pano_camera.lookat[1], 
                player_pano_camera.pos[2] + player_pano_camera.lookat[2]);
            
            this._pano_camera.fov = player_pano_camera.fov;
            this.updatePanoCameraHelper();
        }

        get activeGroup(){
            return this._tour_model._section_groups [ this._active_group_index ];
        }

        set activeGroup(i){
            if(i==NaN || i < 0 || i > this._tour_model._section_groups.length) return;
            if( this._active_group_index == i) return;
            
            this.activeGroup.visible = false;
        
            this._active_group_index = i;
            let section = this._tour_model._section_groups[i];
            section.visible = true;

            this.activeCamera = section.camera;
            
            this.controls.object = this.activeCamera;
            this.controls.enabled = true;
            this.panoControls.enabled = false;
            
            this.render();
        }
        
        get activeCamera(){
            return this._active_camera;
        }

        set activeCamera(c){
            c.aspect = this._container.clientWidth / this._container.clientHeight;
            this._active_camera = c;
        }

        get activePano(){
            return this._active_pano;
        }

        set activePano(pano_id){
            this._active_pano = this._tour_model._pano_hash_table[pano_id];
            assignVec2Vec3D( this._pano_camera.position, this._active_pano.position);
            this.updatePanoCameraHelper();
        }

        get scene(){
            return this._scene;
        }

        get renderer(){
            return this._renderer;
        }

        get controls(){
            return this._controls;
        }

        get panoControls(){
            return this._first_person_controls;
        }

        get container(){
            return this._container;
        }

        get commandMode(){
            return this._command_mode;
        }

        set commandMode(m){
            this._command_mode = m
        }
    }

    class Box3D{
        constructor(width, height, depth, color, opacity = 1.0){
            this._width = width;
            this._height = height;
            this._depth = depth;
            this._color = color;
            this._opacity = opacity;
            const geometry = new THREE.BoxBufferGeometry( width, height, depth );
            this._object = new THREE.Mesh( geometry, 
                new THREE.MeshLambertMaterial( 
                    { 
                        color: color,
                        transparent: true,
                        opacity: opacity
                    } 
            ));
            
            this._object.wrapper = this;
            viewController.scene.add(this._object);
        }

        locate(x, y, z){
            this._object.position.set(x,y,z);
        }

        remove(){
            this.removeFromPlayer();
            viewController.scene.remove(this._object);
            this._object.geometry.dispose();
            this._object.material.dispose();
            this._object = undefined;
        }

        addToPlayer(){
            const event_to_send = createEventToPlayer ("ObjectHandler", "AddBox")            
            event_to_send.args = {
                name : this.name,
                color : this.color,
                opacity: this.opacity,
                geom : {
                    pos: [this.x, this.y, this.z],
                    quat: [1,0,0,0],
                    size: [this.width, this.height, this.depth]
                }
            }
            emitEventToPlayer(event_to_send);
        }

        removeFromPlayer(){
            const event_to_send = createEventToPlayer ("ObjectHandler", "Delete");
            event_to_send.args = {
                id : this.cupixID
            }
            emitEventToPlayer(event_to_send); 
        }

        updatePlayer(){
            const event_to_send = createEventToPlayer ("ObjectHandler", "Change")            
            event_to_send.args = {
                name : this.name,
                id : this.cupixID,
                geom : {
                    pos: [this.x, this.y, this.z],
                    quate: [1,0,0,0],
                    size: [this.width, this.height, this.depth]
                }
            }
            emitEventToPlayer(event_to_send);
        }
        get sceneObject(){
            return this._object;
        }

        get x() {return this._object.position.x};
        get y() {return this._object.position.y};
        get z() {return this._object.position.z};
        
        get width() {return this._width};
        get height() {return this._height};
        get depth() {return this._depth};
        get color() {return this._color};
        get opacity() {return this._opacity};

        set cupixID(id){
            this._cupixID = id; 
            this._object.cupixID = id;
        }

        get cupixID(){
            return this._cupixID;
        }

        set name(n){
            this._name = n;
        }

        get name(){
            return this._name;
        }
    }

    class CustomObjectManager{
        constructor(){
            this._name_table = {};
        }

        add(obj){
            let name = getRandomString(6);    // 6 letter random string
            this._name_table[name] = obj;
            obj.name = name;

            obj.addToPlayer();
            return name;
        }

        remove(obj){
            obj.remove();
        }

        search(name){
            return this._name_table[name];
        }
    }

    var focusedBoxObject = null;
    var transformControl = null;

    function initBoxInteraction(){
        transformControl = new THREE.TransformControls( viewController.activeCamera, viewController.renderer.domElement );
        
        transformControl.addEventListener( 'change', viewController.render );
        
        transformControl.addEventListener( 'dragging-changed',  event => {
            viewController.controls.enabled = ! event.value;
        } );
        
        viewController.scene.add( transformControl );

		// Hiding transform situation is a little in a mess :()
		transformControl.addEventListener( 'change', () => {
			cancelHideTransform();
        } );
        
		transformControl.addEventListener( 'mouseDown', event => {
			cancelHideTransform();
		} );
		transformControl.addEventListener( 'mouseUp', event => {
            delayHideTransform();
		} );
		transformControl.addEventListener( 'objectChange', event => {
            if(focusedBoxObject == null) return;

            focusedBoxObject.updatePlayer();
            viewController.controls.enabled = false;
		} );
        
        var dragcontrols = new THREE.DragControls( [], 
            viewController.activeCamera, viewController.renderer.domElement );
        
            dragcontrols.enabled = false;
        
		dragcontrols.addEventListener( 'hoveron', event => {
            transformControl.attach( event.object );
            if(event.object.wrapper != null)
                focusedBoxObject = event.object.wrapper;
			cancelHideTransform();
        } );
        
		dragcontrols.addEventListener( 'hoveroff', () => {
			delayHideTransform();
		} );
        
        var hiding;
        
        function delayHideTransform() {
			cancelHideTransform();
			hideTransform();
        }
        
		function hideTransform() {
			hiding = setTimeout( () => {
                focusedBoxObject = null;
				transformControl.detach( transformControl.object );
			}, 1500 );
        }
        
		function cancelHideTransform() {
			if ( hiding ) clearTimeout( hiding );
        }
        
        return dragcontrols;
    }

    function addBox(){
        let alpha = getRandomNumber(0.2, 1.0);
        const box = new Box3D( getRandomNumber(0.5, 1.5), getRandomNumber(0.5, 1.5), getRandomNumber(0.5, 1.5), getRandomColor(), alpha);

        const group_center =  new THREE.Vector3();
        viewController.activeGroup.boundingBox.getCenter(group_center);
        box.locate(group_center.x, group_center.y, group_center.z);

        if(customObjManager==null)
            customObjManager = new CustomObjectManager();
        
        if(boxDragInteraction==null)
            boxDragInteraction = new initBoxInteraction();
        
        customObjManager.add(box);
        boxDragInteraction.addObject(box.sceneObject);
        viewController.render();
    }

    function addDim(){
        printToConsole("Please select the first pano.")
        viewController.commandMode = viewController.measureStarted;
    }

    //
    // Listeing events from the embedded Cupix Player
    //
    window.addEventListener("message", event => {
        // Check if the version of API is 2
        if(event.data.ver != "2") return;

        const event_sender = event.data.sender;
        const event_type = event.data.type;
        const event_args = event.data.args;
        const event_args_str = JSON.stringify(event_args);

        // Show the event info in the left console
        leftConsoleWindow.innerHTML = 
        "<span class='prefix'>Sender:</span>" + event_sender + CR +
        "<span class='prefix'>Type:</span>" + event_type + CR + 
        "<span class='prefix'>Args:</span>" + event_args_str;

        switch(event_sender){
            case "Loader":
                if(event_type == "Started"){
                    // Loading is just started
                }else if(event_type == "Progress"){
                    // Loading is making progresses
                }else if(event_type == "Completed"){
                    // Loading is completed
                    // Dlone args object and build the 3D tour structure
                    model = new TourModel(JSON.parse(event_args_str));
                    viewController = new SceneViewController(model,container);
                    viewController.render();
                    viewController.animate();
                }
            break;
            case "ObjectHandler":
                viewController.handleObjectEventsFromPlayer(event_type, event_args);
            break;
            case "TransitHandler":
                if(event_type == "PanoStarted"){
                }else if(event_type == "PanoCompleted"){
                    viewController.activePano = event_args.id;
                }
            break;
            case "Camera": 
                if(event_type == "Changed"){
                    viewController.updatePanoCamera(event_args);
                }
            break;
            default: break;
        }
    }, false);

    //
    // Helper functions
    //
    function makeLineObject(start, end, mat, startArrow = false, endArrow = false){
        let geom = new THREE.BufferGeometry();
        let ends = [start.x, start.y, start.z, end.x, end.y, end.z];
        geom.addAttribute( 'position', new THREE.Float32BufferAttribute( ends, 3 ) );
		let line = new THREE.LineSegments(geom, mat);
        line.computeLineDistances();

        if(!(startArrow || endArrow)) return line;

        let length = 0.1;
        let headLength = length;
        let headWidth = headLength*0.5;
        
        var dir = end.clone().sub(start);
        dir.normalize();
        var rev_dir = dir.clone().negate();
        
        if(startArrow)
            line.add( new THREE.ArrowHelper( rev_dir, start.add(dir.clone().multiplyScalar(length)), length, mat.color, headLength, headWidth ) );

        if(endArrow)
            line.add( new THREE.ArrowHelper( dir, end.add(rev_dir.clone().multiplyScalar(length)), length, mat.color, headLength, headWidth ) );

        return line;
    }

    function clearThree(obj){
        while(obj.children.length > 0){ 
            clearThree(obj.children[0])
            obj.remove(obj.children[0]);
        }
        if(obj.geometry) obj.geometry.dispose()
        if(obj.material) obj.material.dispose()
        if(obj.texture) obj.texture.dispose()
    }   

    function assignVec2Vec3D(a,b){
        a.set(b.x, b.y, b.z);
    }

    function assignVec2Vec2D(a,b){
        a.x = b.x;
        a.y = b.y;
    }

    function assignArray2Vec3D(a,b){
        a.set(b[0], b[1], b[2]);
    }

    function assignVec2Array3D(a,b){
        a[0] = b.x;
        a[1] = b.y;
        a[2] = b.z;
    }

    function getRandomColor(){
        return Math.random() * 0xffffff;
    }

    function getRandomNumber(start, end){
        return Math.floor(Math.random() * end) + start  
    }

    function getRandomString(n) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      
        for (var i = 0; i < n; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      
        return text;
    }

    function emitEventToPlayer(e){
        iframePlayer[0].contentWindow.postMessage(e, "*");
    }
    
    function createEventToPlayer(s, t){
        var e = {}
        //e.test = true;
        e.sender = s ;
        e.type = t ;
        //e.main = true;
        e.ver = "2";
        e.caller = "demo";

        return e;
    }

    function printNAMessage(){
        printToConsole( "Not Implemented");
    }

    function printToConsole(msg){
        rightConsoleWindow.innerHTML += "<span class='prefix'>></span> " + msg + CR;
        rightConsoleWrapper.scrollTop(1e10);    // scroll to top very large number
    }

    function clearAll(){
        $(".dropdown-menu#setion-list .dropdown-item").remove();
        rightConsoleWindow.innerHTML = "";
        
        if(model != null )
            model.clear();
        model = null;
        
        if(viewController != null)
            viewController.clear();

        viewController = null;
        customObjManager = null;
        boxDragInteraction = null;
    }

    //
    // UI handlers
    //
    $("#btn-open").on('click', event => {
        event.preventDefault();
        
        let url = $("#txt-player-url").val();
        if(url == "" ) return;

        clearAll();
        iframePlayer.attr('src', url);
    });

    $(document).on('keyup', event => {
        // If the Del key is pressed
        if(event.keyCode == 46) {
            if(focusedBoxObject != null){
                printToConsole(focusedBoxObject.name + " is being deleted.");

                if(transformControl != null)
                    transformControl.detach( focusedBoxObject.sceneObject );
                
                boxDragInteraction.removeObject( focusedBoxObject.sceneObject );
                customObjManager.remove( focusedBoxObject );
                viewController.render();
            }else{
                printToConsole("No object is selected or active.");
            }
        }
    });

    $("#btn-sync").on('click', event => viewController.toggleCamera())
    
    // Add objects
    $("#drop-add").on('click', '.dropdown-item', event => {
        let obj_type = event.currentTarget.text;
        printToConsole( "Adding a " + obj_type +" ...");
        switch(obj_type){
            case "Add Box": addBox(); break;
            case "Dist b/w Panos": addDim(); break;
        }
    });
    
    // Section selected
    $('#setion-list').on('click', '.dropdown-item', event => {
        event.preventDefault();
        
        $("#txt-active-section").val(event.currentTarget.text);
        
        let index = parseInt(event.currentTarget.id.substring(sectionDivPrefix.length));
        viewController.activeGroup = index;
    });

});
