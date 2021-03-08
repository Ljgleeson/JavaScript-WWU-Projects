/* shadedTriangleMesh.js contains the the following definitions:

    var ShadedTriangleMesh = function(gl, vertexPositions, vertexUVs, vertexNormals, indices, vertexSource, fragmentSource)
    ShadedTriangleMesh.prototype.render = function(gl, model, view, projection)
    function createTexture(gl, map, elementID, textureNum()
*/

//This object stores the vertex data of an object mesh and the shader program to be used on it
    //img = array of string-id's for images
    var ShadedTriangleMesh = function(gl, vertexPositions, vertexUVs, vertexNormals, indices, vertexSource, fragmentSource, imgIDs) {
        // Create OpenGL buffers for the vertex, uvs, normals, and index data of the triangle mesh as needed
        this.positionVbo = createVertexBuffer(gl, vertexPositions);
        this.drawCount = vertexPositions.length
        if (vertexNormals != null)
            this.normalVbo = createVertexBuffer(gl, vertexNormals);
        if (vertexUVs != null)
            this.uvVbo = createVertexBuffer(gl,vertexUVs);
        if (imgIDs != null) {
            this.image = document.getElementById(imgIDs);
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
        var modelViewProjection = new SimpleMatrix();
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
    
            //TODO: change this.image to this.image(s) somehow
            let textures = loadTexture(gl, this.image);
    
            let u_image0Location = gl.getUniformLocation(this.shaderProgram, "sampler");
            gl.uniform1i(u_image0Location, 0);  // texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        }
    
        //For now this check lets us render objects indices and without
        if (this.indexCount > 0)
            gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        else
            gl.drawArrays(gl.TRIANGLES, 0, this.drawCount);
    }
    
    //Compared to other objects this one has static information so hard coding wouldnt be bad
    ShadedTriangleMesh.prototype.renderSkyBox = function(gl, view, projection) {
        gl.useProgram(this.shaderProgram);
    
        let mvpInv = new SimpleMatrix();
        mvpInv = SimpleMatrix.inverse(SimpleMatrix.multiply(projection, SimpleMatrix.inverse(view)));
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjInv"), false, mvpInv.transpose().m);
    
        /* Already defeined variables:
            Program = this.shaderProgram
            Positions = this.vertexPositions
            Normals = this.vertexNormals */
    
        //Handle the vertex variables
            // attribute vec4 Position; DONE?
            // varying vec4 vPosition; DONE
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVbo);
        let positionAttrib = gl.getAttribLocation(this.shaderProgram, "Position");
        if (positionAttrib >= 0) {
            gl.enableVertexAttribArray(positionAttrib);
            gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
        }
    
        let skyboxLocation = gl.getUniformLocation(this.shaderProgram, "sampler");
        gl.uniform1i(skyboxLocation, 0);
        loadSkyBox(gl);
    
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
    
    //This function loads a active texture into in GL from an image file
    //elementID: The id name of imported image in index.html
    //textureNum = gl.TEXTURE0 for 1st, gl.TEXTURE1 for 2nd, etc..
    function loadTexture(gl, images) {
        /*let len = images.length;
        if(len > gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS))
            console.error("Too many textures supplied")*/
        var textures = [];
        for (var i = 0; i < 2; ++i) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
    
            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
            // Upload the image into the texture
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images);
    
            // add the texture to the array of textures.
            textures.push(texture);
        }
    
        return textures;
    }
    
    function loadSkyBox(gl) {
    
        //Cube Constants values increment, so easy to start with right and just add 1 in a loop
        //To make the code easier costs by making the imgAry coming into the function to have
        //the images sorted in the same way the constants are set.
        //	TEXTURE_CUBE_MAP_POSITIVE_X - Right	:: TEXTURE_CUBE_MAP_NEGATIVE_X - Left
        //	TEXTURE_CUBE_MAP_POSITIVE_Y - Top 	:: TEXTURE_CUBE_MAP_NEGATIVE_Y - Bottom
        //	TEXTURE_CUBE_MAP_POSITIVE_Z - Back	:: TEXTURE_CUBE_MAP_NEGATIVE_Z - Front
        var sbFaces =
          [
            document.getElementById("right"),
            document.getElementById("left"),
            document.getElementById("top"),
            document.getElementById("bottom"),
            document.getElementById("front"),
            document.getElementById("back"),
          ];
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP,tex);
    
        //push image to specific spot in the cube map.
        for(var i=0; i < 6; i++){
             gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sbFaces[i]);
        }
    
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
        return tex;
    }
    