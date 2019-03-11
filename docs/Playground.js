$(document).ready(function() {
    if ( WEBGL.isWebGLAvailable() === false ) {
        document.body.appendChild( WEBGL.getWebGLErrorMessage() );
        return;
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
        App.leftConsole.innerHTML = 
        "<span class='prefix'>Sender:</span>" + event_sender + App.CR +
        "<span class='prefix'>Type:</span>" + event_type + App.CR + 
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
                    container = App.playerContainer;
                    vc = new SceneViewController(model,container);
                    app = new App( model, vc);
                    App.viewController.render();
                }
            break;
            case "ObjectHandler":
                App.viewController.handleObjectEventsFromPlayer(event_type, event_args);
            break;
            case "TransitHandler":
                if(event_type == "PanoStarted"){
                }else if(event_type == "PanoCompleted"){
                    if(App.viewController)
                        App.viewController.activePano = event_args.id;
                }else if(event_type == "GroupCompleted"){
                    if(App.viewController)
                        App.viewController.activeGroup = event_args.id;
                }
            break;
            case "Camera": 
                if(event_type == "Changed"){
                    if(App.viewController)
                        App.viewController.updatePanoCamera(event_args);
                }
            break;
            default: break;
        }
    }, false);

    //
    // UI handlers
    //
    $("#btn-open").on('click', event => {
        event.preventDefault();
        let url = $("#txt-player-url").val();
        if(url == "" ) return;
        App.openURL(url);
    });

    $(document).on('keyup', event => {
        // If the Del key is pressed
        if(event.keyCode == 46) {
            App.removeFocusedObj();
        }
    });

    $("#btn-sync").on('click', event => App.toggleCamera())
    
    // Command -> Parent event calls
    
    $("#btn-show-help").on('click', event => {
        App.toggleToastMessageVisibility();
    });
    
    $("#drop-command").on('click', '.dropdown-item', event => {
        let cmd_str = event.currentTarget.text;
        switch(cmd_str){
            case "Add Box": 
                App.printToConsole("Adding a randomly-sized box at the center of the scene.");
                App.addBox(); 
            break;
            case "Add Pushpin":
            // Dialog window will show up
            break;
            case "Dist b/w Panos":
                App.printToConsole("Adding a dimension between two selected panos.");
                App.addDim();
            break;
            case "Measure - Pick Floor Method":
                App.printToConsole("Measure dist in the Player by picking points on the floor.");
                App.measureDim("pick_on_floor");
            break;
            case "Measure - Two Pano Method":
                App.printToConsole("Measure dist in the Player by picking points using 2-pano matching point method.");
                App.measureDim("pick_2_panos");
            break;
            case "Cancel":
                App.printToConsole("Cancel measurement.");
                App.cancelCommand();
            break;
        }
    });
    $('#add-pushpin-modal').on('hide.bs.modal', function (event) {
        if($(document.activeElement) && $(document.activeElement)[0].id=='btn-add-pushpin'){
            App.printToConsole( "Adding a randomly-positioned pushpin");

            let title = $('#pushpin-title')[0].value;
            let desc = $('#pushpin-body')[0].value;
            let show_leg = ($('#show-leg')[0].value == "on" ? true : false);
            let auto_anchor = ($('#auto-anchor')[0].value == "on" ? true : false);

            App.addPushpin(title, desc, show_leg, auto_anchor);
        }
    });

    // Group changed
    $('#setion-list').on('click', '.dropdown-item', event => {
        event.preventDefault();
        
        $("#txt-active-section").val(event.currentTarget.text);
        
        let index = parseInt(event.currentTarget.id.substring(App.sectionDivPrefix.length));

        App.changeGroup(index);
    });

});
