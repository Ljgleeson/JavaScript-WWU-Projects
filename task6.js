var LambertVertexSource = `
    uniform mat4 ModelViewProjection;
    
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
    const vec3 ka = 0.3*vec3(1, 0.5, 0.5);      //amient color 
    const vec3 kd = 0.7*vec3(1, 0.5, 0.5);      //surface color
   

    void main() {

// ################ Edit your code below
        vec3 lightDirection = LightPosition - LightIntensity;
        vec3 l = normalize(lightDirection);
        //float r = distance(LightPosition - Position);
        float r = length(LightPosition);
                                            //vec3 I = LightIntensity/(r*r);
        vec3 I = LightIntensity/(r*r);
      
        gl_Position = ModelViewProjection *  vec4(Position, 1.0);
        Color = ka + kd * I * max( 0.0 , dot(Normal , l));     //can add ka as its just ambient lighting
// ################

    }
`;
var LambertFragmentSource = `
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

var ShadedTriangleMesh = function(gl, vertexPositions, vertexNormals, indices, vertexSource, fragmentSource) {
    this.indexCount = indices.length;
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    this.normalVbo = createVertexBuffer(gl, vertexNormals);
    this.indexIbo = createIndexBuffer(gl, indices);
    this.shaderProgram = createShaderProgram(gl, vertexSource, fragmentSource);
}

ShadedTriangleMesh.prototype.render = function(gl, model, view, projection) {
    
    gl.useProgram(this.shaderProgram);
    
    // TODO: Assemble a model-view-projection matrix from the specified matrices. You can copy your code from task 5

// ################ Edit your code below
    var modelViewProjection = new SimpleMatrix();
    var inv_view = SimpleMatrix.inverse(view);
    modelViewProjection = modelViewProjection.multiply(projection);
    modelViewProjection = modelViewProjection.multiply(inv_view);
    modelViewProjection = modelViewProjection.multiply(model);
// ################

    
    // TODO: Implement a render method to do Lambert shading.
    //       Currently the code only passes the model-view-projection matrix. You may need additional
    //       matrices to solve the problem. Use the existing code as a template and pass however many matrices you need.

// ################ Edit your code below
// ################


    // Pass matrix to shader uniform
    // IMPORTANT: OpenGL has different matrix conventions than our JS program. We need to transpose the matrix before passing it
    // to OpenGL to get the correct matrix in the shader.
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
    
    // OpenGL setup beyond this point
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexIbo);
    
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
    
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
}

var Task6 = function(canvas, gl) {
    this.cameraAngle = 0;
    this.sphereMesh = new ShadedTriangleMesh(gl, SpherePositions, SphereNormals, SphereTriIndices, LambertVertexSource, LambertFragmentSource);
    this.cubeMesh = new ShadedTriangleMesh(gl, CubePositions, CubeNormals, CubeIndices, LambertVertexSource, LambertFragmentSource);
    
    gl.enable(gl.DEPTH_TEST);
}

Task6.prototype.render = function(canvas, gl, w, h) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var projection = SimpleMatrix.perspective(45, w/h, 0.1, 100);
    
    var view = SimpleMatrix.rotate(this.cameraAngle, 1, 0, 0).multiply(
        SimpleMatrix.translate(0, 0, 6));
        
    var rotation = SimpleMatrix.rotate(Date.now()/25, 0, 1, 0);
    var cubeModel = SimpleMatrix.translate(-1.8, 0, 0).multiply(rotation);
    var sphereModel = SimpleMatrix.translate(1.8, 0, 0).multiply(rotation).multiply(SimpleMatrix.scale(1.2, 1.2, 1.2));

    this.sphereMesh.render(gl, sphereModel, view, projection);
    this.cubeMesh.render(gl, cubeModel, view, projection);
}

Task6.prototype.dragCamera = function(dy)
{
    this.cameraAngle = Math.min(Math.max(this.cameraAngle - dy*0.5, -90), 90);
}
