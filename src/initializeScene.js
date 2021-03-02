/* initializeScene.js contains the following definitions:

    var createScene = function(canvas, gl)
    createScene.prototype.render = function(canvas, gl, w, h)
    createScene.prototype.dragCamera = function(dx,dy)
    function createShaderObject(gl, shaderSource, shaderType)
    function createShaderProgram(gl, vertexSource, fragmentSource)
    function createVertexBuffer(gl, vertexData)
    function createIndexBuffer(gl, indexData)
*/

//This object stores the scene data
var createScene = function(canvas, gl) {
    //Store any attributes relevant to calculations
    this.cameraAngleY = 0;
    this.cameraAngleX = 0;
    /*Render each object as a mesh with ObjectMesh()
      this.rocket = new ObjectMesh()
      this.planet1 = new ObjectMesh()
      ... etc */
    //Define unique Objects here
    this.cubeMesh = new ShadedTriangleMesh(gl, CubePositions, CubeUVs, CubeNormals, CubeIndices, TextureVertShader, TextureFragShader, CubeNormMap);

    gl.enable(gl.DEPTH_TEST);
}

/*This is the scenes render method, which instantiates transformation matrices
 and objects in the scene*/
createScene.prototype.render = function(canvas, gl, w, h) {
    //Change canvas background color here
    //Set the paint color and then paint the background of the canvas <--------- This may be where the skybox enters the chat
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Define all transformation matrices here
    var projection = SimpleMatrix.perspective(45, w/h, 0.1, 100);
    //view is a transaltion matrix with the eye of the camera, and
    var view = SimpleMatrix.rotate(this.cameraAngleX, 0, 1, 0).multiply(
        SimpleMatrix.rotate(this.cameraAngleY, 1, 0, 0).multiply(
        SimpleMatrix.translate(0, 1, 6)));

    var rotation = SimpleMatrix.rotate(Date.now()/25, 0, 1, 0);
    var cubeModel = SimpleMatrix.translate(15*Math.cos(Date.now()/2000), -15*Math.sin(Date.now()/2000), 0).multiply(rotation);

    //Render each object in the mesh here
    this.cubeMesh.render(gl, cubeModel, view, projection);
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
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    } catch (e) {}
    if (!gl) {
        console.log("Could not initialise WebGL");
        return;
    }

    //This method computes the window size
    var renderWidth, renderHeight;
    function computeCanvasSize() {
        //This line sets the width to the window width if window width is less than 1600, otherwise w=1600
        renderWidth = Math.min(canvas.parentNode.clientWidth , 2090);
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

    const context = canvas.getContext("2d");
    const img = new Image();
    img.src = "";
    img.onload = () => {
      context.drawImage(img, 0, 0);
    }

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

    //This is the main render loop
    var renderLoop = function() {
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

    return program;
}

/*The following functions are from task5.js from A3
    These functions create a buffer for the two types of object data
    gl = gl.getContext('webgl')
    <type>data = an array of <type>
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
