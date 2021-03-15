/* shadedTriangleMesh.js contains the the following definitions:

    var ShadedTriangleMesh = function(gl, vertexPositions, vertexUVs, vertexNormals, indices, vertexSource, fragmentSource)
    ShadedTriangleMesh.prototype.render = function(gl, model, view, projection)
    function loadTexture(gl, images)
*/
const samplers = ["sampler", "sampler2"];

//This object stores the vertex data of an object mesh and the shader program to be used on it
//img = array of string-id's for images
var ShadedTriangleMesh = function(gl, vertexPositions, vertexUVs, vertexNormals, indices, vertexSource, fragmentSource, imgIDs) {
    // Create OpenGL buffers for the vertex, uvs, normals, and index data of the triangle mesh as needed
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    this.drawCount = vertexPositions.length
    if (vertexNormals != null)
        this.normalVbo = createVertexBuffer(gl, vertexNormals);
    if (vertexUVs != null) {
        this.uvVbo = createVertexBuffer(gl,vertexUVs);

        //A second image means use normals
        if (imgIDs.length > 1) {
            //Generate the tangents and bitangents for use with normal maps
            //Store them in the same order as the positions
            //[t1, t2, etc]
            let tangents = [];
            //[b1, b2, etc]
            let bitangents = [];
            //These contain the tangents or the bitangents respectively for every vertex,
            let triCount = this.drawCount/9
            for (let i = 0;i<triCount;i++) {
                //tri: a = i, b = i+1, c = i+2

                //Now find the dU and dV for each side
                //Each triangle consumes 6 length of the uv array
                let uv = 6*i;
                //dUV1 = p2-p1
                let dU1 = vertexUVs[uv+2] - vertexUVs[uv];
                //dUV2 = p3-p1
                let dU2 = vertexUVs[uv+4] - vertexUVs[uv];
                let dV1 = vertexUVs[uv+3] - vertexUVs[uv+1];
                let dV2 = vertexUVs[uv+5] - vertexUVs[uv+1];

                //Calculate edge1 and edge2 using vertexPositions
                //Each triangle consumes 9 length of the pos array
                let p = 9*i;
                //e1 = p2-p1
                let x1 = vertexPositions[p+3] - vertexPositions[p];
                let y1 = vertexPositions[p+4] - vertexPositions[p+1];
                let z1 = vertexPositions[p+5] - vertexPositions[p+2];
                //e2 = p3-p1
                let x2 = vertexPositions[p+6] - vertexPositions[p];
                let y2 = vertexPositions[p+7] - vertexPositions[p+1];
                let z2 = vertexPositions[p+8] - vertexPositions[p+2];

                //Calculate tangents from above
                //T = dV2*Ee1 + -dV1*e2
                let tx = dV2*x1 + -dV1*x2;
                let ty = dV2*y1 + -dV1*y2;
                let tz = dV2*z1 + -dV1*z2;

                //Calculate the bitangents
                //B = -dU2*e1 + dU1*e2
                let bx = -dU2*x1 + dU1*x2;
                let by = -dU2*y1 + dU1*y2;
                let bz = -dU2*z1 + dU1*z2;
                
                //Store the values for each vertex in the triangle
                for(let j=0;j<3;j++) {
                    //push the x, y, then z values for the vertex
                    tangents.push(tx);
                    tangents.push(ty);
                    tangents.push(tz);
                    bitangents.push(bx);
                    bitangents.push(by);
                    bitangents.push(bz);
                }
            }
            //Theses values are currently in terms of model space
            this.tanVbo = createVertexBuffer(gl, tangents);
            this.bitVbo = createVertexBuffer(gl, bitangents);
        }
    }
    if (imgIDs != null) {
        this.textures = [];
        for (let i=0; i<imgIDs.length; i++) {
          this.textures.push(loadTexture(gl,
              document.getElementById(imgIDs[i])));
        }
    }
    if (indices!= null) {
        this.indexCount = indices.length;
        this.indexIbo = createIndexBuffer(gl, indices);
    } else {
        this.indexCount = 0;
    }
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
    let modelViewProjection = new SimpleMatrix();
    modelViewProjection = SimpleMatrix.multiply(SimpleMatrix.inverse(view),model);
    modelViewProjection = SimpleMatrix.multiply(projection,modelViewProjection);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "Model"), false, model.transpose().m);

    // OpenGL setup beyond this point
    if (this.indexIbo != null)
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
        gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, true, 0, 0);
    }

    if (this.uvVbo != null) {
        //Create textures for each image map (currently only one works at a time for some reason)
          //This is for the diffuse map
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVbo);
        var textCoordAttrib = gl.getAttribLocation(this.shaderProgram, "UV");
        if (textCoordAttrib >= 0) {
            gl.enableVertexAttribArray(textCoordAttrib);
            gl.vertexAttribPointer(textCoordAttrib, 2, gl.FLOAT, false, 0, 0);
        }

        for(var i=0; i<this.textures.length;i++) {
            let sampler = gl.getUniformLocation(this.shaderProgram, samplers[i]);
            gl.uniform1i(sampler, i);  // texture unit 0
            gl.activeTexture(gl.TEXTURE0+i);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
        }

        //pass in the tan and bit attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tanVbo);
        var positionAttrib = gl.getAttribLocation(this.shaderProgram, "Tangent");
        if (positionAttrib >= 0) {
            gl.enableVertexAttribArray(positionAttrib);
            gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitVbo);
        var positionAttrib = gl.getAttribLocation(this.shaderProgram, "Bitangent");
        if (positionAttrib >= 0) {
            gl.enableVertexAttribArray(positionAttrib);
            gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
        }
    }

    //For now this check lets us render objects indices and without
    if (this.indexCount > 0)
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    else
        gl.drawArrays(gl.TRIANGLES, 0, this.drawCount);
}

//This function loads a active texture into in GL from an image file
//elementID: The id name of imported image in index.html
//textureNum = gl.TEXTURE0 for 1st, gl.TEXTURE1 for 2nd, etc..
function loadTexture(gl, image) {
    /*let len = images.length;
    if(len > gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS))
        console.error("Too many textures supplied")*/
        
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload the image into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    return texture;
}
