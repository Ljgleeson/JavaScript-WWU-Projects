/* initializeScene.js contains the following definitions:

    var createScene = function(canvas, gl)
    createScene.prototype.render = function(canvas, gl, w, h)
    createScene.prototype.dragCamera = function(dx,dy)
    function createShaderObject(gl, shaderSource, shaderType)
    function createShaderProgram(gl, vertexSource, fragmentSource)
    function createVertexBuffer(gl, vertexData)
    function createIndexBuffer(gl, indexData)
*/

const CONSTANT_T = 0.0001;

//This object stores the scene data
var createScene = function(canvas, gl) {
    //Store any attributes relevant to calculations
    this.cameraAngleY = 0;
    this.cameraAngleX = 0;
    this.previousRocketX = 0;
    this.previousRocketZ = 0;
    /*Render each object as a mesh with ObjectMesh()
      this.rocket = new ObjectMesh()
      this.planet1 = new ObjectMesh()
      ... etc */
    //Define each objects textures at an array of ids here
    let sunId = ["sun"];
    let planet1Id = ["planet1"];
    let planet2Id = ["planet2"];
    let planet3Id = ["planet3"];
    //let skyboxIDs = ["two"];
    //Define unique Objects here (new ShadedTriangleMesh() per object)
    var out = parseOBJ(rocket_obj);
    var sp = parseOBJ(sphere_obj);
    
    // FOR DEBUGGING: Splines
    /*xcord = document.getElementById("xcor");
    zcord = document.getElementById("zcor");
    xrota = document.getElementById("xrot");
    zrota = document.getElementById("zrot");*/

    // Planet 1 = ( 30,  1,  -5), scaled by 5
    // Planet 2 = (  0,  2, -50), scaled by 5
    // Planet 3 = (-30,  1,   5), scaled by 7

    // Rocket spline path: X-control points
    var rocketCtrlX = [
        [  0, 10, 40, 40], // 1
        [ 40, 40, 15,  0], // 2
        [  0,-15,-25,  0], // 3
        [  0, 25, 10,  0], // 4
        [  0,-10,-25,-40], // 5
        [-40,-55,-10,  0]  // 6
    ];
    // Rocket spline path: Z-control points
    var rocketCtrlZ = [
        [  0, 15, 15, -5], // 1
        [ -5,-25,-20,-25], // 2
        [-25,-30,-65,-65], // 3
        [-65,-65,-40,-25], // 4
        [-25,-10, 35, 15], // 5
        [ 15, -5,-15,  0]  // 6
    ];
    // Rocket speed values
    var rocketSpeeds = [1, 1, 1, 1, 1, 1];
    this.rocketSpline = new Splines(rocketCtrlX, rocketCtrlZ, rocketSpeeds);

    this.rocketMesh = new ShadedTriangleMesh(gl, out.position, null, out.normal, null, VertexSource, FragmentSource);
    this.sphereMesh1 = new ShadedTriangleMesh(gl, sp.position, sp.texcoord, sp.normal, null, TextureVertShader, TextureFragShader, planet1Id);
    this.sphereMesh2 = new ShadedTriangleMesh(gl, sp.position, sp.texcoord, sp.normal, null, TextureVertShader, TextureFragShader, planet2Id);
    this.sphereMesh3 = new ShadedTriangleMesh(gl, sp.position, sp.texcoord, sp.normal, null, TextureVertShader, TextureFragShader, planet3Id);
    this.sun = new ShadedTriangleMesh(gl, sp.position, sp.texcoord, sp.normal, null, TextureVertShader, TextureFragShader, sunId);
    
    this.skybox = new Skybox(gl, SkyboxVertSource, SkyboxFragSource);

    gl.enable(gl.DEPTH_TEST);
}

/*This is the scenes render method, which instantiates transformation matrices
 and objects in the scene*/
createScene.prototype.render = function(canvas, gl, w, h) {
    //Change canvas background color here
    //Set the paint color and then paint the background of the canvas
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LEQUAL);

    // Move the rocket along the spline path
    this.rocketSpline.setT(delta * CONSTANT_T);
    // Calculate the rocket's X and Z coordinates
    let rocket_xz = this.rocketSpline.eval_direct();

    // Generate the angle of direction that the rocket is heading towards
    let rocketVelocityVec = [rocket_xz[0]-this.previousRocketX, rocket_xz[1]-this.previousRocketZ];
    let rocketDirectionRot = Math.atan(rocketVelocityVec[1]/rocketVelocityVec[0]);
    rocketDirectionRot = rocketDirectionRot * 180 / Math.PI;
    if (rocketVelocityVec[0] < 0) {
        rocketDirectionRot = rocketDirectionRot + 180;
    }
    // Store previous x-z coordinates for next frame
    this.previousRocketX = rocket_xz[0];
    this.previousRocketZ = rocket_xz[1];

        // FOR DEBUGGING: Splines
        /*xcord.innerHTML = rocket_xz[0];
        zcord.innerHTML = rocket_xz[1];
        xrota.innerHTML = rocketDirectionRot;
        zrota.innerHTML = rocketDirectionRot;*/

    //Define all transformation matrices here
    let projection = SimpleMatrix.perspective(65, w/h, 0.1, 300);
    let sbView = SimpleMatrix.rotate(this.cameraAngleX, 0, 1, 0)
        .multiply(SimpleMatrix.rotate(this.cameraAngleY, 1, 0, 0));
    let view = SimpleMatrix.multiply(sbView, SimpleMatrix.translate(0, 0.2, 2));

    //Define each objects model matrix here
    // TODO: Marked for removal, these two lines
    let rotation = SimpleMatrix.rotate(Date.now()/25, 0, -1, 0);
    let cubeModel = rotation;

    let translate1 = SimpleMatrix.translate(30,1, -5);
    let scale1 = SimpleMatrix.scale(5,5,5);
    let sphereModel1 = SimpleMatrix.multiply(translate1,scale1);

    let translate2 = SimpleMatrix.translate(0, 2, -50);
    let sphereModel2 =   SimpleMatrix.multiply(translate2, scale1);

    let translate3 = SimpleMatrix.translate(-30, 1, 5);
    let scale2 = SimpleMatrix.scale(7,7,7);
    let sphereModel3 = SimpleMatrix.multiply(translate3,scale2);

    let translate4 = SimpleMatrix.translate(15, 30, 80);
    let scaleSun = SimpleMatrix.scale(22,22,22);
    let sunModel = SimpleMatrix.multiply(translate4,scaleSun);

    //let rocketModel = SimpleMatrix.translate(8*Math.cos(Date.now()/2000), 0, -8*Math.sin(Date.now()/2000)).multiply(
      //  SimpleMatrix.rotate(90, 0, 0, 1));
    let rocketModel = SimpleMatrix.translate(rocket_xz[0], 0, rocket_xz[1])
        .multiply(SimpleMatrix.rotate(90, 0, 0, -1))
        .multiply(SimpleMatrix.scale(0.2, 0.2, 0.2));
    rocketModel = SimpleMatrix.multiply(rocketModel, SimpleMatrix.rotate(rocketDirectionRot, 1, 0, 0));

    view = SimpleMatrix.multiply(SimpleMatrix.translate(rocket_xz[0], 0, rocket_xz[1]), view);

    //Render each object in the mesh here
    //rocketModel.multiply(SimpleMatrix.rotate(90, 0, 0, 1))
    this.rocketMesh.render(gl, rocketModel, view, projection);
    this.sphereMesh1.render(gl, sphereModel1, view, projection);
    this.sphereMesh2.render(gl, sphereModel2, view, projection);
    this.sphereMesh3.render(gl, sphereModel3, view, projection);
    this.sun.render(gl, sunModel, view, projection)
    this.skybox.render(gl, sbView, projection);
}

//This method updates the x and y camera angles when the mouse is dragged in the canvas
createScene.prototype.dragCamera = function(dx,dy) {
    this.cameraAngleY = Math.min(Math.max(this.cameraAngleY - dy*0.5, -180), 180);
    this.cameraAngleX = Math.min(Math.max(this.cameraAngleX - dx*0.5, -180), 180);
}

//Initialize the canvas and contains the main render loop
function initialize(canvasId) {
    var canvas = document.getElementById(canvasId);
    //Error checking for the canvas
    if (!canvas) {
        console.log("Could not find canvas with id", canvasId);
        return;
    }

    //Initialization & error checking for WebGL
    try {
        //This line is used to support multiple browsers
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") || canvas.getContext("moz-webgl" || canvas.getContext("webgl2"));
    } catch (e) {}
    if (!gl) {
        console.log("Could not initialise WebGL");
        return;
    }

    //This method computes the window size
    var renderWidth, renderHeight;
    function computeCanvasSize() {
        //This line sets the width to the window width if window width is less than 1600, otherwise w=1600
        renderWidth = Math.min(canvas.parentNode.clientWidth , 1600);
        //This line enforces a 16:9 aspect ratio
        renderHeight = Math.floor(renderWidth*9.0/16.0);
        canvas.width = renderWidth;
        canvas.height = renderHeight;
        if (gl)
            gl.viewport(0, 0, renderWidth, renderHeight);
    }
    //This method will call computeCanvasSize whenever the window is resized!
    //target.addEventListener(type, listener [, options]);
    window.addEventListener('resize', computeCanvasSize);
    computeCanvasSize();

    var scene = new createScene(canvas, gl);

    //Mouse listeners
    var mouseDown = false;
    var lastMouseX, lastMouseY;
    var mouseMoveListener = function(event) {
        scene.dragCamera(event.screenX - lastMouseX, event.screenY - lastMouseY);
        lastMouseX = event.screenX;
        lastMouseY = event.screenY;
    };
    //What to do if click pressed
    canvas.addEventListener('mousedown', function(event) {
        if (!mouseDown && event.button == 0) {
            mouseDown = true;
            lastMouseX = event.screenX;
            lastMouseY = event.screenY;
            document.addEventListener('mousemove', mouseMoveListener);
        }
        event.preventDefault();
    });
    //What to do if click released
    document.addEventListener('mouseup', function(event) {
        if (mouseDown && event.button == 0) {
            mouseDown = false;
            document.removeEventListener('mousemove', mouseMoveListener);
        }
    });

    // Start time of animations
    epoch = Date.now();

    //This is the main render loop
    var renderLoop = function() {
        // Animation time Delta
        delta = Date.now() - epoch;
        epoch = Date.now();
        scene.render(canvas, gl, renderWidth, renderHeight);
        window.requestAnimationFrame(renderLoop);
    }
    window.requestAnimationFrame(renderLoop);

    return scene;
}

/*This function is from task5.js in A3
    gl = getContext('webgl')
    shaderSource = 'shader code as multiline string'
    shaderType = gl.VERTEX_SHADER or gl.FRAGMENT_SHADER

    This function returns the shader object of desired shader type after
    creating it and error checking
*/
function createShaderObject(gl, shaderSource, shaderType) {
    // Create a shader object of the requested type
    var shaderObject = gl.createShader(shaderType);
    // Pass the source code to the shader object
    gl.shaderSource(shaderObject, shaderSource);
    // Compile the shader
    gl.compileShader(shaderObject);

    // Check if there were any compile errors
    if (!gl.getShaderParameter(shaderObject, gl.COMPILE_STATUS)) {
        // If so, get the error and output some diagnostic info
        // Add some line numbers for convenience
        var lines = shaderSource.split("\n");
        for (var i = 0; i < lines.length; ++i)
            lines[i] = ("   " + (i + 1)).slice(-4) + " | " + lines[i];
        shaderSource = lines.join("\n");

        throw new Error(
            (shaderType == gl.FRAGMENT_SHADER ? "Fragment" : "Vertex") + " shader compilation error for shader '" + name + "':\n\n    " +
            gl.getShaderInfoLog(shaderObject).split("\n").join("\n    ") +
            "\nThe shader source code was:\n\n" +
            shaderSource);
    }

    return shaderObject;
}

/*This function is from task5.js in A3
    This function is used initalize the shaders and start the program
    gl = getContext('webgl') call
    vertexSource = `vertex shader code as multi-line string`
    fragmentSource = `fragment shader code as multi-line string`

    This function creates and returns a shader program after error checking
*/
function createShaderProgram(gl, vertexSource, fragmentSource) {
    // Create shader objects for vertex and fragment shader
    var   vertexShader = createShaderObject(gl,   vertexSource, gl.  VERTEX_SHADER);
    var fragmentShader = createShaderObject(gl, fragmentSource, gl.FRAGMENT_SHADER);

    // Create a shader program
    var program = gl.createProgram();
    // Attach the vertex and fragment shader to the program
    gl.attachShader(program,   vertexShader);
    gl.attachShader(program, fragmentShader);
    // Link the shaders together into a program
    gl.linkProgram(program);

    //Error check for linking
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let error = gl.getProgramInfoLog(program);
        console.error("Failed to link program: " + error);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null; //Make sure this is handled elsewhere
    }

    return program;
}

/*The following functions are from task5.js from A3
    These functions create a buffer for the two types of object data
    gl = gl.getContext('webgl')
    <type>Data = an array of <type>
*/
function createVertexBuffer(gl, vertexData) {
    var vbo = gl.createBuffer();
    // Bind it to the ARRAY_BUFFER target
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // Copy the vertex data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    return vbo;
}
function createIndexBuffer(gl, indexData) {
    var ibo = gl.createBuffer();
    // Bind it to the ELEMENT_ARRAY_BUFFER target
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // Copy the index data into the buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    return ibo;
}
