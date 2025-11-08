// js/render.js
// Triangle + Bézier + Frustum overlay (VIEW-space preview).
// Requires: math.js, camera.js, projection.js, bezier.js, ui.js

window.addEventListener('load', main);

// Projeksiyon parametreleri tek yerde dursun ki frustum ile P her zaman uyumlu kalsın
const PROJ = { NEAR: 0.1, FAR: 100 };

function main() {
  window.App = window.App || {};
  App.state = App.state || {
    // TRS
    tx: 0, ty: 0, tz: 0,
    rz: 0,
    sx: 1, sy: 1,
    animate: false,
    // Viewing / Projection
    fovDeg: 60,
    usePerspective: true,
    bypassVP: false,
    showFrustum: true,
    // Bézier
    showBezier: true,
    bezierAnim: false
  };

  const canvas = document.getElementById('glcanvas');
  resizeCanvasToDisplaySize(canvas);

  const gl = canvas.getContext('webgl', { alpha: false, antialias: true, depth: true });
  if (!gl) { alert('WebGL not supported.'); return; }

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.2, 0.4, 0.8, 1.0);
  gl.clearDepth(1.0);

  // --- Program A (triangle & Bézier): vec2 position ---
  const vsA = `
    attribute vec2 a_pos;
    uniform   mat4 u_MVP;
    void main() { gl_Position = u_MVP * vec4(a_pos, 0.0, 1.0); }
  `;
  const fsA = `
    precision mediump float;
    void main() { gl_FragColor = vec4(1.0, 0.85, 0.20, 1.0); }
  `;
  const progA = createProgram(gl, vsA, fsA);
  const locA = {
    a_pos: gl.getAttribLocation(progA, 'a_pos'),
    u_MVP: gl.getUniformLocation(progA, 'u_MVP')
  };

  // --- Program B (frustum lines): vec3 position ---
  const vsB = `
    attribute vec3 a_pos3;
    uniform   mat4 u_MVP;
    void main() { gl_Position = u_MVP * vec4(a_pos3, 1.0); }
  `;
  const fsB = `
    precision mediump float;
    void main() { gl_FragColor = vec4(0.08, 1.0, 0.50, 0.95); } // parlak yeşil
  `;
  const progB = createProgram(gl, vsB, fsB);
  const locB = {
    a_pos3: gl.getAttribLocation(progB, 'a_pos3'),
    u_MVP:  gl.getUniformLocation(progB, 'u_MVP')
  };

  // Buffers
  const vboTri = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboTri);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0,  0.6,
   -0.6, -0.4,
    0.6, -0.4
  ]), gl.STATIC_DRAW);

  const vboBezier = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboBezier);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    Bezier.sample([-0.8,-0.6],[-0.2,0.8],[0.2,-0.8],[0.8,0.6], 120),
    gl.DYNAMIC_DRAW
  );

  const vboDot = gl.createBuffer();
  const dotGeom = new Float32Array([ 0, 0.02, -0.015, -0.01, 0.015, -0.01 ]);

  const vboFrustum = gl.createBuffer(); // her kare güncellenir

  App.hooks = App.hooks || {};
  App.hooks.onChange = () =>
    draw(gl, { progA, locA, progB, locB, vboTri, vboBezier, vboDot, dotGeom, vboFrustum });

  let tAnim = 0;
  function frame() {
    if (App.state.animate) App.state.rz += 0.01;
    if (App.state.bezierAnim) tAnim = (tAnim + 0.004) % 1.0;
    draw(gl, { progA, locA, progB, locB, vboTri, vboBezier, vboDot, dotGeom, vboFrustum, tAnim });
    requestAnimationFrame(frame);
  }
  draw(gl, { progA, locA, progB, locB, vboTri, vboBezier, vboDot, dotGeom, vboFrustum, tAnim: 0 });
  frame();

  window.addEventListener('resize', () => {
    resizeCanvasToDisplaySize(canvas);
    draw(gl, { progA, locA, progB, locB, vboTri, vboBezier, vboDot, dotGeom, vboFrustum, tAnim });
  });
}

function buildVP(gl) {
  if (App.state.bypassVP) {
    return {
      V: Mat4.identity(),
      P: Mat4.identity(),
      eye: [0, 0, 0],
      target: [0, 0, -1],
      up: [0, 1, 0]
    };
  }
  const eye = [0,0,2], target = [0,0,0], up = [0,1,0];
  const V = Camera.lookAt(eye, target, up);
  const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;

  if (App.state.usePerspective) {
    const fovRad = App.state.fovDeg * Math.PI / 180; // açıkça çevir
    const P = Projection.perspective(fovRad, aspect, PROJ.NEAR, PROJ.FAR);
    return { V, P, eye, target, up };
  } else {
    const halfY = 1, halfX = halfY * aspect;
    const P = Projection.orthographic(-halfX, halfX, -halfY, halfY, PROJ.NEAR, PROJ.FAR);
    return { V, P, eye, target, up };
  }
}

function draw(gl, h) {
  const { progA, locA, progB, locB, vboTri, vboBezier, vboDot, dotGeom, vboFrustum, tAnim=0 } = h;
  const vp = buildVP(gl);
  const s = App.state;

  const M  = Mat4.compose({ t:[s.tx,s.ty,s.tz], r:[0,0,s.rz], s:[s.sx,s.sy,1] });
  const MV = Mat4.multiply(vp.V, M);
  const MVP= Mat4.multiply(vp.P, MV);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // --- Program A: triangle + Bézier ---
  gl.useProgram(progA);
  gl.uniformMatrix4fv(locA.u_MVP, false, MVP);

  gl.bindBuffer(gl.ARRAY_BUFFER, vboTri);
  gl.vertexAttribPointer(locA.a_pos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(locA.a_pos);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  if (s.showBezier) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vboBezier);
    gl.vertexAttribPointer(locA.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, 120);

    if (s.bezierAnim) {
      const p = Bezier.eval([-0.8,-0.6],[-0.2,0.8],[0.2,-0.8],[0.8,0.6], tAnim);
      const Mdot = Mat4.compose({ t:[p[0], p[1], 0], s:[0.5,0.5,1] });
      const MVPdot = Mat4.multiply(vp.P, Mat4.multiply(vp.V, Mdot));
      gl.uniformMatrix4fv(locA.u_MVP, false, MVPdot);

      gl.bindBuffer(gl.ARRAY_BUFFER, vboDot);
      gl.bufferData(gl.ARRAY_BUFFER, dotGeom, gl.STATIC_DRAW);
      gl.vertexAttribPointer(locA.a_pos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.uniformMatrix4fv(locA.u_MVP, false, MVP);
    }
  }

  // --- Program B: frustum overlay (only when VP active) ---
  if (s.showFrustum && !s.bypassVP) {
    gl.useProgram(progB);

    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const farVis = 8.0; // görsel için kısa far
    const near = PROJ.NEAR;
    const far  = Math.min(farVis, PROJ.FAR);

    const linesPreview = s.usePerspective
      ? buildFrustumPerspectivePreview(s.fovDeg * Math.PI / 180, aspect, near, far)
      : buildFrustumOrthoPreview(aspect, near, far);

    gl.uniformMatrix4fv(locB.u_MVP, false, Mat4.identity());

    gl.bindBuffer(gl.ARRAY_BUFFER, vboFrustum);
    gl.bufferData(gl.ARRAY_BUFFER, linesPreview, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(locB.a_pos3, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locB.a_pos3);

    // üstte görünmesi için kısa süreli overlay ayarı
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.LINES, 0, linesPreview.length / 3);

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);

    // program A'ya dön
    gl.useProgram(progA);
    gl.uniformMatrix4fv(locA.u_MVP, false, MVP);
  }
}

/* ------------ frustum helpers (VIEW-space preview) ------------ */
function buildFrustumPerspectivePreview(fovRad, aspect, near, far) {
  const hn = Math.tan(fovRad * 0.5) * near;
  const wn = hn * aspect;
  const hf = Math.tan(fovRad * 0.5) * far;
  const wf = hf * aspect;

  const C = [
    [-wn,  hn, -near], [ wn,  hn, -near], [ wn, -hn, -near], [-wn, -hn, -near], // near
    [-wf,  hf, -far ], [ wf,  hf, -far ], [ wf, -hf, -far ], [-wf, -hf, -far ]  // far
  ];
  return normaliseFrustumLines(C, near, far);
}

function buildFrustumOrthoPreview(aspect, near, far) {
  const halfY = 1;
  const halfX = halfY * aspect;

  const C = [
    [-halfX,  halfY, -near], [ halfX,  halfY, -near], [ halfX, -halfY, -near], [-halfX, -halfY, -near],
    [-halfX,  halfY, -far ], [ halfX,  halfY, -far ], [ halfX, -halfY, -far ], [-halfX, -halfY, -far ]
  ];
  return normaliseFrustumLines(C, near, far);
}

function normaliseFrustumLines(C, near, far) {
  const L = [];
  const nfSpan = Math.max(far - near, 1e-5);
  const invFar = 1 / Math.max(far, 1e-5);
  const map = (p) => {
    const depth = -p[2]; // positive forward
    const t = (depth - near) / nfSpan; // 0 at near, 1 at far
    const z = 1 - 2 * t; // near -> 1, far -> -1
    return [
      p[0] * invFar,
      p[1] * invFar,
      z
    ];
  };

  const e=(i,j)=>{
    const a = map(C[i]);
    const b = map(C[j]);
    L.push(a[0],a[1],a[2], b[0],b[1],b[2]);
  };
  // near
  e(0,1); e(1,2); e(2,3); e(3,0);
  // far
  e(4,5); e(5,6); e(6,7); e(7,4);
  // connectors
  e(0,4); e(1,5); e(2,6); e(3,7);
  return new Float32Array(L);
}

/* ------------ boilerplate utils ------------ */
function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile error:\n' + log);
  }
  return sh;
}
function createProgram(gl, vsSrc, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error('Program link error:\n' + log);
  }
  gl.detachShader(prog, vs); gl.deleteShader(vs);
  gl.detachShader(prog, fs); gl.deleteShader(fs);
  return prog;
}
function resizeCanvasToDisplaySize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
}