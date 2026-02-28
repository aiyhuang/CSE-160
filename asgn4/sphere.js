class Sphere {
  static init(gl, slices = 24, stacks = 16) {
    const verts = [];
    function pushV(x, y, z, u, v) { verts.push(x, y, z, u, v, x, y, z); }

    for (let stack = 0; stack < stacks; stack++) {
      const v0 = stack / stacks;
      const v1 = (stack + 1) / stacks;
      const phi0 = v0 * Math.PI;
      const phi1 = v1 * Math.PI;

      for (let slice = 0; slice < slices; slice++) {
        const u0 = slice / slices;
        const u1 = (slice + 1) / slices;
        const th0 = u0 * 2 * Math.PI;
        const th1 = u1 * 2 * Math.PI;

        const x00 = Math.sin(phi0) * Math.cos(th0);
        const y00 = Math.cos(phi0);
        const z00 = Math.sin(phi0) * Math.sin(th0);

        const x10 = Math.sin(phi0) * Math.cos(th1);
        const y10 = Math.cos(phi0);
        const z10 = Math.sin(phi0) * Math.sin(th1);

        const x01 = Math.sin(phi1) * Math.cos(th0);
        const y01 = Math.cos(phi1);
        const z01 = Math.sin(phi1) * Math.sin(th0);

        const x11 = Math.sin(phi1) * Math.cos(th1);
        const y11 = Math.cos(phi1);
        const z11 = Math.sin(phi1) * Math.sin(th1);

        pushV(x00,y00,z00,u0,v0);
        pushV(x01,y01,z01,u0,v1);
        pushV(x11,y11,z11,u1,v1);

        pushV(x00,y00,z00,u0,v0);
        pushV(x11,y11,z11,u1,v1);
        pushV(x10,y10,z10,u1,v0);
      }
    }

    const V = new Float32Array(verts);
    Sphere._buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere._buf);
    gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);
    Sphere._count = V.length / 8;
  }

  static bind(gl, a_Position, a_UV, a_Normal) {
    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere._buf);
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
    this.texWeight = 0.0;
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

    gl.drawArrays(gl.TRIANGLES, 0, Sphere._count);
  }
}