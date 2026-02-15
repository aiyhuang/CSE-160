const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_UV;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
varying vec2 v_UV;
void main(){
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
  v_UV = a_UV;
}`;

const FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
uniform vec4 u_BaseColor;
uniform float u_TexWeight;
uniform int u_WhichTex;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform sampler2D u_Sampler3;
vec4 sampleTex(int w, vec2 uv){
  if(w==0) return texture2D(u_Sampler0, uv);
  if(w==1) return texture2D(u_Sampler1, uv);
  if(w==2) return texture2D(u_Sampler2, uv);
  return texture2D(u_Sampler3, uv);
}
void main(){
  vec4 texColor = sampleTex(u_WhichTex, v_UV);
  gl_FragColor = mix(u_BaseColor, texColor, u_TexWeight);
}`;

let canvas, gl;
let a_Position, a_UV;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
let u_BaseColor, u_TexWeight, u_WhichTex;
let camera;

const WORLD_W=32, WORLD_D=32, WORLD_H=4;
let heightMap=[], typeMap=[];
const keys={};

function makeMaps(){
  for(let z=0; z<WORLD_D; z++){
    heightMap[z]=[];
    typeMap[z]=[];
    for(let x=0; x<WORLD_W; x++){
      let border=(x===0||z===0||x===WORLD_W-1||z===WORLD_D-1);
      let h=border?3:0;
      if(!border && x%6===0 && z>3 && z<WORLD_D-4) h=2;
      if(!border && z%7===0 && x>3 && x<WORLD_W-4) h=1;
      if(x===10 && z===10) h=4;
      if(x===22 && z===18) h=4;
      heightMap[z][x]=h;
      typeMap[z][x]=(x+z)%11===0?1:0;
    }
  }
}

function main(){
  canvas=document.getElementById('webgl');
  gl=canvas.getContext('webgl');
  initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE);

  a_Position=gl.getAttribLocation(gl.program,'a_Position');
  a_UV=gl.getAttribLocation(gl.program,'a_UV');

  u_ModelMatrix=gl.getUniformLocation(gl.program,'u_ModelMatrix');
  u_ViewMatrix=gl.getUniformLocation(gl.program,'u_ViewMatrix');
  u_ProjectionMatrix=gl.getUniformLocation(gl.program,'u_ProjectionMatrix');
  u_BaseColor=gl.getUniformLocation(gl.program,'u_BaseColor');
  u_TexWeight=gl.getUniformLocation(gl.program,'u_TexWeight');
  u_WhichTex=gl.getUniformLocation(gl.program,'u_WhichTex');

  gl.enable(gl.DEPTH_TEST);
  Cube.init(gl,a_Position,a_UV);

  camera=new Camera(canvas);
  makeMaps();
  initInput();
  initTextures(()=>requestAnimationFrame(tick));
}

function tick(){
  drawScene();
  requestAnimationFrame(tick);
}

function drawScene(){
  gl.clearColor(0.05,0.05,0.08,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix,false,camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix,false,camera.projectionMatrix.elements);

  const ex=camera.eye.elements[0];
  const ey=camera.eye.elements[1];
  const ez=camera.eye.elements[2];
  const S=500;

  const sky=new Cube();
  sky.texWeight=0;
  sky.baseColor=[0.35,0.55,0.95,1];
  sky.modelMatrix.setTranslate(ex-S/2,ey-S/2,ez-S/2);
  sky.modelMatrix.scale(S,S,S);
  gl.depthMask(false);
  sky.render(gl,u_ModelMatrix,u_BaseColor,u_TexWeight,u_WhichTex);
  gl.depthMask(true);

  const ground=new Cube();
  ground.whichTex=2;
  ground.modelMatrix.setTranslate(0,-0.5,0);
  ground.modelMatrix.scale(WORLD_W,1,WORLD_D);
  ground.render(gl,u_ModelMatrix,u_BaseColor,u_TexWeight,u_WhichTex);

  for(let z=0; z<WORLD_D; z++){
    for(let x=0; x<WORLD_W; x++){
      for(let y=0; y<heightMap[z][x]; y++){
        const c=new Cube();
        c.whichTex=typeMap[z][x]?1:0;
        c.modelMatrix.setTranslate(x,y,z);
        c.render(gl,u_ModelMatrix,u_BaseColor,u_TexWeight,u_WhichTex);
      }
    }
  }
}

function initInput(){
  window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
  window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

  setInterval(()=>{
    if(keys.w) camera.moveForward();
    if(keys.s) camera.moveBackwards();
    if(keys.a) camera.moveLeft();
    if(keys.d) camera.moveRight();
    if(keys.q) camera.panLeft();
    if(keys.e) camera.panRight();
  },16);

  canvas.onclick=()=>canvas.requestPointerLock();
  document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement===canvas)
      camera.mouseLook(e.movementX,e.movementY);
  });

  window.addEventListener('keydown',e=>{
    if(e.key==='f') addBlock();
    if(e.key==='r') removeBlock();
  });
}

function frontCell(){
  const f=new Vector3();
  f.set(camera.at); f.sub(camera.eye); f.normalize();
  const fx=camera.eye.elements[0]+f.elements[0]*1.2;
  const fz=camera.eye.elements[2]+f.elements[2]*1.2;
  return {x:Math.floor(fx),z:Math.floor(fz)};
}

function addBlock(){
  const p=frontCell();
  if(heightMap[p.z][p.x]<WORLD_H) heightMap[p.z][p.x]++;
}

function removeBlock(){
  const p=frontCell();
  if(heightMap[p.z][p.x]>0) heightMap[p.z][p.x]--;
}

function initTextures(done){
  const tex=[
    {u:'u_Sampler0',f:'textures/wall.png',i:0},
    {u:'u_Sampler1',f:'textures/crate.png',i:1},
    {u:'u_Sampler2',f:'textures/ground.png',i:2},
    {u:'u_Sampler3',f:'textures/sky.png',i:3}
  ];
  let loaded=0;
  tex.forEach(t=>{
    const img=new Image();
    img.onload=()=>{
      const texObj=gl.createTexture();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
      gl.activeTexture(gl.TEXTURE0+t.i);
      gl.bindTexture(gl.TEXTURE_2D,texObj);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      gl.uniform1i(gl.getUniformLocation(gl.program,t.u),t.i);
      if(++loaded===4) done();
    };
    img.src=t.f;
  });
}

main();
