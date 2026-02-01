let canvas, gl;

let a_Position;
let uModelMatrix;
let uGlobalRotation;
let uFragColor;

let gAnimalGlobalRotation = 0;
let gJoint1 = 0;
let gJoint2 = 0;

let gAnimationOn = false;
let gSeconds = 0;

let gCubeVBO = null;

let gLastTimeMS = 0;
let gFPSCounterTime = 0;
let gFrames = 0;
let gLastPerfMS = 0;

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 uModelMatrix;
  uniform mat4 uGlobalRotation;

  void main() {
    gl_Position = uGlobalRotation * uModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 uFragColor;

  void main() {
    gl_FragColor = uFragColor;
  }
`;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initCubeBuffer();

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  renderScene();

  gLastTimeMS = performance.now();
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get WebGL context.");
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to init shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  uModelMatrix = gl.getUniformLocation(gl.program, "uModelMatrix");
  uGlobalRotation = gl.getUniformLocation(gl.program, "uGlobalRotation");
  uFragColor = gl.getUniformLocation(gl.program, "uFragColor");

  if (a_Position < 0 || !uModelMatrix || !uGlobalRotation || !uFragColor) {
    console.log("Failed to get shader variable locations.");
    return;
  }
}

function tick(nowMS) {
  const dt = (nowMS - gLastTimeMS) / 1000.0;
  gLastTimeMS = nowMS;
  gSeconds += dt;

  if (gAnimationOn) {
    updateAnimationAngles();
  }

  renderScene();
  updatePerf(nowMS);

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  gJoint1 = 28 * Math.sin(gSeconds * 2.0);
  gJoint2 = 18 * Math.sin(gSeconds * 2.0 + 1.0);
}

function drawCamelLeg(parentFrame, hipX, hipZ, useSliders, phase) {
  const thighH = 0.28, thighW = 0.07, thighD = 0.07;
  const calfH  = 0.24, calfW  = 0.06, calfD  = 0.06;
  const footH  = 0.05, footW  = 0.08, footL  = 0.18;

  const sideSign = (hipZ >= 0) ? 1 : -1;
  const frontSign = (hipX > 0) ? 1 : -1;

  const hip = new Matrix4(parentFrame);
  hip.translate(hipX, -0.10, hipZ);
  hip.rotate(90, 0, 1, 0);

  let a1 = useSliders ? gJoint1 : 12 * Math.sin(gSeconds * 2.0 + phase);
  let a2 = useSliders ? gJoint2 : 10 * Math.sin(gSeconds * 2.0 + 1.0 + phase);

  a1 *= frontSign;
  a2 *= -frontSign;

  const thighJoint = new Matrix4(hip);
  thighJoint.rotate(a1, 1, 0, 0);

  const thighShape = new Matrix4(thighJoint);
  thighShape.translate(0, -thighH / 2, 0);
  thighShape.scale(thighW, thighH, thighD);
  drawCube(thighShape, [0.72, 0.60, 0.40, 1]);

  const knee = new Matrix4(thighJoint);
  knee.translate(0, -thighH, 0);
  knee.rotate(a2, 1, 0, 0);

  const calfShape = new Matrix4(knee);
  calfShape.translate(0, -calfH / 2, 0);
  calfShape.scale(calfW, calfH, calfD);
  drawCube(calfShape, [0.68, 0.56, 0.38, 1]);

  const ankle = new Matrix4(knee);
  ankle.translate(0, -calfH, 0);

  const footShape = new Matrix4(ankle);
  footShape.rotate(-90, 0, 1, 0);
  footShape.translate(footL * 0.35, -footH / 2, 0.02 * sideSign);
  footShape.scale(footL, footH, footW);

  drawCube(footShape, [0.55, 0.45, 0.30, 1]);
}

function renderScene() {
  const globalRotEl = document.getElementById("globalRotVal");
  const joint1El = document.getElementById("joint1Val");
  const joint2El = document.getElementById("joint2Val");
  if (globalRotEl) globalRotEl.textContent = String(Math.round(gAnimalGlobalRotation));
  if (joint1El) joint1El.textContent = String(Math.round(gJoint1));
  if (joint2El) joint2El.textContent = String(Math.round(gJoint2));

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const globalRot = new Matrix4();
  globalRot.rotate(gAnimalGlobalRotation, 0, 1, 0);
  gl.uniformMatrix4fv(uGlobalRotation, false, globalRot.elements);

  const bodyFrame = new Matrix4();
  bodyFrame.translate(0.0, 0.05, 0.0);

  const body = new Matrix4(bodyFrame);
  body.scale(0.75, 0.28, 0.28);
  drawCube(body, [0.78, 0.66, 0.44, 1]);

  const hump1Frame = new Matrix4(bodyFrame);
  hump1Frame.translate(-0.15, 0.18, 0.0);

  const hump1 = new Matrix4(hump1Frame);
  hump1.scale(0.28, 0.20, 0.22);
  drawCube(hump1, [0.75, 0.62, 0.42, 1]);

  const hump2Frame = new Matrix4(bodyFrame);
  hump2Frame.translate(0.18, 0.16, 0.0);

  const hump2 = new Matrix4(hump2Frame);
  hump2.scale(0.26, 0.18, 0.20);
  drawCube(hump2, [0.74, 0.61, 0.41, 1]);

  const neckBase = new Matrix4(bodyFrame);
  neckBase.translate(0.32, 0.10, 0.0);
  neckBase.rotate(-18, 0, 0, 1);

  const neck = new Matrix4(neckBase);
  neck.translate(0.12, 0.12, 0.0);
  neck.scale(0.18, 0.30, 0.16);
  drawCube(neck, [0.78, 0.66, 0.44, 1]);

  const headBase = new Matrix4(neckBase);
  headBase.translate(0.26, 0.26, 0.0);

  const head = new Matrix4(headBase);
  head.scale(0.18, 0.16, 0.16);
  drawCube(head, [0.70, 0.58, 0.38, 1]);

  const snout = new Matrix4(headBase);
  snout.translate(0.18, -0.02, 0.0);
  snout.scale(0.20, 0.10, 0.12);
  drawCube(snout, [0.66, 0.54, 0.36, 1]);

  const tailBase = new Matrix4(bodyFrame);
  tailBase.translate(-0.36, 0.08, 0.0);
  tailBase.rotate(gAnimationOn ? (12 * Math.sin(gSeconds * 3.0)) : 0, 0, 0, 1);

  const tail = new Matrix4(tailBase);
  tail.translate(-0.12, -0.02, 0.0);
  tail.scale(0.22, 0.06, 0.06);
  drawCube(tail, [0.62, 0.50, 0.34, 1]);

  drawCamelLeg(bodyFrame,  0.30,  0.12, true,  0.0);
  drawCamelLeg(bodyFrame,  0.30, -0.12, false, 1.0);
  drawCamelLeg(bodyFrame, -0.30,  0.12, false, 2.0);
  drawCamelLeg(bodyFrame, -0.30, -0.12, false, 3.0);
}

function initCubeBuffer() {
  const v = new Float32Array([
    -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
    -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5,-0.5,-0.5,
    -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
    -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,
     0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
     0.5,-0.5,-0.5,   0.5, 0.5, 0.5,   0.5,-0.5, 0.5,
    -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5
  ]);

  gCubeVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gCubeVBO);
  gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function drawCube(M, colorRGBA) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gCubeVBO);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniformMatrix4fv(uModelMatrix, false, M.elements);
  gl.uniform4fv(uFragColor, new Float32Array(colorRGBA));

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function initShaders(gl, vsrc, fsrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) return false;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("Program link failed:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return false;
  }

  gl.useProgram(program);
  gl.program = program;
  return true;
}

function compileShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);

  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.log("Shader compile failed:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function updatePerf(nowMS) {
  gFrames++;
  gFPSCounterTime += (nowMS - (gLastPerfMS || nowMS));
  gLastPerfMS = nowMS;

  if (gFPSCounterTime >= 250) {
    const fps = Math.round((gFrames * 1000) / gFPSCounterTime);
    const msPerFrame = (gFPSCounterTime / gFrames).toFixed(2);
    const el = document.getElementById("perf");
    if (el) el.textContent = `fps: ${fps} | ms/frame: ${msPerFrame}`;
    gFrames = 0;
    gFPSCounterTime = 0;
  }
}
