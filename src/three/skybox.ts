import * as THREE from 'three';
import { Scene } from '../model/scene';

export class Skybox {
  private scene: Scene;

  private topColor = 0xffffff;
  private bottomColor = 0xe9e9e9;
  private verticalOffset = 500;
  private sphereRadius = 4000;
  private widthSegments = 32;
  private heightSegments = 15;

  private vertexShader = [
    "varying vec3 vWorldPosition;",
    "void main() {",
    "  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
    "  vWorldPosition = worldPosition.xyz;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join('\n');

  private fragmentShader = [
    "uniform vec3 topColor;",
    "uniform vec3 bottomColor;",
    "uniform float offset;",
    "varying vec3 vWorldPosition;",
    "void main() {",
    "  float h = normalize( vWorldPosition + offset ).y;",
    "  gl_FragColor = vec4( mix( bottomColor, topColor, (h + 1.0) / 2.0), 1.0 );",
    "}"
  ].join('\n');

  constructor(scene: Scene) {
    this.scene = scene;
    this.init();
  }

  private init() {
    var uniforms = {
      topColor: {
        type: "c",
        value: new THREE.Color(this.topColor)
      },
      bottomColor: {
        type: "c",
        value: new THREE.Color(this.bottomColor)
      },
      offset: {
        type: "f",
        value: this.verticalOffset
      }
    }

    var skyGeo = new THREE.SphereGeometry(
      this.sphereRadius, this.widthSegments, this.heightSegments);
    var skyMat = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide
    });

    var sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }
}
