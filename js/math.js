// js/math.js
// Basic 4x4 matrix utilities (column-major, Float32Array) for WebGL
// Each function returns a Float32Array(16) matrix compatible with GLSL uniform mat4

const Deg = d => d * Math.PI / 180;  // Converts degrees to radians

const Mat4 = {
  // Returns 4x4 identity matrix
  identity() {
    const m = new Float32Array(16);
    m[0]=1; m[5]=1; m[10]=1; m[15]=1;
    return m;
  },

  // Matrix multiplication: C = A * B  (column-major order)
  multiply(A, B) {
    const C = new Float32Array(16);
    for (let i = 0; i < 4; i++) {  // iterate over B's columns
      const bi0 = B[i*4+0], bi1 = B[i*4+1], bi2 = B[i*4+2], bi3 = B[i*4+3];
      C[i*4+0] = A[0]*bi0 + A[4]*bi1 + A[8]*bi2 + A[12]*bi3;
      C[i*4+1] = A[1]*bi0 + A[5]*bi1 + A[9]*bi2 + A[13]*bi3;
      C[i*4+2] = A[2]*bi0 + A[6]*bi1 + A[10]*bi2 + A[14]*bi3;
      C[i*4+3] = A[3]*bi0 + A[7]*bi1 + A[11]*bi2 + A[15]*bi3;
    }
    return C;
  },

  // Translation matrix
  translation(tx, ty, tz) {
    const m = Mat4.identity();
    m[12] = tx; m[13] = ty; m[14] = tz;
    return m;
  },

  // Scaling matrix
  scaling(sx, sy, sz) {
    const m = new Float32Array(16);
    m[0]=sx; m[5]=sy; m[10]=sz; m[15]=1;
    return m;
  },

  // Rotation around X axis
  rotationX(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = Mat4.identity();
    m[5]=c; m[6]=s; m[9]=-s; m[10]=c;
    return m;
  },

  // Rotation around Y axis
  rotationY(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = Mat4.identity();
    m[0]=c; m[2]=-s; m[8]=s; m[10]=c;
    return m;
  },

  // Rotation around Z axis
  rotationZ(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = Mat4.identity();
    m[0]=c; m[1]=s; m[4]=-s; m[5]=c;
    return m;
  },

  // Compose transformation: M = T * Rz * Ry * Rx * S
  // Applied in order: Scale → RotateX → RotateY → RotateZ → Translate
  compose({ t=[0,0,0], r=[0,0,0], s=[1,1,1] } = {}) {
    const T = Mat4.translation(t[0], t[1], t[2]);
    const RX = Mat4.rotationX(r[0]);
    const RY = Mat4.rotationY(r[1]);
    const RZ = Mat4.rotationZ(r[2]);
    const S  = Mat4.scaling(s[0], s[1], s[2]);

    // Rightmost matrix is applied first (WebGL convention)
    return Mat4.multiply(
      Mat4.multiply(
        Mat4.multiply(
          Mat4.multiply(T, RZ),
          RY
        ),
        RX
      ),
      S
    );
  },

  Deg
};

// Export to global scope
window.Mat4 = Mat4;
