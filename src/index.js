// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';
import CANNON from 'cannon';
import { TweenMax } from 'gsap/TweenMax';
import './cannonDebug';
import { TextMesh } from './textMesh';

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.cannonDebugRenderer = null;

    this.stats = null;

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
      speed: 1,
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

    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.top = '0px';

    document.body.appendChild(this.stats.domElement);
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

  addTextMesh(font, char, position) {

    const text = new TextMesh(char, font, position);
    const textMesh = text.getMesh();
    const textPhysix = text.getPhysix();

    this.scene.add(textMesh);
    this.objects.textMeshes.push(textMesh);

    this.world.addBody(textPhysix);
    this.physix.textMeshes.push(textPhysix);
  }

  rotatePlane() {
    this.planeAnimation.update = true;
    this.isEnabledEvents = false;

    TweenMax.to(this.planeAnimation, this.planeAnimation.speed, {
      from: this.planeAnimation.to, yoyo: true, repeat: 1, onComplete: () => {
        this.planeAnimation.update = false;
        this.isEnabledEvents = true;
      },
      // ease: Expo.easeInOut
    });

    // for (let i = 0; i < this.physix.textMeshes.length; i++) {
    //   this.physix.textMeshes[i].velocity.set(10, 10, 10);
    // }

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
      this.addTextMesh(this.textFont, e.key, new THREE.Vector3(-5 + Math.random() * 10, 10 + Math.random() * 10, -5 + Math.random() * 10));
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

      this.stats.begin();

      if (this.initialized) {

        if (this.planeAnimation.update) {
          this.physix.plane.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), this.planeAnimation.from);
        }

        this.updatePhysix();
        // this.cannonDebugRenderer.update();
      }

      this.stats.end();

      this.renderer.render( this.scene, this.camera );
    };
    animate();

  }

}

new Scene().init();
