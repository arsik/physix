// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import CANNON from 'cannon';
import './cannonDebug';

class Scene {

  constructor() {

    // const cannonDebugRenderer = require('./cannonDebug.js')(THREE);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.cannonDebugRenderer = null;

    this.objects = {
      plane: null,
      textMeshes: []
    };
    this.physix = {
      plane: null,
      textMeshes: []
    };

    this.planeAnimation = {
      update: false,
      step: 0.0,
      from: -Math.PI / 2,
      to: 0.0
    };

    this.textFont = null;

    this.world = null;
    this.timeStep = 1 / 60;

    this.initialized = false;
    this.isEnabledEvents = false;

  }

  addGui() {
    const gui = new dat.GUI();
    gui.add(this.camera.position, 'x', -10, 10).listen();
    gui.add(this.camera.position, 'y', -10, 10).listen();
    gui.add(this.camera.position, 'z', -10, 10).listen();
  }

  addLight() {
    const pointLight = new THREE.PointLight( 0xffffff, 1, 500 );
    pointLight.position.set( 0, 20, 0 );
    this.scene.add(pointLight );

    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 1;
    pointLight.shadow.camera.far = 60;
    pointLight.shadow.bias = -0.005;
  }

  settingCamera() {
    const OrbitControls = require('three-orbit-controls')(THREE);
    const controls = new OrbitControls( this.camera );
    this.camera.position.set(0, 13, 16);
    controls.update();
  }

  initPhysix() {
    this.world = new CANNON.World();
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.gravity.set(0, -40, 0);
    this.world.solver.tolerance = 0.001;

    this.cannonDebugRenderer = new THREE.CannonDebugRenderer( this.scene, this.world );

    // plane
    const planeShape = new CANNON.Box(new CANNON.Vec3(10, 10, 0.05));
    this.physix.plane = new CANNON.Body({
      mass: 0
    });
    this.physix.plane.addShape(planeShape);
    this.physix.plane.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(this.physix.plane);
  }

  addTextMesh(font, char, x, y, z) {
    const textGeometry = new THREE.TextGeometry( char, {
      font: font,
      size: 2,
      height: 0.1,
      curveSegments: 10,
      // bevelEnabled: true,
      // bevelThickness: 0.1,
      // bevelSize: 0.05,
      // bevelSegments: 10
    } );
    // textGeometry.translate(-0.5, -0.5, 0);
    textGeometry.center(); // fix bound box
    const textMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: false, side: THREE.DoubleSide });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    // textMesh.scale.set(1, 1, 1);
    textMesh.position.set(x, y, z);
    this.scene.add(textMesh);
    this.objects.textMeshes.push(textMesh);

    const textShape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.1));
    const textPhysixMesh = new CANNON.Body({
      mass: 1,
      position: textMesh.position,
      shape: textShape
    });
    this.world.addBody(textPhysixMesh);
    // textPhysixMesh.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.physix.textMeshes.push(textPhysixMesh);
  }

  rotatePlane() {
    this.planeAnimation.update = true;
    this.isEnabledEvents = false;
  }

  updatePhysix() {
    this.world.step(this.timeStep);
    for (let i = 0; i < this.objects.textMeshes.length; i++) {
      this.objects.textMeshes[i].position.copy(this.physix.textMeshes[i].position);
      this.objects.textMeshes[i].quaternion.copy(this.physix.textMeshes[i].quaternion);
    }
    this.objects.plane.position.copy(this.physix.plane.position);
    this.objects.plane.quaternion.copy(this.physix.plane.quaternion);
  }

  initEvents() {
    window.onkeypress = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.code === 'Space' || !this.isEnabledEvents) {
        return;
      } else if (e.key === 'Backspace') {
        this.rotatePlane();
        return;
      }
      console.log(e);
      this.addTextMesh(this.textFont, e.key,
        -5 + Math.random() * 10,
        10 + Math.random() * 10,
        -5 + Math.random() * 10);
    };
  }

  init() {

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    document.body.style = 'overflow: hidden; margin: 0; background: #000;';

    const planeGeometry = new THREE.PlaneGeometry(20, 20, 32);
    const planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide});
    this.objects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.scene.add(this.objects.plane);

    const loader = new THREE.FontLoader();

    loader.load( 'assets/helvetiker_bold.json', (font) => {

      this.initPhysix();
      this.initEvents();

      this.textFont = font;
      this.initialized = true;
      this.isEnabledEvents = true;

    } );

    this.settingCamera();
    this.addGui();
    this.addLight();

    const animate = () => {
      requestAnimationFrame(animate);

      if (this.initialized) {

        if (this.planeAnimation.update) {
          this.planeAnimation.step += 0.05;
          this.planeAnimation.to = this.planeAnimation.from + this.planeAnimation.step;
          this.physix.plane.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), this.planeAnimation.to);
          if (this.planeAnimation.to >= 0) {
            this.planeAnimation.update = false;
            this.planeAnimation.step = 0.0;
            this.planeAnimation.to = 0.0;
            this.isEnabledEvents = true;
          }
        }

        this.updatePhysix();
        this.cannonDebugRenderer.update();
      }

      this.renderer.render( this.scene, this.camera );
    };
    animate();

  }

}

new Scene().init();
