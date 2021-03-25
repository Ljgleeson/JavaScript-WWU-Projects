function rotateAroundAxisAtPoint(axis, angle, point)
{
    var mat = new SimpleMatrix();
    // TODO: Build a transformation matrix that rotates around a given axis
    //       by the given angle at the given point.
    //       Hint: You will need SimpleMatrix.translate and SimpleMatrix.rotate
    //       Hint: axis and point are arrays. Use axis[0], axis[1], etc.
    //             to get their components

// ################ Edit your code below
    //will need a combination of two translation matrices 
    //point ex: [7, 4.6, 0]
    var mat_trans = SimpleMatrix.translate(point[0],point[1],point[2]);
    var mat_trans_inv = SimpleMatrix.inverse(mat_trans);
    //rotation matrix 
    var rot = SimpleMatrix.rotate(angle,axis[0], axis[1], axis[2]);
    
    //following Similartiy transformations from slides: T = F * Tf * inv(f) 
    var calc = SimpleMatrix.multiply(rot, mat_trans_inv);
    mat = SimpleMatrix.multiply(mat_trans, calc);


// ################
    //return a transformation matrix that rotates around the given axis at the given point by the given angle 
    //rotating at a given point = the point itself is unchanged by the transformation matrix and all other points rotate around the point 
        //if transformed by the matrix 
    return mat;
}

var Task3 = function(canvas)
{
    this.mesh = new WireframeMesh_Two(WireCubePositions, WireCubeIndices);
    this.sphereMesh = new WireframeMesh_Two(SpherePositions, SphereIndices);
    this.cameraAngle = 0;
}

Task3.prototype.render = function(canvas, gl, w, h)
{
    var context = canvas.getContext('2d');
    clear(context, w, h);
    
    var projection = SimpleMatrix.perspective(45, w/h, 0.1, 100);
    
    var view = SimpleMatrix.rotate(this.cameraAngle, 1, 0, 0).multiply(
        SimpleMatrix.translate(0, 0, 30));

    var angle = Date.now()/10;
    var cameraView = SimpleMatrix.rotate(this.cameraAngle, 1, 0, 0);

    var sphereTransform1 = SimpleMatrix.translate( 7,  4.6, 0);
    var sphereTransform2 = SimpleMatrix.translate(-3, -2,   0);

    var cubeTransform1 = rotateAroundAxisAtPoint([ 1,  0, 0], angle, [ 7,  4.6, 0]);
    var cubeTransform2 = rotateAroundAxisAtPoint([ 0, -1, 0], angle, [ 7,  4.6, 0]);
    var cubeTransform3 = rotateAroundAxisAtPoint([ 0,  1, 0], angle, [-3, -2,   0]);
    var cubeTransform4 = rotateAroundAxisAtPoint([-1,  0, 0], angle, [-3, -2,   0]);

    this.mesh.render(canvas, cubeTransform1, view, projection);
    this.mesh.render(canvas, cubeTransform2, view, projection);
    this.mesh.render(canvas, cubeTransform3, view, projection);
    this.mesh.render(canvas, cubeTransform4, view, projection);

    this.sphereMesh.render(canvas, sphereTransform1, view, projection);
    this.sphereMesh.render(canvas, sphereTransform2, view, projection);
}

Task3.prototype.dragCamera = function(dy)
{
    this.cameraAngle = Math.min(Math.max(this.cameraAngle - dy*0.5, -90), 90);
}
