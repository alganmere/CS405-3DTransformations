// js/ui.js
// Wires HTML controls (sliders, buttons, toggles) to a shared App state used by render.js.

window.App = window.App || { state: null, hooks: {} };

(function setupUI() {
  // TRS
  const tx = document.getElementById('tx');
  const ty = document.getElementById('ty');
  const tz = document.getElementById('tz');
  const rz = document.getElementById('rz');
  const sx = document.getElementById('sx');
  const sy = document.getElementById('sy');
  const anim = document.getElementById('anim');
  const resetBtn = document.getElementById('resetBtn');

  const txv = document.getElementById('txv');
  const tyv = document.getElementById('tyv');
  const tzv = document.getElementById('tzv');
  const rzv = document.getElementById('rzv');
  const sxv = document.getElementById('sxv');
  const syv = document.getElementById('syv');

  // Viewing/Projection
  const fov = document.getElementById('fov');
  const fovv = document.getElementById('fovv');
  const usePerspective = document.getElementById('usePerspective');
  const bypassVP = document.getElementById('bypassVP');
  const showFrustum = document.getElementById('showFrustum'); // NEW

  // Bezier
  const showBezier = document.getElementById('showBezier');
  const bezierAnim = document.getElementById('bezierAnim');

  if (!App.state) {
    App.state = {
      // TRS
      tx: 0, ty: 0, tz: 0,
      rz: 0,               // radians
      sx: 1, sy: 1,
      animate: false,

      // Viewing/Projection
      fovDeg: 60,
      usePerspective: true,
      bypassVP: false,
      showFrustum: true,   // NEW

      // Bezier
      showBezier: true,
      bezierAnim: false
    };
  }

  function notify() {
    if (typeof App.hooks.onChange === 'function') App.hooks.onChange();
  }

  function updateStateFromUI() {
    // TRS
    App.state.tx = parseFloat(tx.value);
    App.state.ty = parseFloat(ty.value);
    App.state.tz = parseFloat(tz.value);
    App.state.rz = Mat4.Deg(parseFloat(rz.value));
    App.state.sx = parseFloat(sx.value);
    App.state.sy = parseFloat(sy.value);
    App.state.animate = !!anim.checked;

    // Viewing/Projection
    App.state.fovDeg = parseInt(fov.value, 10);
    App.state.usePerspective = !!usePerspective.checked;
    App.state.bypassVP = !!bypassVP.checked;
    App.state.showFrustum = !!showFrustum.checked; // NEW

    // Bezier
    App.state.showBezier = !!showBezier.checked;
    App.state.bezierAnim = !!bezierAnim.checked;

    // Labels
    txv.textContent = App.state.tx.toFixed(2);
    tyv.textContent = App.state.ty.toFixed(2);
    tzv.textContent = App.state.tz.toFixed(2);
    rzv.textContent = `${parseInt(rz.value, 10)}°`;
    sxv.textContent = App.state.sx.toFixed(2);
    syv.textContent = App.state.sy.toFixed(2);
    fovv.textContent = `${App.state.fovDeg}°`;

    notify();
  }

  [tx, ty, tz, rz, sx, sy, anim, fov, usePerspective, bypassVP, showFrustum, showBezier, bezierAnim].forEach(el => {
    el.addEventListener('input', updateStateFromUI);
    el.addEventListener('change', updateStateFromUI);
  });

  resetBtn.addEventListener('click', () => {
    tx.value = 0; ty.value = 0; tz.value = 0;
    rz.value = 0; sx.value = 1; sy.value = 1; anim.checked = false;
    fov.value = 60; usePerspective.checked = true; bypassVP.checked = false;
    showFrustum.checked = true; // NEW
    showBezier.checked = true; bezierAnim.checked = false;
    updateStateFromUI();
  });

  updateStateFromUI();
})();
