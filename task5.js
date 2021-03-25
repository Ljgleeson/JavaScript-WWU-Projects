var BlackVertexSource = ` 
    uniform mat4 ModelViewProjection;
    
    attribute vec3 Position;
    
    // TODO: Implement a simple GLSL vertex shader that applies the ModelViewProjection
    //       matrix to the vertex Position.
    //       Note that Position is a 3 element vector; you need to extend it by one element (1.0)
    //       You can extend a vector 'V' by doing vec4(V, 1.0)
    //       Store the result of the multiplication in gl_Position
    void main() {

// ################ Edit your code below
        gl_Position = ModelViewProjection *  vec4(Position, 1.0);
// ################

    }
`;
//this is a string containing the source code for vertex shader ^. 
var BlackFragmentSource = `
    precision highp float;
    
    // TODO: Implement a simple GLSL fragment shader that assigns a black color to gl_FragColor
    //       Colors are vectors with 4 components (red, green, blue, alpha).
    //       Components are in 0-1 range.
    void main() {

// ################ Edit your code below
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
// ################

    }
`;

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

function createVertexBuffer(gl, vertexData) {
    // Create a buffer
    var vbo = gl.createBuffer();
    // Bind it to the ARRAY_BUFFER target
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // Copy the vertex data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    // Return created buffer
    return vbo;
//#endif
}
function createIndexBuffer(gl, indexData) {
    // Create a buffer
    var ibo = gl.createBuffer();
    // Bind it to the ELEMENT_ARRAY_BUFFER target
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // Copy the index data into the buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    // Return created buffer
    return ibo;
}

// Basic class to render a mesh with OpenGL
var TriangleMesh = function(gl, vertexPositions, indices, vertexSource, fragmentSource) {
    // Create OpenGL buffers for the vertex and index data of the triangle mesh
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    this.indexIbo = createIndexBuffer(gl, indices);
    
    // Create the shader program that will render the mesh
    this.shaderProgram = createShaderProgram(gl, vertexSource, fragmentSource);
    
    // Store the number of indices for later
    this.indexCount = indices.length;
}

TriangleMesh.prototype.render = function(gl, model, view, projection) {
    // TODO: Assemble a model-view-projection matrix from the specified matrices

    // ################ Edit your code below
    var modelViewProjection = new SimpleMatrix();
    var inv_view = SimpleMatrix.inverse(view);
    modelViewProjection = modelViewProjection.multiply(projection);
    modelViewProjection = modelViewProjection.multiply(inv_view);
    modelViewProjection = modelViewProjection.multiply(model);
    // ################

    
    // Bind shader program
    gl.useProgram(this.shaderProgram);
    // Pass matrix to shader uniform
    // IMPORTANT: OpenGL has different matrix conventions than our JS program. We need to transpose the matrix before passing it
    // to OpenGL to get the correct matrix in the shader.
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
    
    // Bind the two buffers with our mesh data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexIbo);
    
    // OpenGL boiler plate: link shader attribute and buffer correctly
    var positionAttrib = gl.getAttribLocation(this.shaderProgram, "Position");
    if (positionAttrib >= 0) {
        gl.enableVertexAttribArray(positionAttrib);
        gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Draw the mesh!
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
}

var Task5 = function(canvas, gl)
{
    this.mesh1 = new TriangleMesh(gl, CubePositions,   CubeIndices,      BlackVertexSource, BlackFragmentSource);
    this.mesh2 = new TriangleMesh(gl, CubePositions,   CubeIndices,      BlackVertexSource, BlackFragmentSource);
    this.mesh3 = new TriangleMesh(gl, SpherePositions, SphereTriIndices, BlackVertexSource, BlackFragmentSource);
    this.cameraAngle = 0;
    
    gl.enable(gl.DEPTH_TEST);
}

Task5.prototype.render = function(canvas, gl, w, h)
{
    var time = Date.now()/1000;
    var cosTime = Math.cos(time);
    var sinTime = Math.sin(time);
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projection = SimpleMatrix.perspective(45, w/h, 0.1, 100);
    
    var view = SimpleMatrix.rotate(this.cameraAngle, 1, 0, 0).multiply(
        SimpleMatrix.translate(0, 0, 8));
        
    var modelMatrix1 = SimpleMatrix.scale(Math.abs(cosTime), Math.abs(cosTime), 1);
    var modelMatrix2 = SimpleMatrix.translate(-3, 0, 0).multiply(SimpleMatrix.translate(sinTime, cosTime, 0));
    var modelMatrix3 = SimpleMatrix.translate(3, 0, 0).multiply(SimpleMatrix.rotate(time*30, 1, 1, 1));

    this.mesh1.render(gl, modelMatrix1, view, projection);
    this.mesh2.render(gl, modelMatrix2, view, projection);
    this.mesh3.render(gl, modelMatrix3, view, projection);
}

Task5.prototype.dragCamera = function(dy)
{
    this.cameraAngle = Math.min(Math.max(this.cameraAngle - dy*0.5, -90), 90);
}
