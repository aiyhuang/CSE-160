class Cube {
  static init(gl) {
    const V = new Float32Array([
      0,0,1, 0,0, 0,0,1,   1,1,1, 1,1, 0,0,1,   1,0,1, 1,0, 0,0,1,
      0,0,1, 0,0, 0,0,1,   0,1,1, 0,1, 0,0,1,   1,1,1, 1,1, 0,0,1,

      1,0,0, 0,0, 0,0,-1,  1,1,0, 0,1, 0,0,-1,  0,0,0, 1,0, 0,0,-1,
      0,0,0, 1,0, 0,0,-1,  1,1,0, 0,1, 0,0,-1,  0,1,0, 1,1, 0,0,-1,

      0,0,0, 0,0, -1,0,0,  0,1,0, 0,1, -1,0,0,  0,0,1, 1,0, -1,0,0,
      0,0,1, 1,0, -1,0,0,  0,1,0, 0,1, -1,0,0,  0,1,1, 1,1, -1,0,0,

      1,0,1, 0,0, 1,0,0,   1,1,1, 0,1, 1,0,0,   1,0,0, 1,0, 1,0,0,
      1,0,0, 1,0, 1,0,0,   1,1,1, 0,1, 1,0,0,   1,1,0, 1,1, 1,0,0,

      0,1,1, 0,0, 0,1,0,   0,1,0, 0,1, 0,1,0,   1,1,1, 1,0, 0,1,0,
      1,1,1, 1,0, 0,1,0,   0,1,0, 0,1, 0,1,0,   1,1,0, 1,1, 0,1,0,

      0,0,0, 0,0, 0,-1,0,  0,0,1, 0,1, 0,-1,0,  1,0,0, 1,0, 0,-1,0,
      1,0,0, 1,0, 0,-1,0,  0,0,1, 0,1, 0,-1,0,  1,0,1, 1,1, 0,-1,0,
    ]);

    Cube._buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._buf);
    gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);
    Cube._count = 36;
  }

  static bind(gl, a_Position, a_UV, a_Normal) {
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._buf);
    const FS = Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FS * 8, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FS * 8, FS * 3);
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FS * 8, FS * 5);
    gl.enableVertexAttribArray(a_Normal);
  }

  constructor() {
    this.modelMatrix = new Matrix4();
    this.baseColor = [1, 1, 1, 1];
    this.texWeight = 1.0;
    this.whichTex = 0;
  }

  render(gl, u_ModelMatrix, u_NormalMatrix, u_BaseColor, u_TexWeight, u_WhichTex) {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);

    const nMat = new Matrix4();
    nMat.setInverseOf(this.modelMatrix);
    nMat.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, nMat.elements);

    gl.uniform4f(u_BaseColor, ...this.baseColor);
    gl.uniform1f(u_TexWeight, this.texWeight);
    gl.uniform1i(u_WhichTex, this.whichTex);

    gl.drawArrays(gl.TRIANGLES, 0, Cube._count);
  }
}