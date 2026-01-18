
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

let canvas = null;
let gl = null;
let a_Position = null;
let u_FragColor = null;
let u_Size = null;
let g_vertexBuffer = null;

let g_shapes = [];               
let g_shapeType = 'square';     
let g_color = [1.0, 0.0, 0.0, 1.0];
let g_size = 10.0;            
let g_segments = 12;            
let g_isMouseDown = false;      

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  setupHtmlUI();
  handleClicks();   
  renderAllShapes();
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get a_Position location');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get u_FragColor location');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get u_Size location');
    return;
  }

  g_vertexBuffer = gl.createBuffer();
  if (!g_vertexBuffer) {
    console.log('Failed to create buffer object');
    return;
  }
}

function setupHtmlUI() {

  document.getElementById('rSlider').oninput = function (e) {
    g_color[0] = parseFloat(e.target.value);
  };
  document.getElementById('gSlider').oninput = function (e) {
    g_color[1] = parseFloat(e.target.value);
  };
  document.getElementById('bSlider').oninput = function (e) {
    g_color[2] = parseFloat(e.target.value);
  };

  document.getElementById('sizeSlider').oninput = function (e) {
    g_size = parseFloat(e.target.value);
  };

  document.getElementById('segmentSlider').oninput = function (e) {
    g_segments = parseInt(e.target.value);
  };
}

function setShapeType(type) {
  g_shapeType = type;
}

function clearCanvasAndShapes() {
  g_shapes = [];
  renderAllShapes();
}


function handleClicks() {
  canvas.onmousedown = function (ev) {
    g_isMouseDown = true;
    addShapeAtMouse(ev);
  };

  canvas.onmousemove = function (ev) {
    if (g_isMouseDown) {
      addShapeAtMouse(ev);
    }
  };

  canvas.onmouseup = function () {
    g_isMouseDown = false;
  };

  canvas.onmouseleave = function () {
    g_isMouseDown = false;
  };
}

function convertCoordinates(ev) {
  const rect = canvas.getBoundingClientRect();
  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return [x, y];
}

function addShapeAtMouse(ev) {
  const [x, y] = convertCoordinates(ev);
  const color = g_color.slice(); 
  const size = g_size;

  let shape = null;

  if (g_shapeType === 'square') {
    shape = new Square([x, y], color, size);
  } else if (g_shapeType === 'triangle') {
    const s = size / 200.0;
    const x1 = x;
    const y1 = y + s;
    const x2 = x - s;
    const y2 = y - s;
    const x3 = x + s;
    const y3 = y - s;
    shape = new Triangle([x1, y1, x2, y2, x3, y3], color);
  } else if (g_shapeType === 'circle') {
    const radius = size / 200.0;
    shape = new Circle([x, y], color, radius, g_segments);
  }

  if (shape) {
    g_shapes.push(shape);
    renderAllShapes();
  }
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (let shape of g_shapes) {
    shape.render(gl, a_Position, u_FragColor, u_Size, g_vertexBuffer);
  }
}


class Square {
  constructor(pos, color, size) {
    this.pos = pos;
    this.color = color;
    this.size = size;
  }

  render(gl, a_Position, u_FragColor, u_Size, buffer) {
    const vertices = new Float32Array([this.pos[0], this.pos[1]]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, this.size);

    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor(verts, color) {
    this.verts = verts;
    this.color = color;
  }

  render(gl, a_Position, u_FragColor, u_Size, buffer) {
    const vertices = new Float32Array(this.verts);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, g_size);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

class Circle {
  constructor(center, color, radius, segments) {
    this.center = center;
    this.color = color;
    this.radius = radius;
    this.segments = segments;
    this.verts = this.buildVertices();
  }

  buildVertices() {
    const [cx, cy] = this.center;
    const r = this.radius;
    const n = this.segments;

    const verts = [];
    verts.push(cx, cy);
    for (let i = 0; i <= n; i++) {
      const angle = (2 * Math.PI * i) / n;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      verts.push(x, y);
    }
    return verts;
  }

  render(gl, a_Position, u_FragColor, u_Size, buffer) {
    const vertices = new Float32Array(this.verts);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, g_size);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.segments + 2);
  }
}
