let canvas;
let ctx;

function main() {
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.log('Failed to get 2D context');
    return false;
  }

  clearCanvas();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  const x = v.elements[0];
  const y = v.elements[1];

  const scale = 20;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const endX = cx + x * scale;
  const endY = cy - y * scale; 

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function readVectors() {
  let x1 = parseFloat(document.getElementById('v1-x').value);
  let y1 = parseFloat(document.getElementById('v1-y').value);
  if (isNaN(x1)) x1 = 0;
  if (isNaN(y1)) y1 = 0;

  let x2 = parseFloat(document.getElementById('v2-x').value);
  let y2 = parseFloat(document.getElementById('v2-y').value);
  if (isNaN(x2)) x2 = 0;
  if (isNaN(y2)) y2 = 0;

  const v1 = new Vector3([x1, y1, 0]);
  const v2 = new Vector3([x2, y2, 0]);

  return { v1, v2 };
}

function handleDrawEvent() {
  const { v1, v2 } = readVectors();

  clearCanvas();
  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function angleBetween(v1, v2) {
  const dot = Vector3.dot(v1, v2);
  const m1 = v1.magnitude();
  const m2 = v2.magnitude();

  if (m1 === 0 || m2 === 0) {
    return 0;
  }

  let cos = dot / (m1 * m2);
  if (cos > 1) cos = 1;
  if (cos < -1) cos = -1;

  return Math.acos(cos); 
}

function areaTriangle(v1, v2) {
  const cross = Vector3.cross(v1, v2);
  const areaParallelogram = cross.magnitude();
  return 0.5 * areaParallelogram;
}

function handleDrawOperationEvent() {
  const { v1, v2 } = readVectors();

  const op = document.getElementById('op-select').value;
  let s = parseFloat(document.getElementById('scalar').value);
  if (isNaN(s)) s = 1;

  clearCanvas();

  drawVector(v1, 'red');
  drawVector(v2, 'blue');

  if (op === 'add') {
    const v3 = new Vector3(v1.elements);
    v3.add(v2);
    drawVector(v3, 'green');

  } else if (op === 'sub') {
    const v3 = new Vector3(v1.elements);
    v3.sub(v2);
    drawVector(v3, 'green');

  } else if (op === 'mul') {
    const v3 = new Vector3(v1.elements);
    const v4 = new Vector3(v2.elements);
    v3.mul(s);
    v4.mul(s);
    drawVector(v3, 'green');
    drawVector(v4, 'green');

  } else if (op === 'div') {
    if (s === 0) {
      console.log('Cannot divide by zero, using s = 1 instead.');
      s = 1;
    }
    const v3 = new Vector3(v1.elements);
    const v4 = new Vector3(v2.elements);
    v3.div(s);
    v4.div(s);
    drawVector(v3, 'green');
    drawVector(v4, 'green');

  } else if (op === 'magnitude') {
    const mag1 = v1.magnitude();
    const mag2 = v2.magnitude();
    console.log('||v1|| =', mag1);
    console.log('||v2|| =', mag2);

  } else if (op === 'normalize') {
    const n1 = new Vector3(v1.elements);
    const n2 = new Vector3(v2.elements);
    n1.normalize();
    n2.normalize();
    console.log('normalized v1 =', n1.elements);
    console.log('normalized v2 =', n2.elements);
    drawVector(n1, 'green');
    drawVector(n2, 'green');

  } else if (op === 'angle') {
    const angleRad = angleBetween(v1, v2);
    const angleDeg = angleRad * 180 / Math.PI;
    console.log('Angle between v1 and v2 =', angleRad, 'radians (', angleDeg, 'degrees )');

  } else if (op === 'area') {
    const area = areaTriangle(v1, v2);
    console.log('Area of triangle formed by v1 and v2 =', area);
  }
}
