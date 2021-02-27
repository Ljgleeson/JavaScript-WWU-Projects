//Shader code is at bottom of the file

//Initialize the canvas
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

    //This is the main render loop
    var renderLoop = function() {
        scene.render(canvas, gl, renderWidth, renderHeight);
        window.requestAnimationFrame(renderLoop);
    }
    window.requestAnimationFrame(renderLoop);

    return scene;
}

/*Pass different shader source code to allow multiple shaders in a single scene I think
  UVS are defaulted to null until later*/
var ShadedTriangleMesh = function(gl, vertexPositions, vertexNormals, indices, vertexSource, fragmentSource, vertexUVs = null) {
    //This will be passed as a paramter to gl.drawElements in ObjectMesh.prototype.render
    this.indexCount = indices.length;
    // Create OpenGL buffers for the vertex, uvs, normals, and index data of the triangle mesh as needed
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    this.normalVbo = createVertexBuffer(gl, vertexNormals);
    this.indexIbo = createIndexBuffer(gl, indices);
    //Create the shader program for this object
    this.shaderProgram = createShaderProgram(gl, vertexSource, fragmentSource);
}

//Reference ShadedTriangleMesh.prototype.render in task5/6/7 for help
ShadedTriangleMesh.prototype.render = function(gl, model, view, projection) {
    //Bind shader program
    gl.useProgram(this.shaderProgram);

    //Change Uniform data
    //Assemble uniform data
    var modelViewProjection = new SimpleMatrix();
    modelViewProjection = SimpleMatrix.multiply(SimpleMatrix.inverse(view),model);
    modelViewProjection = SimpleMatrix.multiply(projection,modelViewProjection);
    var modelViewProjInv = new SimpleMatrix();
    modelViewProjInv = SimpleMatrix.inverse(modelViewProjection);
    var modelView = new SimpleMatrix();
    modelView = SimpleMatrix.multiply(SimpleMatrix.inverse(view),model);
    var modelViewInvTranspose = new SimpleMatrix();
    modelViewInvTranspose = SimpleMatrix.inverse(modelView);

    //Change Uniform data part 2
    // Pass matrix to shader uniform
    // IMPORTANT: OpenGL has different matrix conventions than our JS program. We need to transpose the matrix before passing it
    // to OpenGL to get the correct matrix in the shader.
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjInv"), false, modelViewProjInv.m);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelView"), false, modelView.transpose().m);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewInvTranspose"), false, modelViewInvTranspose.m);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "Model"), false, model.transpose().m);

    // OpenGL setup beyond this point
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexIbo);

    //Change Uniform data pt3 (changes how WebGl interprets the data)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVbo);
    var positionAttrib = gl.getAttribLocation(this.shaderProgram, "Position");
    if (positionAttrib >= 0) {
        gl.enableVertexAttribArray(positionAttrib);
        gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalVbo);
    var normalAttrib = gl.getAttribLocation(this.shaderProgram, "Normal");
    if (normalAttrib >= 0) {
        gl.enableVertexAttribArray(normalAttrib);
        gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);
    }
    /*Below is the data clarification required by WebGL so that it knows how to use the data
      Below are the parameter meanings of the function gl.vertexAttribPointer()
      gl.vertexAttribPointer(
        1) Attribute location (this starts at 0 for the first attribute),
        2) Number of elements per attribute,
        3) Type of element,
        4) Is the data normalized or not? (use false here but idk why),
        5) Size of an individual vertex,
        6) Offset from the beggining of a single vertex to this attribute (Use case: multiple value meanings in the same array)
          ex. arrayOfA&O = [a1, b1, a2, b2] where a has offset 0, and b has offset 1
        ); */

    //Draw the mesh
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
}

var createScene = function(canvas, gl) {
    //Store any attributes relevant to calculations
    this.cameraAngle = 0;
    //Render each object as a mesh with ObjectMesh()
      //this.rocket = new ObjectMesh()
      //this.planet1 = new ObjectMesh()
      //... etc

    //Change Scene objects here 
    this.sphereMesh = new ShadedTriangleMesh(gl, SpherePositions, SphereNormals, SphereTriIndices, VertexSource, FragmentSource);
    this.cubeMesh = new ShadedTriangleMesh(gl, CubePositions, CubeNormals, CubeIndices, VertexSource, FragmentSource);

    gl.enable(gl.DEPTH_TEST);
}

createScene.prototype.render = function(canvas, gl, w, h) {
    //Change canvas background color here
    //Set the paint color and then paint the background of the canvas <--------- This may be where the skybox enters the chat
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Change transformation matrices here
    //Create and/or access all transfomation matrices
      //proj, and all view, rotation, and model matrices
    var projection = SimpleMatrix.perspective(45, w/h, 0.1, 100);
    var view = SimpleMatrix.rotate(this.cameraAngle, 1, 0, 0).multiply(
        SimpleMatrix.translate(0, 0, 6));
    var rotation = SimpleMatrix.rotate(Date.now()/25, 0, 1, 0);
    var cubeModel = SimpleMatrix.translate(-1.8, 0, 0).multiply(rotation);
    var sphereModel = SimpleMatrix.translate(1.8, 0, 0).multiply(rotation).multiply(SimpleMatrix.scale(1.2, 1.2, 1.2));

    //Change objects rendered in the scene
    //Render each object in the scene
    this.sphereMesh.render(gl, sphereModel, view, projection);
    this.cubeMesh.render(gl, cubeModel, view, projection);
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

var VertexSource = `
    uniform mat4 ModelViewProjection;

    //This matrix is used to transform normals
    uniform mat4 ModelViewProjInv;

    //These matrices are used to calculate distance and light direction
    uniform mat4 Model;
    uniform mat4 ModelView;
    uniform mat4 ModelViewInvTranspose;

    attribute vec3 Position;
    attribute vec3 Normal;

    varying vec3 Color;

    // TODO: Implement a vertex shader that
    //       a) applies the ModelViewProjection matrix to the vertex position and stores the result in gl_Position
    //       b) computes the lambert shaded color at the vertex and stores the result in Color

    //       You may need multiple uniforms to get all the required matrices
    //       for transforming points, vectors and normals.


    // Constants you should use to compute the final color
    const vec3 LightPosition = vec3(4, 1, 4);
    const vec3 LightIntensity = vec3(20);
    const vec3 ka = 0.3*vec3(1, 0.5, 0.5);
    const vec3 kd = 0.7*vec3(1, 0.5, 0.5);

    void main() {

// ################ Edit your code below
        //Transform the position
        gl_Position = ModelViewProjection * vec4(Position, 1.0);

        //distance squared
        float r = distance(LightPosition, (Model * vec4(Position, 1.0)).xyz );

        //Dot product
        float d = dot((ModelViewInvTranspose * vec4(Normal, 0.0)).xyz, normalize(LightPosition-(ModelView * vec4(Position, 1.0)).xyz));

        //Compute the color
        Color = ka + (kd * LightIntensity * 1.0/(r*r)  * max(0.0,d));

// ################

    }
`;
var FragmentSource = `
    precision highp float;

    varying vec3 Color;

    // TODO: Implement a fragment shader that copies Color into gl_FragColor
    // Hint: Color is RGB; you need to extend it with an alpha channel to assign it to gl_FragColor

    void main() {

// ################ Edit your code below
      gl_FragColor = vec4(Color, 1.0);
// ################

    }
`;