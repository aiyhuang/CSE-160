import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

function main() {
  const canvas = document.querySelector('#c');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 500;

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 3, 18);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const controls = new PointerLockControls(camera, document.body);
  scene.add(controls.getObject());

  document.body.addEventListener('click', () => {
    controls.lock();
  });

  const loader = new THREE.TextureLoader();

  const crateTexture = loader.load('./textures/crate.png');
  crateTexture.colorSpace = THREE.SRGBColorSpace;

  const wallTexture = loader.load('./textures/wall.png');
  wallTexture.colorSpace = THREE.SRGBColorSpace;

  const groundTexture = loader.load('./textures/ground.png');
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(20, 20);

  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
  directionalLight.position.set(8, 12, 6);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 80;
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffcc88, 25, 60);
  pointLight.position.set(0, 6, 0);
  scene.add(pointLight);

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x6b8e23, 0.8);
  scene.add(hemisphereLight);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  const blockObjects = [];
  const keys = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false,
    ShiftLeft: false,
    ShiftRight: false,
  };

  const house = new THREE.Group();
  scene.add(house);

  function addHouseBlock(x, y, z, texture) {
    const mat = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    house.add(mesh);
    blockObjects.push(mesh);
    return mesh;
  }

  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      addHouseBlock(x, 0.5, z, wallTexture);
    }
  }

  for (let y = 1.5; y <= 3.5; y += 1) {
    for (let x = -3; x <= 3; x++) {
      addHouseBlock(x, y, -3, wallTexture);
      addHouseBlock(x, y, 3, wallTexture);
    }
    for (let z = -2; z <= 2; z++) {
      addHouseBlock(-3, y, z, wallTexture);
      addHouseBlock(3, y, z, wallTexture);
    }
  }

  addHouseBlock(-1, 1.5, 3, crateTexture);
  addHouseBlock(1, 1.5, 3, crateTexture);
  addHouseBlock(-1, 2.5, 3, crateTexture);
  addHouseBlock(1, 2.5, 3, crateTexture);

  for (let x = -3; x <= 3; x++) {
    addHouseBlock(x, 4.5, -3, crateTexture);
    addHouseBlock(x, 4.5, 3, crateTexture);
  }

  for (let z = -2; z <= 2; z++) {
    addHouseBlock(-3, 4.5, z, crateTexture);
    addHouseBlock(3, 4.5, z, crateTexture);
  }

  const roofMaterial = new THREE.MeshStandardMaterial({ map: crateTexture });

  const roofLeft = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 0.5, 4.5),
    roofMaterial
  );
  roofLeft.position.set(-1.9, 5.2, 0);
  roofLeft.rotation.z = Math.PI / 6;
  roofLeft.castShadow = true;
  roofLeft.receiveShadow = true;
  house.add(roofLeft);

  const roofRight = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 0.5, 4.5),
    roofMaterial
  );
  roofRight.position.set(1.9, 5.2, 0);
  roofRight.rotation.z = -Math.PI / 6;
  roofRight.castShadow = true;
  roofRight.receiveShadow = true;
  house.add(roofRight);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.2, 0.2),
    new THREE.MeshStandardMaterial({ map: crateTexture })
  );
  door.position.set(0, 1.1, 3.1);
  door.castShadow = true;
  door.receiveShadow = true;
  house.add(door);

  const windowLeft = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 0.2),
    new THREE.MeshStandardMaterial({
      color: 0x99dfff,
      emissive: 0x224466,
      emissiveIntensity: 0.4
    })
  );
  windowLeft.position.set(-1.8, 2.5, 3.1);
  windowLeft.castShadow = true;
  windowLeft.receiveShadow = true;
  house.add(windowLeft);

  const windowRight = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 0.2),
    new THREE.MeshStandardMaterial({
      color: 0x99dfff,
      emissive: 0x224466,
      emissiveIntensity: 0.4
    })
  );
  windowRight.position.set(1.8, 2.5, 3.1);
  windowRight.castShadow = true;
  windowRight.receiveShadow = true;
  house.add(windowRight);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2, 0.9),
    new THREE.MeshStandardMaterial({ map: wallTexture })
  );
  chimney.position.set(1.8, 6.5, -1.2);
  chimney.castShadow = true;
  chimney.receiveShadow = true;
  house.add(chimney);

  function createTree(x, z, trunkHeight = 2.4) {
    const tree = new THREE.Group();
    scene.add(tree);

    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, trunkHeight, 20),
      trunkMaterial
    );
    trunk.position.set(x, trunkHeight / 2, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    const cone1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 2.2, 20),
      leafMaterial
    );
    cone1.position.set(x, trunkHeight + 0.8, z);
    cone1.castShadow = true;
    cone1.receiveShadow = true;
    tree.add(cone1);

    const cone2 = new THREE.Mesh(
      new THREE.ConeGeometry(1.45, 2.0, 20),
      leafMaterial
    );
    cone2.position.set(x, trunkHeight + 1.9, z);
    cone2.castShadow = true;
    cone2.receiveShadow = true;
    tree.add(cone2);

    const cone3 = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 1.8, 20),
      leafMaterial
    );
    cone3.position.set(x, trunkHeight + 2.8, z);
    cone3.castShadow = true;
    cone3.receiveShadow = true;
    tree.add(cone3);

    return tree;
  }

  const treePositions = [
    [-14, -10],
    [-10, -14],
    [-16, 6],
    [-12, 12],
    [12, -12],
    [16, -6],
    [14, 10],
    [10, 14],
    [-6, -16],
    [6, -16],
    [-18, 0],
    [18, 2],
  ];

  treePositions.forEach(([x, z], index) => {
    const height = 2.2 + (index % 3) * 0.4;
    createTree(x, z, height);
  });

  function addBlock() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const position = camera.position.clone().add(direction.multiplyScalar(3));
    const x = Math.round(position.x);
    const y = Math.max(0.5, Math.round(position.y - 0.5) + 0.5);
    const z = Math.round(position.z);

    const cube = new THREE.Mesh(
      boxGeo,
      new THREE.MeshStandardMaterial({ map: wallTexture })
    );
    cube.position.set(x, y, z);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    blockObjects.push(cube);
  }

  function removeBlock() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const raycaster = new THREE.Raycaster(camera.position, direction.normalize());
    const intersections = raycaster.intersectObjects(blockObjects, false);

    if (intersections.length > 0) {
      const hit = intersections[0].object;
      if (hit.parent === house) {
        house.remove(hit);
      } else {
        scene.remove(hit);
      }
      const index = blockObjects.indexOf(hit);
      if (index >= 0) {
        blockObjects.splice(index, 1);
      }
    }
  }

  window.addEventListener('keydown', (event) => {
    if (event.code in keys) {
      keys[event.code] = true;
    }

    if (event.code === 'KeyF') {
      addBlock();
    }

    if (event.code === 'KeyR') {
      removeBlock();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.code in keys) {
      keys[event.code] = false;
    }
  });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function updateMovement() {
    const speed = 0.15;

    if (!controls.isLocked) {
      return;
    }

    if (keys.KeyW) {
      controls.moveForward(speed);
    }
    if (keys.KeyS) {
      controls.moveForward(-speed);
    }
    if (keys.KeyA) {
      controls.moveRight(-speed);
    }
    if (keys.KeyD) {
      controls.moveRight(speed);
    }
    if (keys.Space) {
      camera.position.y += speed;
    }
    if (keys.ShiftLeft || keys.ShiftRight) {
      camera.position.y -= speed;
    }

    if (camera.position.y < 1.5) {
      camera.position.y = 1.5;
    }
  }

  function render() {
    updateMovement();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();