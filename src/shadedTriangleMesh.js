/* shadedTriangleMesh.js contains the the following definitions:

    var ShadedTriangleMesh = function(gl, vertexPositions, vertexUVs, vertexNormals, indices, vertexSource, fragmentSource)
    ShadedTriangleMesh.prototype.render = function(gl, model, view, projection)
    function createTexture(gl, map, elementID, textureNum()
*/

//This object stores the vertex data of an object mesh and the shader program to be used on it
var ShadedTriangleMesh = function(gl, vertexPositions, vertexUVs, vertexNormals, indices, vertexSource, fragmentSource) {
    //This will be passed as a paramter to gl.drawElements in ObjectMesh.prototype.render
    this.indexCount = indices.length;
    // Create OpenGL buffers for the vertex, uvs, normals, and index data of the triangle mesh as needed
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    if (vertexNormals != null)
      this.normalVbo = createVertexBuffer(gl, vertexNormals);
    if (vertexUVs != null)
      this.uvVbo = createVertexBuffer(gl,vertexUVs);
    this.indexIbo = createIndexBuffer(gl, indices);
    //Create the shader program for this object
    this.shaderProgram = createShaderProgram(gl, vertexSource, fragmentSource);
}

/*This is derived from ShadedTriangleMesh.prototype.render in task5/6/7
    A different mesh.render method is needed if:
        different matrix/uniforms are needed. This is probably fixed by
        looping over a list of necesary inputs or something

    This method passes data to GL with which it draws a frame to the canvas*/
ShadedTriangleMesh.prototype.render = function(gl, model, view, projection) {
    //Bind shader program
    gl.useProgram(this.shaderProgram);
    var modelViewProjection = new SimpleMatrix();
    modelViewProjection = SimpleMatrix.multiply(SimpleMatrix.inverse(view),model);
    modelViewProjection = SimpleMatrix.multiply(projection,modelViewProjection);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m);
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
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVbo);
    var textCoordAttrib = gl.getAttribLocation(this.shaderProgram, "UV");
    if (textCoordAttrib >= 0) {
        gl.enableVertexAttribArray(textCoordAttrib);
        gl.vertexAttribPointer(textCoordAttrib, 2, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalVbo);
    var normalAttrib = gl.getAttribLocation(this.shaderProgram, "Normal");
    if (normalAttrib >= 0) {
        gl.enableVertexAttribArray(normalAttrib);
        gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, true, 0, 0);
    }
    //Create textures for each image map (currently only one works at a time for some reason)
      //This is for the diffuse map
    var diffMap = gl.createTexture();
    createTexture(gl, diffMap, "id", gl.TEXTURE0); //id = 

    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    //gl.bindTexture(gl.TEXTURE_2D, null);
}

//This isnt working for mulitple active textures,
//This function creates a GL 2D map from an image file
//elementID: The id name of imported image in index.html
//textureNum = gl.TEXTURE0 for 1st, gl.TEXTURE1 for 2nd, etc..
function createTexture(gl, map, elementID, textureNum) {
    gl.bindTexture(gl.TEXTURE_2D, map);
    //Below texParameteri's are changeable in the render loop
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById(elementID));
    gl.activeTexture(textureNum);
}
