class Camera {
  constructor(canvas) {
    this.eye = new Vector3([16, 2, 28]);
    this.at  = new Vector3([16, 2, 27]);
    this.up  = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.yawDeg = 0;
    this.pitchDeg = 0;

    this.speed = 0.30;
    this.turnSpeed = 3;

    this.projectionMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 1000);
    this._updateView();
  }

  _updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  _forward() {
    const f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    return f;
  }

  moveForward() {
    const f = this._forward();
    f.mul(this.speed);
    this.eye.add(f);
    this.at.add(f);
    this._updateView();
  }

  moveBackwards() {
    const f = this._forward();
    f.mul(this.speed);
    this.eye.sub(f);
    this.at.sub(f);
    this._updateView();
  }

  moveLeft() {
    const f = this._forward();
    const s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
    this._updateView();
  }

  moveRight() {
    const f = this._forward();
    const s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
    this._updateView();
  }

  panLeft()  { this._yaw(+this.turnSpeed); }
  panRight() { this._yaw(-this.turnSpeed); }

  _yaw(a) {
    const f = this._forward();
    const rot = new Matrix4();
    rot.setRotate(a, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    const f2 = rot.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(f2);
    this._updateView();
  }

  mouseLook(dx, dy) {
    const sens = 0.15;
    this.yawDeg   += dx * sens;
    this.pitchDeg -= dy * sens;
    this.pitchDeg = Math.max(-80, Math.min(80, this.pitchDeg));

    const yaw = this.yawDeg * Math.PI / 180;
    const pitch = this.pitchDeg * Math.PI / 180;

    const fx = Math.cos(pitch) * Math.sin(yaw);
    const fy = Math.sin(pitch);
    const fz = -Math.cos(pitch) * Math.cos(yaw);

    this.at.set(this.eye);
    this.at.add(new Vector3([fx, fy, fz]));
    this._updateView();
  }

  onResize(canvas) {
    this.projectionMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 1000);
    this._updateView();
  }
}