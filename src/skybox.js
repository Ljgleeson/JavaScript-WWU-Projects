/* skybox.js contains the the following definitions:

    Skybox = function(gl, vertexSource, fragmentSource)
    Skybox.prototype.render = function(gl, view, projection)
    function loadSkyBox(gl, sbFaces)
*/

var Skybox = function(gl, vertexSource, fragmentSource) {
  this.sbFaces =
    [
      document.getElementById("right"),
      document.getElementById("left"),
      document.getElementById("top"),
      document.getElementById("bottom"),
      document.getElementById("front"),
      document.getElementById("back"),
    ];
  this.positions = new Float32Array(
  [
     -1, -1,
      1, -1,
     -1,  1,
     -1,  1,
      1, -1,
      1,  1,
  ]);
  this.shaderProgram = createShaderProgram(gl, vertexSource, fragmentSource);
  //Finally load the skybox
  loadSkyBox(gl, this.sbFaces);
}

//This function sets the necessary buffers before drawing the skybox
Skybox.prototype.render = function(gl, view, projection) {
  gl.useProgram(this.shaderProgram);

  let vpInv = new SimpleMatrix();
  vpInv = SimpleMatrix.inverse(SimpleMatrix.multiply(projection, SimpleMatrix.inverse(view)));
  gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ViewProjInv"), false, vpInv.transpose().m);

  let positionVbo = createVertexBuffer(gl, this.positions);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionVbo);
  let positionAttrib = gl.getAttribLocation(this.shaderProgram, "Position");
  if (positionAttrib >= 0) {
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
  }

  let skyboxLocation = gl.getUniformLocation(this.shaderProgram, "sampler");
  gl.uniform1i(skyboxLocation, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function loadSkyBox(gl, sbFaces) {
  //Cube Constants values increment, so easy to start with right and just add 1 in a loop
  //To make the code easier costs by making the imgAry coming into the function to have
  //the images sorted in the same way the constants are set.
  //	TEXTURE_CUBE_MAP_POSITIVE_X - Right	:: TEXTURE_CUBE_MAP_NEGATIVE_X - Left
  //	TEXTURE_CUBE_MAP_POSITIVE_Y - Top 	:: TEXTURE_CUBE_MAP_NEGATIVE_Y - Bottom
  //	TEXTURE_CUBE_MAP_POSITIVE_Z - Back	:: TEXTURE_CUBE_MAP_NEGATIVE_Z - Front
  let tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP,tex);

  //push image to specific spot in the cube map.
  for(let i=0; i < 6; i++){
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sbFaces[i]);
  }

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return tex;
}
