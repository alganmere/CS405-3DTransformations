// js/bezier.js
// Cubic Bézier utilities: evaluation (De Casteljau) + sampling + simple VBO builder.

const Bezier = {
    // Evaluate cubic Bézier at t in [0,1] using De Casteljau (stable, readable)
    // P0..P3 are 2D points: [x, y]
    eval(P0, P1, P2, P3, t) {
      const lerp = (a, b, u) => [ a[0] + (b[0]-a[0]) * u, a[1] + (b[1]-a[1]) * u ];
      const A = lerp(P0, P1, t);
      const B = lerp(P1, P2, t);
      const C = lerp(P2, P3, t);
      const D = lerp(A, B, t);
      const E = lerp(B, C, t);
      const P = lerp(D, E, t);
      return P; // [x, y]
    },
  
    // Sample N points on the curve (returns Float32Array [x0,y0, x1,y1, ...])
    sample(P0, P1, P2, P3, N = 100) {
      const out = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const p = this.eval(P0, P1, P2, P3, t);
        out[i*2+0] = p[0];
        out[i*2+1] = p[1];
      }
      return out;
    }
  };
  
  window.Bezier = Bezier;
  