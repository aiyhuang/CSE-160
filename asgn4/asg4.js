const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_UV;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_WorldNormal;

void main() {
  vec4 worldPos = u_ModelMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
  v_UV = a_UV;
  v_WorldPos = worldPos.xyz;
  v_WorldNormal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
}
`;

const FSHADER_SOURCE = `
precision mediump float;

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_WorldNormal;

uniform vec4 u_BaseColor;
uniform float u_TexWeight;
uniform int u_WhichTex;

uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform sampler2D u_Sampler3;

uniform vec3 u_LightPos;
uniform vec3 u_LightColor;
uniform vec3 u_CameraPos;

uniform int u_LightingOn;
uniform int u_ShowNormals;

vec4 sampleTex(int which, vec2 uv) {
  if (which == 0) return texture2D(u_Sampler0, uv);
  if (which == 1) return texture2D(u_Sampler1, uv);
  if (which == 2) return texture2D(u_Sampler2, uv);
  return texture2D(u_Sampler3, uv);
}

void main() {
  vec4 texColor = sampleTex(u_WhichTex, v_UV);
  vec4 base = mix(u_BaseColor, texColor, u_TexWeight);

  if (u_ShowNormals == 1) {
    vec3 n = normalize(v_WorldNormal);
    gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
    return;
  }

  if (u_LightingOn == 0) {
    gl_FragColor = base;
    return;
  }

  vec3 N = normalize(v_WorldNormal);
  vec3 L = normalize(u_LightPos - v_WorldPos);
  vec3 V = normalize(u_CameraPos - v_WorldPos);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N, L), 0.0);
  float shininess = 32.0;
  float spec = pow(max(dot(R, V), 0.0), shininess);

  float ambientK = 0.20;
  float diffuseK = 1.00;
  float specK    = 0.45;

  vec3 lit = (ambientK * vec3(1.0))
           + (diffuseK * diff * u_LightColor)
           + (specK * spec * u_LightColor);

  vec3 rgb = base.rgb * lit;
  gl_FragColor = vec4(rgb, base.a);
}
`;

let canvas, gl;

let a_Position, a_UV, a_Normal;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix, u_NormalMatrix;
let u_BaseColor, u_TexWeight, u_WhichTex;
let u_LightPos, u_LightColor, u_CameraPos;
let u_LightingOn, u_ShowNormals;

let camera;

let lightingOn = true;
let showNormals = false;
let spinLight = true;

let lightPos = [16, 6, 16];
let lightColor = [1, 1, 1];

let lastTime = 0;

const WORLD_W = 32, WORLD_D = 32, WORLD_H = 4;
let heightMap = [];
let typeMap = [];

const keys = Object.create(null);

function makeMaps() {
  for (let z = 0; z < WORLD_D; z++) {
    heightMap[z] = [];
    typeMap[z] = [];
    for (let x = 0; x < WORLD_W; x++) {
      const border = (x === 0 || z === 0 || x === WORLD_W - 1 || z === WORLD_D - 1);
      let h = border ? 3 : 0;
      if (!border && (x % 6 === 0) && z > 3 && z < WORLD_D - 4) h = 2;
      if (!border && (z % 7 === 0) && x > 3 && x < WORLD_W - 4) h = 1;
      if (!border && (x === 10 && z === 10)) h = 4;
      if (!border && (x === 22 && z === 18)) h = 4;

      heightMap[z][x] = h;
      typeMap[z][x] = ((x + z) % 11 === 0) ? 1 : 0; // 0 wall, 1 crate
    }
  }
}

function initUI() {
  const btnLighting = document.getElementById('btnLighting');
  const btnNormals = document.getElementById('btnNormals');
  const btnSpin = document.getElementById('btnSpin');

  const lx = document.getElementById('lx');
  const ly = document.getElementById('ly');
  const lz = document.getElementById('lz');

  const lr = document.getElementById('lr');
  const lg = document.getElementById('lg');
  const lb = document.getElementById('lb');

  btnLighting.onclick = () => {
    lightingOn = !lightingOn;
    btnLighting.textContent = `Lighting: ${lightingOn ? 'ON' : 'OFF'}`;
  };

  btnNormals.onclick = () => {
    showNormals = !showNormals;
    btnNormals.textContent = `Normals: ${showNormals ? 'ON' : 'OFF'}`;
  };

  btnSpin.onclick = () => {
    spinLight = !spinLight;
    btnSpin.textContent = `Light Spin: ${spinLight ? 'ON' : 'OFF'}`;
  };

  function readLight() {
    lightPos[0] = parseFloat(lx.value);
    lightPos[1] = parseFloat(ly.value);
    lightPos[2] = parseFloat(lz.value);
    lightColor[0] = parseFloat(lr.value);
    lightColor[1] = parseFloat(lg.value);
    lightColor[2] = parseFloat(lb.value);
  }

  ['input','change'].forEach(ev => {
    lx.addEventListener(ev, readLight);
    ly.addEventListener(ev, readLight);
    lz.addEventListener(ev, readLight);
    lr.addEventListener(ev, readLight);
    lg.addEventListener(ev, readLight);
    lb.addEventListener(ev, readLight);
  });

  readLight();
}

function initInput() {
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  setInterval(() => {
    if (keys['w']) camera.moveForward();
    if (keys['s']) camera.moveBackwards();
    if (keys['a']) camera.moveLeft();
    if (keys['d']) camera.moveRight();
    if (keys['q']) camera.panLeft();
    if (keys['e']) camera.panRight();
  }, 16);

  canvas.addEventListener('click', () => canvas.requestPointerLock());

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;
    camera.mouseLook(e.movementX, e.movementY);
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'f') addBlockInFront();
    if (k === 'r') removeBlockInFront();
  });
}

function frontCell() {
  const f = new Vector3();
  f.set(camera.at);
  f.sub(camera.eye);
  f.normalize();

  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];

  const fx = ex + f.elements[0] * 1.2;
  const fz = ez + f.elements[2] * 1.2;

  return { x: Math.floor(fx), z: Math.floor(fz) };
}

function addBlockInFront() {
  const { x, z } = frontCell();
  if (x < 0 || x >= WORLD_W || z < 0 || z >= WORLD_D) return;
  if (heightMap[z][x] >= WORLD_H) return;
  heightMap[z][x] += 1;
  typeMap[z][x] = 1;
}

function removeBlockInFront() {
  const { x, z } = frontCell();
  if (x < 0 || x >= WORLD_W || z < 0 || z >= WORLD_D) return;
  if (heightMap[z][x] <= 0) return;
  heightMap[z][x] -= 1;
}

function tick(t) {
  lastTime = t;

  if (spinLight) {
    const ang = t * 0.001;
    const r = 10;
    lightPos[0] = 16 + Math.cos(ang) * r;
    lightPos[2] = 16 + Math.sin(ang) * r;
    document.getElementById('lx').value = lightPos[0];
    document.getElementById('lz').value = lightPos[2];
  }

  drawScene();
  requestAnimationFrame(tick);
}

function drawScene() {
  gl.clearColor(0.05, 0.05, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  gl.uniform3f(u_CameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
  gl.uniform3f(u_LightPos, lightPos[0], lightPos[1], lightPos[2]);
  gl.uniform3f(u_LightColor, lightColor[0], lightColor[1], lightColor[2]);

  gl.uniform1i(u_LightingOn, lightingOn ? 1 : 0);
  gl.uniform1i(u_ShowNormals, showNormals ? 1 : 0);

  const ex = camera.eye.elements[0];
  const ey = camera.eye.elements[1];
  const ez = camera.eye.elements[2];

  const S = 500;

  Cube.bind(gl, a_Position, a_UV, a_Normal);

  {
    const sky = new Cube();
    sky.texWeight = 0.0;
    sky.baseColor = [0.35, 0.55, 0.95, 1.0];
    sky.modelMatrix.setTranslate(ex - S/2, ey - S/2, ez - S/2);
    sky.modelMatrix.scale(S, S, S);
    gl.depthMask(false);
    sky.render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex);
    gl.depthMask(true);
  }

  for (let z = 0; z < WORLD_D; z++) {
    for (let x = 0; x < WORLD_W; x++) {
      const g = new Cube();
      g.whichTex = 2;
      g.texWeight = 1.0;
      g.modelMatrix.setTranslate(x, -0.5, z);
      g.render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex);
    }
  }

  for (let z = 0; z < WORLD_D; z++) {
    for (let x = 0; x < WORLD_W; x++) {
      const h = heightMap[z][x];
      for (let y = 0; y < h; y++) {
        const c = new Cube();
        c.whichTex = typeMap[z][x] ? 1 : 0;
        c.texWeight = 1.0;
        c.modelMatrix.setTranslate(x, y, z);
        c.render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex);
      }
    }
  }

  {
    const lamp = new Cube();
    lamp.texWeight = 0.0;
    lamp.baseColor = [1, 1, 1, 1];
    lamp.modelMatrix.setTranslate(lightPos[0], lightPos[1], lightPos[2]);
    lamp.modelMatrix.scale(0.25, 0.25, 0.25);
    lamp.render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex);
  }

    Sphere.bind(gl, a_Position, a_UV, a_Normal);

  {
    const s1 = new Sphere();
    s1.baseColor = [1, 0.4, 0.4, 1];
    s1.texWeight = 0.0;
    s1.modelMatrix.setTranslate(18, 2.2, 14);
    s1.modelMatrix.scale(1.5, 1.5, 1.5);
    s1.render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex);

    const s2 = new Sphere();
    s2.baseColor = [0.4, 1, 0.4, 1];
    s2.texWeight = 0.0;
    s2.modelMatrix.setTranslate(16, 1.6, 20);
    s2.modelMatrix.scale(1.0, 1.0, 1.0);
    s2.render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex);
  }
}

function initTextures(onReady) {
  const textures = [
    { unit: 0, uniform: 'u_Sampler0', url: 'textures/wall.png'   },
    { unit: 1, uniform: 'u_Sampler1', url: 'textures/crate.png'  },
    { unit: 2, uniform: 'u_Sampler2', url: 'textures/ground.png' },
    { unit: 3, uniform: 'u_Sampler3', url: 'textures/sky.png'    },
  ];

  let loaded = 0;

  textures.forEach((t) => {
    const img = new Image();
    img.onload = () => {
      const tex = gl.createTexture();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.activeTexture(gl.TEXTURE0 + t.unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.uniform1i(gl.getUniformLocation(gl.program, t.uniform), t.unit);
      loaded++;
      if (loaded === textures.length) onReady();
    };
    img.onerror = () => console.log('FAILED to load texture:', t.url);
    img.src = t.url;
  });
}

function main() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) return;

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) return;

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  u_BaseColor = gl.getUniformLocation(gl.program, 'u_BaseColor');
  u_TexWeight = gl.getUniformLocation(gl.program, 'u_TexWeight');
  u_WhichTex = gl.getUniformLocation(gl.program, 'u_WhichTex');

  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');

  u_LightingOn = gl.getUniformLocation(gl.program, 'u_LightingOn');
  u_ShowNormals = gl.getUniformLocation(gl.program, 'u_ShowNormals');

  gl.enable(gl.DEPTH_TEST);

  Cube.init(gl);
  Sphere.init(gl);

  camera = new Camera(canvas);

  makeMaps();
  initUI();
  initInput();

  initTextures(() => requestAnimationFrame(tick));
}

main();