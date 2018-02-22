
// This function is called at framework startup to add a new plugin
(function (plugin, core, scene) {

    // Default values for parameters used for this plugin
    var DEFAULTS = {
        specular: new THREE.Color('#505050'),
        emissive: new THREE.Color('#000000'),
        shininess: 15.0,
        lights: true,
        texBool: true,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        shading: THREE.FlatShading,
        sides: THREE.DoubleSide,
        mljColorMode: MLJ.ColorMode.Uniform
    };

    // Objects that define a collection of uniform for shaders used with this plugin
    var PHONG = {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib[ "common" ],
            THREE.UniformsLib[ "lights" ],
            {
                "shading": {type: "i", value: DEFAULTS.shading},
                "diffuse": {type: "c", value: {}},
                "emissive": {type: "c", value: DEFAULTS.emissive},
                "specular": {type: "c", value: DEFAULTS.specular},
                "shininess": {type: "f", value: DEFAULTS.shininess},
                "lights": {type: "i", value: DEFAULTS.lights},
                "texBool": {type: "i", value: DEFAULTS.texBool},
                "mljColorMode": {type: "i", value: DEFAULTS.mljColorMode}
            }
        ])
    };

    // Ok, now first build the object that represents the plugin
    var plug = new plugin.Rendering({
        name: "Filled",
        tooltip: "Enable the rendering of the triangle mesh surface of the current layer.",
        icon: "img/icons/flat.png",
        toggle: true,
        on: true,
        loadShader: ["PhongFragment.glsl", "PhongVertex.glsl"]
    }, DEFAULTS);

    // and then define _init, _applyTo functions on that object

    // here some variables for plugin functions state
    var texWidget, lightingWidget, shadingWidget, shininessWidget,
            specularColor, emissiveColor, texWrapWidgetS, texWrapWidgetT;

    var texturingChoiceWidgets = [];
    // define its init function
    plug._init = function (guiBuilder) {

        // create some associated widget options for the gui to allow parameters change

        specularColor = guiBuilder.Color({
            label: "Specular",
            tooltip: "Specular color of the material, i.e. how shiny the material is and the color of its shine. Setting this the same color as the diffuse value (times some intensity) makes the material more metallic-looking; setting this to some gray makes the material look more plastic",
            color: "#" + DEFAULTS.specular.getHexString(),
            bindTo: "specular"
        });

        emissiveColor = guiBuilder.Color({
            label: "Emissive",
            tooltip: "Emissive (light) color of the material, essentially a solid color unaffected by other lighting",
            color: "#" + DEFAULTS.emissive.getHexString(),
            bindTo: "emissive"
        });

        shininessWidget = guiBuilder.RangedFloat({
            label: "Shininess",
            tooltip: "How shiny the specular highlight is. A higher value gives a sharper highlight",
            min: 0, max: 100, step: 1,
            defval: DEFAULTS.shininess,
            bindTo: "shininess"
        });

        shadingWidget = guiBuilder.Choice({
            label: "Shading",
            tooltip: "How the triangles of a curved surface are rendered: as a smooth surface, as flat separate facets, or no shading at all",
            options: [
                {content: "Flat", value: THREE.FlatShading, selected: true},
                {content: "Smooth", value: THREE.SmoothShading}
            ],
            bindTo: "shading" // name of the parameter used to keep track of the associated value. It is linked directly to a uniform when changed
        });

        texWidget = guiBuilder.Choice({
            label: "Texturing",
            tooltip: "Enable/disable texturing",
            options: [
                {content: "On", value: true, selected: true},
                {content: "Off", value: false}
            ],
            bindTo: "texBool"
        });

        texWrapWidgetS = guiBuilder.Choice({
            label: "Tex Wrapping S",
            tooltip: "Enable/disable texturing",
            options: [
                {content: "On", value: THREE.RepeatWrapping},
                {content: "Off", value: THREE.ClampToEdgeWrapping, selected: true}
            ],
            bindTo: (function () {  // here we define also a callback to invoke at every change of this option
                var bindToFun = function (wrapValue, overlay) {
                    if (MLJ.core.Scene.getSelectedLayer().texturesNum > 0) {
                        for (var i = 0; i < MLJ.core.Scene.getSelectedLayer().texturesNum; i++) {
                            overlay.material.uniforms.texture.value.wrapS = wrapValue;  // material update
                            overlay.material.uniforms.texture.value.needsUpdate = true;
                        }
                    }
                };
                bindToFun.toString = function () {
                    return 'wrapS';
                }; // name of the parameter used to keep track of the associated value
                return bindToFun;
            }())
        });

        texWrapWidgetT = guiBuilder.Choice({
            label: "Tex wrapping T",
            tooltip: "Enable/disable texturing",
            options: [
                {content: "On", value: THREE.RepeatWrapping},
                {content: "Off", value: THREE.ClampToEdgeWrapping, selected: true}
            ],
            bindTo: (function () {  // here we define also a callback to invoke at every change of this option
                var bindToFun = function (wrapValue, overlay) {
                    if (MLJ.core.Scene.getSelectedLayer().texturesNum > 0) {
                        for (var i = 0; i < MLJ.core.Scene.getSelectedLayer().texturesNum; i++) {
                            overlay.material.uniforms.texture.value.wrapT = wrapValue;  // material update
                            overlay.material.uniforms.texture.value.needsUpdate = true;
                        }
                    }
                };
                bindToFun.toString = function () {
                    return 'wrapT';
                }; // name of the parameter used to keep track of the associated value
                return bindToFun;
            }())
        });

        texturingChoiceWidgets.push(texWidget, texWrapWidgetS, texWrapWidgetT);
        hideTexWidgets();

        lightingWidget = guiBuilder.Choice({
            label: "Lighting",
            tooltip: "Enable/disable lighting",
            options: [
                {content: "On", value: true, selected: true},
                {content: "Off", value: false}
            ],
            bindTo: "lights"
        });

        guiBuilder.Choice({
            label: "Back Face Culling",
            tooltip: "Activate/Deactivate Back Face Culling",
            options: [
                {content: "Off", value: THREE.DoubleSide, selected: true},
                {content: "On", value: THREE.FrontSide}
            ],
            bindTo: (function () {  // here we define also a callback to invoke at every change of this option
                var bindToFun = function (sideValue, overlay) {
                    overlay.material.side = sideValue;  // material update
                };
                bindToFun.toString = function () {
                    return 'sides';
                }; // name of the parameter used to keep track of the associated value
                return bindToFun;
            }())
        });
    };

    try5 = function () {
        // https://github.com/yomotsu/ZipLoader
        console.log("BEG try5");
        
        var loader = new ZipLoader( 'mesh/3543_W18_shimi_mainHouse.3.reduceVertices.v3.zip' );

        loader.on( 'load', function ( e ) {

            console.log( 'loaded!' );
            console.log( loader.files );
            
            // var json = loader.extractAsJSON( 'foldername/data.json' );
            var img1 = loader.extractAsBlobUrl( '3543_W18_shimi_mainHouse_wall_11_62.png', 'image/png' );
            console.log( "Done img1" );

            var obj1 = loader.extractAsBlobUrl( '3543_W18_shimi_mainHouse.3.reduceVertices.obj', 'text/plain' );
            var mtl1 = loader.extractAsBlobUrl( '3543_W18_shimi_mainHouse.3.reduceVertices.obj.mtl', 'text/plain' );
            console.log( "obj1: " + obj1 );
            console.log( "mtl1: " + mtl1 );
            
            // var objStr = loader.extractAsText( '3543_W18_shimi_mainHouse.3.reduceVertices.obj' );
            // var mltString = loader.extractAsText( '3543_W18_shimi_mainHouse.3.reduceVertices.obj.mtl' );
            // console.log( "objStr: " + objStr );
            // console.log( "mltString: " + mltString );
            
            console.log( "obj1a: " + obj1 );
            console.log( "mtl1a: " + mtl1 );
	    var onProgress = function ( xhr ) {
	        if ( xhr.lengthComputable ) {
		    var percentComplete = xhr.loaded / xhr.total * 100;
		    console.log( Math.round(percentComplete, 2) + '% downloaded' );
	        }
	    };

	    var onError = function ( xhr ) { };
            
            var mtlLoader = new THREE.MTLLoader();
	    // mtlLoader.setPath( 'mesh/' );
	    // mtlLoader.load( 'foo1.obj.mtl', function( materials ) {

	    // mtlLoader.setPath( 'mesh/' );
	    // mtlLoader.load( '3543_W18_shimi_mainHouse.3.reduceVertices.obj.mtl', function( materials ) {

	    mtlLoader.load( mtl1, function( materials ) {
                
	        // mtlLoader.load( materialName, function( materials ) {
                
	        materials.preload();

	        var objLoader = new THREE.OBJLoader();
	        objLoader.setMaterials( materials );
	        // objLoader.setPath( 'mesh/' );
	        // objLoader.load( 'foo1.obj', function ( object ) {

	        // objLoader.setPath( 'mesh/' );
	        // objLoader.load( '3543_W18_shimi_mainHouse.3.reduceVertices.obj', function ( object ) {
	        objLoader.load( obj1, function ( object ) {

		    object.position.y = - 95;
		    scene.addOverlayLayer3( object );
                    
	        }, onProgress, onError );

	    });

            scene.render();

        } );
        
        loader.load();
    };
    
    // define its _applyTo function. This is called at plugin activation/deactivation
    plug._applyTo = function (meshFile, on) {

        console.log("BEG plug._applyTo2");
        console.log("meshFile: " + meshFile);
        console.log("plug.getName(): " + plug.getName());

        var meshName = meshFile.cppMesh.getMeshName();
        console.log("meshName: " + meshName);

        var materialName = meshFile.cppMesh.getMaterialName();
        console.log("materialName: " + materialName);
        
        if (on) {

            try5();
            
            } else {
                scene.removeOverlayLayer(meshFile, plug.getName()); // when plugin is deactivated we can release resources
            }
    };


    $(document).on("SceneLayerAdded SceneLayerSelected SceneLayerRemoved", function (event, layer) {
        if (layer.texturesNum > 0) {
            showTexWidgets();
        } else {
            hideTexWidgets();
        }
    });


    function hideTexWidgets() {
        //call the parent to hide the div containing both label and button set
        for (var i = 0; i < texturingChoiceWidgets.length; i++) {
            texturingChoiceWidgets[i].choice.$.parent().parent().hide(200);
        }
    }

    function showTexWidgets() {
        //call the parent to show the div containing both label and button set
        for (var i = 0; i < texturingChoiceWidgets.length; i++) {
            texturingChoiceWidgets[i].choice.$.parent().parent().show(200);
        }
    }

    // the plugin has been created, now we install it on the framework
    plugin.Manager.install(plug);

})(MLJ.core.plugin, MLJ.core, MLJ.core.Scene);
