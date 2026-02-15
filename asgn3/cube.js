class Cube {
  static init(gl, a_Position, a_UV) {
    const V = new Float32Array([
      0,0,1,0,0, 1,1,1,1,1, 1,0,1,1,0,
      0,0,1,0,0, 0,1,1,0,1, 1,1,1,1,1,
      1,0,0,0,0, 1,1,0,0,1, 0,0,0,1,0,
      0,0,0,1,0, 1,1,0,0,1, 0,1,0,1,1,
      0,0,0,0,0, 0,1,0,0,1, 0,0,1,1,0,
      0,0,1,1,0, 0,1,0,0,1, 0,1,1,1,1,
      1,0,1,0,0, 1,1,1,0,1, 1,0,0,1,0,
      1,0,0,1,0, 1,1,1,0,1, 1,1,0,1,1,
      0,1,1,0,0, 0,1,0,0,1, 1,1,1,1,0,
      1,1,1,1,0, 0,1,0,0,1, 1,1,0,1,1,
      0,0,0,0,0, 0,0,1,0,1, 1,0,0,1,0,
      1,0,0,1,0, 0,0,1,0,1, 1,0,1,1,1,
    ]);

    Cube.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.buf);
    gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);

    const FS = V.BYTES_PER_ELEMENT;

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FS * 5, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FS * 5, FS * 3);
    gl.enableVertexAttribArray(a_UV);

    Cube.count = 36;
  }

  constructor() {
    this.modelMatrix = new Matrix4();
    this.baseColor = [1,1,1,1];
    this.texWeight = 1;
    this.whichTex = 0;
  }

  render(gl, u_Model, u_Color, u_TexW, u_WhichTex) {
    gl.uniformMatrix4fv(u_Model, false, this.modelMatrix.elements);
    gl.uniform4f(u_Color, ...this.baseColor);
    gl.uniform1f(u_TexW, this.texWeight);
    gl.uniform1i(u_WhichTex, this.whichTex);
    gl.drawArrays(gl.TRIANGLES, 0, Cube.count);
  }
}
