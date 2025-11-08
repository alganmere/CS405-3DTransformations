// js/camera.js
// Minimal right-handed lookAt view matrix (column-major)

const Camera = {
    _norm(v) {
      const len = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0]/len, v[1]/len, v[2]/len];
    },
    _cross(a, b) {
      return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0],
      ];
    },
    _dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; },
  
    // eye: [ex,ey,ez], target: [tx,ty,tz], up: [ux,uy,uz]
    lookAt(eye, target, up) {
      // Camera basis (right-handed):
      // n = normalize(eye - target), u = normalize(cross(up, n)), v = cross(n, u)
      const n = this._norm([eye[0]-target[0], eye[1]-target[1], eye[2]-target[2]]);
      const u = this._norm(this._cross(up, n));
      const v = this._cross(n, u);
  
      // View matrix (column-major)
      const m = Mat4.identity();
      m[0] = u[0]; m[1] = v[0]; m[2]  = n[0]; m[3]  = 0;
      m[4] = u[1]; m[5] = v[1]; m[6]  = n[1]; m[7]  = 0;
      m[8] = u[2]; m[9] = v[2]; m[10] = n[2]; m[11] = 0;
      m[12] = -this._dot(u, eye);
      m[13] = -this._dot(v, eye);
      m[14] = -this._dot(n, eye);
      m[15] = 1;
      return m;
    }
  };
  
  window.Camera = Camera;
  