// js/projection.js
// Perspective and orthographic projection matrices (column-major)

const Projection = {
    // fovY: radians, aspect: w/h, near>0, far>near
    perspective(fovY, aspect, near, far) {
      const f = 1.0 / Math.tan(fovY * 0.5);
      const nf = 1.0 / (near - far);
      const m = new Float32Array(16);
      m[0]  = f / aspect;
      m[5]  = f;
      m[10] = (far + near) * nf;
      m[11] = -1;
      m[14] = (2 * far * near) * nf;
      m[15] = 0;
      return m;
    },
    // Orthographic box: left, right, bottom, top, near, far
    orthographic(l, r, b, t, n, f) {
      const m = new Float32Array(16);
      m[0]  = 2 / (r - l);
      m[5]  = 2 / (t - b);
      m[10] = -2 / (f - n);
      m[12] = -(r + l) / (r - l);
      m[13] = -(t + b) / (t - b);
      m[14] = -(f + n) / (f - n);
      m[15] = 1;
      return m;
    }
  };
  
  window.Projection = Projection;
  