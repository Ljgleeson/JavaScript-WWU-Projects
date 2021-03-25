var WireframeMesh_Two = function(vertexPositions, indices)
{
    this.positions = vertexPositions;
    this.indices = indices;
}

WireframeMesh_Two.prototype.vertex = function(index)
{
    return [this.positions[3*index], this.positions[3*index+1], this.positions[3*index+2]];
}

WireframeMesh_Two.prototype.render = function(canvas, model, view, projection)
{
    var context = canvas.getContext('2d');
        
    // TODO: Assemble the model-view-projection matrix.
    //       Multiplying a point by the model-view-projection matrix
    //       should be equivalent to multiplying it by the model matrix,
    //       then the inverse view matrix, then the projection matrix
    //  
    // Hint: You can use matrix.inverse() to get the inverse of a matrix
// ################ Edit your code below
    var modelViewProjectionMatrix = new SimpleMatrix();
// ################
    //task 1: combine the given matrices into a model-view-projection matrix 
    var inv_view = SimpleMatrix.inverse(view);
    modelViewProjectionMatrix = modelViewProjectionMatrix.multiply(projection);
    modelViewProjectionMatrix = modelViewProjectionMatrix.multiply(inv_view);
    modelViewProjectionMatrix = modelViewProjectionMatrix.multiply(model);

    context.beginPath();
    for (var i = 0; i < this.indices.length; i+=2)
    {
        var index1 = this.indices[i];
        var index2 = this.indices[i+1];

        var xyz1 = this.vertex(index1);
        var xyz2 = this.vertex(index2);

// ################ Edit your code below
        // TODO: Apply the model-view-projection transform matrix to every vertex
        xyz1 = modelViewProjectionMatrix.multiplyVector(xyz1);
        xyz2 = modelViewProjectionMatrix.multiplyVector(xyz2);
        //then do perspective division as you did in task 1.
        xyz1[0] = xyz1[0]/xyz1[2];  //x1 / z1 
        xyz1[1] = xyz1[1]/xyz1[2];  //y1 / z1
        xyz2[0] = xyz2[0]/xyz2[2];  //x2 / z2
        xyz2[1] = xyz2[1]/xyz2[2];  //y2 / z2
        var xy1 = [xyz1[0], xyz1[1]];
        var xy2 = [xyz2[0], xyz2[1]];
// ################


        // projected points scaled and centered within the canvas
        var aspect = canvas.width/canvas.height;
        var uv1 = [(xy1[0] + 1.0)*0.5*canvas.width, (-xy1[1] + 1.0)*0.5*canvas.height];
        var uv2 = [(xy2[0] + 1.0)*0.5*canvas.width, (-xy2[1] + 1.0)*0.5*canvas.height];

        // draw the line segment
        context.moveTo(uv1[0], uv1[1]);
        context.lineTo(uv2[0], uv2[1]);
    }
    context.stroke();
}

var Task2 = function(canvas)
{
    this.mesh1 = new WireframeMesh_Two(WireCubePositions, WireCubeIndices);
    this.mesh2 = new WireframeMesh_Two(WireCubePositions, WireCubeIndices);
    this.mesh3 = new WireframeMesh_Two(SpherePositions, SphereIndices);
    this.cameraAngle = 0;
}

function clear(context, w, h)
{
    context.fillStyle = "white";
    context.fillRect(0, 0, w, h);
}

Task2.prototype.render = function(canvas, gl, w, h)
{
    var time = Date.now()/1000;
    var cosTime = Math.cos(time);
    var sinTime = Math.sin(time);

    var context = canvas.getContext('2d');
    clear(context, w, h);
    
    var projection = SimpleMatrix.perspective(45, w/h, 0.1, 100);
    
    var view = SimpleMatrix.rotate(this.cameraAngle, 1, 0, 0).multiply(
        SimpleMatrix.translate(0, 0, 8));
        
    var modelMatrix1 = SimpleMatrix.scale(Math.abs(cosTime), Math.abs(cosTime), 1);
    var modelMatrix2 = SimpleMatrix.translate(-3, 0, 0).multiply(SimpleMatrix.translate(sinTime, cosTime, 0));
    var modelMatrix3 = SimpleMatrix.translate(3, 0, 0).multiply(SimpleMatrix.rotate(time*30, 1, 1, 1));

    this.mesh1.render(canvas, modelMatrix1, view, projection);
    this.mesh2.render(canvas, modelMatrix2, view, projection);
    this.mesh3.render(canvas, modelMatrix3, view, projection);
}

Task2.prototype.dragCamera = function(dy)
{
    this.cameraAngle = Math.min(Math.max(this.cameraAngle - dy*0.5, -90), 90);
}
