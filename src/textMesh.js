import * as THREE from 'three';
import CANNON from 'cannon';

export class TextMesh {
  constructor(char, font, position) {

    this.mesh = null;
    this.position = position;
    this.options = {
      textGeometry: new THREE.TextGeometry(char, {
        font: font,
        size: 2,
        height: 0.1,
        curveSegments: 10
      }),
      textMaterial: new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: false, side: THREE.DoubleSide }),
    };

  }
  getMesh() {

    const {
      textGeometry,
      textMaterial
    } = this.options;

    textGeometry.center();
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.x = this.position.x;
    textMesh.position.y = this.position.y;
    textMesh.position.z = this.position.z;
    this.mesh = textMesh;

    return textMesh;

  }
  getPhysix() {

    const textShape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.1));
    const textPhysixBody = new CANNON.Body({
      mass: 1,
      position: this.mesh.position,
      shape: textShape
    });

    textPhysixBody.addEventListener('collide', function () {

      if (textPhysixBody.onceVelocity === undefined) {
        textPhysixBody.onceVelocity = true;
        textPhysixBody.velocity.set(
          -10 + Math.random() * 20,
          5 + Math.random() * 10,
          -10 + Math.random() * 20
        );
      }

    });
    return textPhysixBody;

  }
}
