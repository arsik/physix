// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import CANNON from 'cannon';

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });

    this.objects = {
      plane: null,
      cubeMesh: null
    };
    this.physix = {
      plane: null,
      cubeMesh: null
    };

    this.world = null;
    this.timeStep = 1 / 60;

  }

  addGui() {
    const gui = new dat.GUI();
    gui.add(this.camera.position, 'x', -10, 10).listen();
    gui.add(this.camera.position, 'y', -10, 10).listen();
    gui.add(this.camera.position, 'z', -10, 10).listen();
  }

  settingCamera() {
    const OrbitControls = require('three-orbit-controls')(THREE);
    const controls = new OrbitControls( this.camera );
    this.camera.position.set(13, 13, 16);
    controls.update();
  }

  initPhysix() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -40, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    // cube
    const cubeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    this.physix.cubeMesh = new CANNON.Body({
      mass: 1
    });
    this.physix.cubeMesh.position.set(0, 10, 0);
    this.physix.cubeMesh.addShape(cubeShape);
    this.world.addBody(this.physix.cubeMesh);

    // plane
    const planeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.1));
    this.physix.plane = new CANNON.Body({
      mass: 0
    });
    const rot = new CANNON.Vec3(1, 0, 0);
    this.physix.plane.quaternion.setFromAxisAngle(rot, -(Math.PI / 2));
    this.physix.plane.addShape(planeShape);
    this.world.addBody(this.physix.plane);
  }

  updatePhysix() {
    this.world.step(this.timeStep);

    this.objects.cubeMesh.position.copy(this.physix.cubeMesh.position);
    this.objects.cubeMesh.quaternion.copy(this.physix.cubeMesh.quaternion);

    this.objects.plane.position.copy(this.physix.plane.position);
    this.objects.plane.quaternion.copy(this.physix.plane.quaternion);
  }

  init() {

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    document.body.style = 'overflow: hidden; margin: 0; background: #000;';

    const planeGeometry = new THREE.PlaneGeometry(20, 20, 32);
    const planeMaterial = new THREE.MeshBasicMaterial({color: 0xCCCCCC, side: THREE.DoubleSide});
    this.objects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.scene.add(this.objects.plane);
    // this.objects.plane.rotateX(-Math.PI / 2);

    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    this.objects.cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.scene.add(this.objects.cubeMesh);

    this.settingCamera();
    this.addGui();
    this.initPhysix();

    const animate = () => {
      requestAnimationFrame(animate);
      this.updatePhysix();
      this.renderer.render( this.scene, this.camera );
    };
    animate();

  }

}

new Scene().init();
