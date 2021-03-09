var Splines = function(ctrlX = null, ctrlZ = null) {
    // initialize t to zero at start
    this.t = 0;

    // control points are stored in 2 arrays:
    this.ctrlX = [  1,  0,  1,  0]; // x coordinates
    this.ctrlZ = [  0,  1,  3,  1]; // z coordinates (most movement on zx-plane)

    // Task 1a: fill in the Bezier control matrix
    this.B = new SimpleMatrix(
      1,  0,  0,  0,
     -3,  3,  0,  0,
      3, -6,  3,  0,
     -1,  3, -3,  1);

    // precompute the polynomial coefficients (a_i) for the curve
    this.Ax = this.B.multiplyVector(this.ctrlX);
    this.Az = this.B.multiplyVector(this.ctrlZ);

}

Splines.prototype.setT = function(t)
{
    this.t += t;
}

/* Return an array [x, y] containing the coordinates of the point
 * on the curve at parameter value t using using direct evaluation. */
Splines.prototype.eval_direct = function() {
  // Task 1c: implement this method

  var px = this.Ax[0] + this.Ax[1]*this.t + this.Ax[2]*this.t*this.t + this.Ax[3]*this.t*this.t*this.t;
  var pz = this.Az[0] + this.Az[1]*this.t + this.Az[2]*this.t*this.t + this.Az[3]*this.t*this.t*this.t;

  return [px, pz];
}

/* Helper: return a linearly interpolated value between x and y.
 * Precondition: t is between 0 and 1. */
function lerp(x, z, t) {
    return (1-t) * x + t * z;
}

/* Return an array [x, y] containing the coordinates of the point on the
 * curve at parameter value t using using de Casteljau's algorithm.. */
Splines.prototype.eval_dcj = function(t) {
    // Task 2: complete this method. Remember that you don't need the control
    // matrix for this - it's just a sequence of linear interpolations.
    // I got it started for you:
    var cx = this.ctrlX;
    var cz = this.ctrlZ;
    var x12 = lerp(cx[0], cx[1], t);
    var y12 = lerp(cz[0], cz[1], t);
    // your code here
    var x23 = lerp(cx[1], cx[2], t);
    var y23 = lerp(cz[1], cz[2], t);
    var x34 = lerp(cx[2], cx[3], t);
    var y34 = lerp(cz[2], cz[3], t);

    var x123 = lerp(x12, x23, t);
    var y123 = lerp(y12, y23, t);
    var x234 = lerp(x23, x34, t);
    var y234 = lerp(y23, y34, t);

    var x1234 = lerp(x123, x234, t);
    var y1234 = lerp(y123, y234, t);

    return [x1234, y1234];
}

/* Helper: return the cosine of the angle at b formed by the points a, b, c */
function cos_angle(ax, ay, bx, by, cx, cy) {
    // compute a-b, c-b
    var bax = ax - bx;
    var bay = ay - by;
    var bcx = cx - bx;
    var bcy = cy - by;
    // normalize them
    var baMag = Math.sqrt(bax*bax + bay*bay);
    bax /= baMag;
    bay /= baMag;
    var bcMag = Math.sqrt(bcx*bcx + bcy*bcy);
    bcx /= bcMag;
    bcy /= bcMag;
    // I miss julia: dot(normalize(a-b), normalize(c-b))
    return bax * bcx + bay * bcy;
}

Splines.prototype.draw_dcj = function(context, cx, cy, maxDepth) {
    // base case - completed for you. If the curve is straight enough,
    // simply draw three line  segments connecting the four control points.
    var cos123 = cos_angle(cx[0], cy[0], cx[1], cy[1], cx[2], cy[2]);
    var cos234 = cos_angle(cx[1], cy[1], cx[2], cy[2], cx[3], cy[3]);

    if ((cos123 < -0.999 && cos234 < -0.999) || maxDepth <= 0) {
        context.moveTo(cx[0], cy[0]);
        context.lineTo(cx[1], cy[1]);
        context.lineTo(cx[2], cy[2]);
        context.lineTo(cx[3], cy[3]);
        return;
    }

    // Task 3 - using the curve's four points, subdivide the curve into two
    // sets of four new control points; then, recursively call this method on
    // each set of control points to draw a piecewise linear approximation of
    // each half. I got it started for you:
    var t = 0.5;

    var x12 = lerp(cx[0], cx[1], t);
    var y12 = lerp(cy[0], cy[1], t);
    // your code here
    var x23 = lerp(cx[1], cx[2], t);
    var y23 = lerp(cy[1], cy[2], t);
    var x34 = lerp(cx[2], cx[3], t);
    var y34 = lerp(cy[2], cy[3], t);

    var x123 = lerp(x12, x23, t);
    var y123 = lerp(y12, y23, t);
    var x234 = lerp(x23, x34, t);
    var y234 = lerp(y23, y34, t);

    var x1234 = lerp(x123, x234, t);
    var y1234 = lerp(y123, y234, t);

    var Lxc = [cx[0], x12, x123, x1234];
    var Lyc = [cy[0], y12, y123, y1234];

    var Rxc = [x1234, x234, x34, cx[3]];
    var Ryc = [y1234, y234, y34, cy[3]];

    this.draw_dcj(context, Lxc, Lyc, maxDepth-1);
    this.draw_dcj(context, Rxc, Ryc, maxDepth-1);
}

/***********************************************\
/* end of lab code; beginning of setup/UI code *|
\***********************************************/

Splines.prototype.startDrag = function(canvas, e) {
  rect = canvas.getBoundingClientRect();
  x = event.clientX - rect.left;
  y = event.clientY - rect.top;

  // find the closest control point to the mouse
  md = Infinity;
  for (i = 0; i < 4; i++) {
    cpx = this.ctrlX[i];
    cpy = this.ctrlY[i];
    d = (cpx - x)**2 + (cpy - y)**2;
    if (d < md) {
      md = d;
      mi = i;
    }
  }

  // update control point's position and set up for dragging
  this.dragIndex = mi;
  this.ctrlX[mi] = x;
  this.ctrlY[mi] = y;

  //console.log("start drag point " + mi);
  //canvas.addEventListener("mousemove", () => this.drag(canvas, e));
}

Splines.prototype.drag = function(canvas, e) {
  if (this.dragIndex >= 0) {
    rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    this.ctrlX[this.dragIndex] = x;
    this.ctrlY[this.dragIndex] = y;

  }
}

Splines.prototype.stopDrag = function(e) {
  this.dragIndex = -1;
}

function setup(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.log("Could not find canvas with id", canvasId);
        return;
    }

    var renderWidth, renderHeight;
    function computeCanvasSize() {
        renderWidth = Math.min(canvas.parentNode.clientWidth - 20, 820);
        renderHeight = Math.floor(renderWidth*9.0/16.0);
        canvas.width = renderWidth;
        canvas.height = renderHeight;
    }

    window.addEventListener('resize', computeCanvasSize);
    computeCanvasSize();

    var demo = new Splines(canvas);

    canvas.addEventListener('mousedown', function(e) { demo.startDrag(canvas, e); })
    canvas.addEventListener('mousemove', function(e) { demo.drag(canvas, e); })
    canvas.addEventListener('mouseup', function(e) { demo.stopDrag(canvas, e); })
    canvas.addEventListener('mouseout', function(e) { demo.stopDrag(canvas, e); })

    var renderLoop = function() {
        demo.render(canvas, renderWidth, renderHeight);
        window.requestAnimationFrame(renderLoop);
    }
    window.requestAnimationFrame(renderLoop);

    return demo;
}
