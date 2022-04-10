import './style.css'
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MathUtils } from 'three';
import { Scene } from 'three';
import { Color } from 'three';

let camera, scene, renderer, thirdPersonCamera, cameraTop;
let controls, water, sun;
const loader = new GLTFLoader();
var goal, follow;
var coronaSafetyDistance = 100;

const boatInitPos = new THREE.Vector3(0, 0, 0);

var bullets = []
var Chests = []

var numChests = 10;
var numEnemies = 5;
var playSize = 1000;
var cameraType = "p"
var enemiesKilled = 0
var chestPicked = 0
// var health = 100
var text2
var numEnemiesLeft = numEnemies;
var numChestsLeft = numChests


class Boat {
  constructor() {
    loader.load('textures/player_boat/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(5, 5, 5);
      gltf.scene.position.set(0, 0, 0);
      this.boat = gltf.scene
      this.speed = {
        vel: 0,
        rot: 0
      }
      this.box = new THREE.Box3().setFromObject(this.boat);

      this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 5 });
      this.points = []
      this.points.push(0, 0, 0)
      this.points.push(0, 0, -400)
      this.lineGeometry = new THREE.BufferGeometry()
      this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.points, 3));
      this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
      this.health = 100
      scene.add(this.line)

    })

  }
  update() {
    if (this.boat) {
      this.boat.translateZ(-this.speed.vel)
      this.boat.rotation.y += this.speed.rot
      this.box.setFromObject(this.boat);

      this.line.translateZ(-this.speed.vel)
      this.line.rotation.y += this.speed.rot
    }
  }
}

class Enemy {
  constructor() {
    loader.load('textures/enemy_boat/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(2, 2, 2);

      var randx = MathUtils.randFloat(-playSize, playSize);
      var randz = MathUtils.randFloat(-playSize, playSize)
      var posToSet = new THREE.Vector3(randx, 0, randz)
      while (1) {
        var flag = false
        for (var i = 0; i < Enemies.length; i++) {
          if (Enemies[i].boat) {
            if (posToSet.distanceTo(Enemies[i].boat.position) <= 500)
              flag = true
          }
        }
        if (posToSet.distanceTo(boatInitPos) <= 1000) {
          flag = true
        }
        if (flag) {
          randx = MathUtils.randFloat(-playSize, playSize)
          randz = MathUtils.randFloat(-playSize, playSize)
          posToSet = new THREE.Vector3(randx, 0, randz)
        }
        else
          break;
      }
      gltf.scene.position.set(posToSet.x, posToSet.y + 10, posToSet.z);
      this.boat = gltf.scene
      this.speed = {
        vel: 0.5,
        rot: 0.005
      }
      this.box = new THREE.Box3().setFromObject(this.boat);
      this.alive = true;
      this.bullet = new Bullet(this.boat, 5);
      this.i = 0;

    })
  }
  update() {
    if (this.boat && this.alive) {
      this.boat.translateZ(-this.speed.vel)
      var playerPos = new THREE.Vector3(boat.boat.position.x, 0, boat.boat.position.z)
      var enemyPos = new THREE.Vector3(this.boat.position.x, 0, this.boat.position.z)
      var dir = new THREE.Vector3().subVectors(playerPos, enemyPos)
      var enemyFront = new THREE.Vector3
      this.boat.getWorldDirection(enemyFront)
      enemyFront.multiplyScalar(-1)
      var angle = Math.acos(enemyFront.dot(dir) / (enemyFront.length() * dir.length()))
      // var mul = dir.dot(enemyFront)
      // if (mul > 0)
      this.boat.rotation.y += this.speed.rot * angle
      // else if (mul < 0)
      //   this.boat.rotation.y -= this.speed.rot * angle
      // this.boat.rotation.y += angle
      this.box.setFromObject(this.boat);
      if (this.bullet.alive == false) {
        if (this.i < 1000)
          this.i++
        else {
          this.bullet = new Bullet(this.boat, 5);
          this.i = 0
        }
      }
      this.bullet.update();
    }
  }
}
const boat = new Boat();
const Enemies = [];

class Bullet {
  constructor(obj, speed) {
    loader.load('textures/fireball/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.position.set(obj.position.x, obj.position.y + 10, obj.position.z);
      this.bullet = gltf.scene

      var forward = new THREE.Vector3;
      obj.getWorldDirection(forward);
      forward.normalize();
      this.velocity = new THREE.Vector3(-forward.x * speed, forward.y, -forward.z * speed);

      this.alive = true;
      setTimeout(() => {
        this.alive = false
        scene.remove(this.bullet)
      }, 2000)
      this.box = new THREE.Box3().setFromObject(this.bullet);
    })
  }

  update() {
    if (this.bullet && this.alive) {
      this.box.setFromObject(this.bullet);
      var temp = this.bullet.position
      temp.add(this.velocity)
      this.bullet.position.set(temp.x, temp.y, temp.z);
    }
  }
}

class Chest {
  constructor() {
    loader.load('textures/chest/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.5, 0.5, 0.5);

      var randx = MathUtils.randFloat(-playSize, playSize)
      var randz = MathUtils.randFloat(-playSize, playSize)
      var posToSet = new THREE.Vector3(randx, 0, randz)
      while (1) {
        if (posToSet.distanceTo(boatInitPos) <= 1000) {
          randx = MathUtils.randFloat(-playSize, playSize)
          randz = MathUtils.randFloat(-playSize, playSize)
          posToSet = new THREE.Vector3(randx, 0, randz)
        }
        else
          break;
      }
      gltf.scene.position.set(posToSet.x, posToSet.y, posToSet.z);
      this.box = new THREE.Box3().setFromObject(gltf.scene);
      this.chest = gltf.scene
      this.alive = true
    })
  }
}

function collision() {
  for (var i = 0; i < Enemies.length; i++) {
    var enemy = Enemies[i];
    if (boat.boat && enemy.boat) {
      if (boat.box.intersectsBox(enemy.box)) {
        console.log("collision by boat")
        if (enemy.bullet.alive == true) {
          scene.remove(enemy.bullet.bullet)
          enemy.bullet.alive = false
        }
        scene.remove(enemy.boat)
        enemy.alive = false
        boat.health -= 10
        enemiesKilled += 1
        numEnemiesLeft -= 1
      }
    }
    if (boat.boat && enemy.bullet && enemy.bullet.alive) {
      if (boat.box.intersectsBox(enemy.bullet.box)) {
        console.log("collision by bullet")
        scene.remove(enemy.bullet.bullet)
        enemy.bullet.alive = false
        boat.health -= 5
      }
    }
  }
  for (var index = 0; index < bullets.length; index++) {
    if (bullets[index] == undefined) continue;
    if (bullets[index].alive == false) { bullets.splice(index, 1); continue; }
    if (bullets[index].bullet) {
      for (var i = 0; i < Enemies.length; i++) {
        var enemy = Enemies[i]
        if (!enemy.boat) continue;
        if (enemy.alive == false) continue;
        if (bullets[index].box.intersectsBox(enemy.box)) {
          console.log("collision")
          if (enemy.bullet.alive == true) {
            scene.remove(enemy.bullet.bullet)
            enemy.bullet.alive = false
          }
          scene.remove(enemy.boat)
          bullets[index].alive = false
          scene.remove(bullets[index].bullet)
          bullets.splice(index, 1);
          enemy.alive = false
          enemiesKilled += 1
          numEnemiesLeft -= 1
        }
      }
    }
  }

  for (var i = 0; i < Chests.length; i++) {
    if (Chests[i] == undefined) continue;
    if (Chests[i].alive == false) Chests.splice(i, 1);
    else {
      if (boat.boat && Chests[i].chest && Chests[i].box.intersectsBox(boat.box)) {
        Chests[i].alive = false
        scene.remove(Chests[i].chest)
        Chests.splice(i, 1);
        chestPicked += 1
        numChestsLeft -= 1
      }
    }
  }

}

init();
animate();
function generateEnemies(num) {
  for (var i = 0; i < num; i++) {
    var enemy = new Enemy();
    Enemies.push(enemy)
  }
  numEnemiesLeft = numEnemies
}

function generateChests(num) {
  for (var i = 0; i < num; i++) {
    var chest = new Chest();
    Chests.push(chest)
  }
  numChestsLeft = numChests
}

function init() {
  text2 = document.createElement('div');
  text2.style.position = 'absolute';
  //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
  text2.style.width = 200;
  text2.style.height = 300;
  text2.style.fontFamily = 'sans-serif';
  text2.style.color = '#fff';
  // text2.innerHTML = "Press 'Space' to start";
  text2.style.fontSize = '20px';
  text2.style.top = 20 + 'px';
  text2.style.left = 50 + 'px';
  document.body.appendChild(text2);
  //
  // boat = new Boat();
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  //
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 100, 100);

  cameraTop = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 1, 2000);
  cameraTop.position.set(0, 500, 0);
  cameraTop.lookAt(new THREE.Vector3(0, 0, 0));

  sun = new THREE.Vector3();
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 5.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;

  scene.add(water);

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 13;
  skyUniforms['rayleigh'].value = 3;
  skyUniforms['mieCoefficient'].value = 0.05;
  skyUniforms['mieDirectionalG'].value = 0.08;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky).texture;
  }

  generateChests(numChests);
  generateEnemies(numEnemies);

  updateSun();
  const waterUniforms = water.material.uniforms;
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('keydown', function (e) {
    if (e.key.toLowerCase() == "w")
      boat.speed.vel = 1.500
    if (e.key.toLowerCase() == "s")
      boat.speed.vel = -1.500
    if (e.key.toLowerCase() == "a")
      boat.speed.rot = 0.02
    if (e.key.toLowerCase() == "d")
      boat.speed.rot = -0.02
    if (e.key.toLowerCase() == " ") {
      var bullet = new Bullet(boat.boat, 10);
      bullets.push(bullet)
    }
    if (e.key.toLowerCase() == "c") {
      if (cameraType == "p")
        cameraType = "t"
      else
        cameraType = "p"
    }
    if (e.key.toLowerCase() == 'r') {
      if (boat.health <= 0)
        this.location.reload()
    }
  })
  window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() == "a" || e.key.toLowerCase() == "d")
      boat.speed.rot = 0
    if (e.key.toLowerCase() == "w" || e.key.toLowerCase() == "s")
      boat.speed.vel = 0
  })

  goal = new THREE.Object3D;
  follow = new THREE.Object3D;
  goal.position.z = -coronaSafetyDistance;
  goal.add(camera);
}



function cameraUpdate() {
  if (boat.boat) {
    var t = new THREE.Vector3
    boat.boat.getWorldDirection(t);
    t.normalize();
    t.x = -t.x * 20000
    t.z = -t.z * 20000
    t.y = -t.y * 20000
    t.add(boat.boat.position)
    camera.lookAt(t);
    var boatPos = new THREE.Vector3(boat.boat.position.x, 0, boat.boat.position.z);
    t.y = 0;
    t.normalize();
    t.x *= -200;
    t.z *= -200;
    boatPos.add(t);
    boatPos.y = 100;
    camera.position.set(boatPos.x, boatPos.y, boatPos.z)

    cameraTop.position.set(boatPos.x, 500, boatPos.z)
    cameraTop.lookAt(boat.boat.position)

  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
  boat.update();
  collision();
  cameraUpdate();

  for (var index = 0; index < bullets.length; index += 1) {
    if (bullets[index] == undefined) continue;
    if (bullets[index].alive == false) {
      bullets.splice(index, 1);
      continue;
    }
    if (bullets[index].bullet)
      bullets[index].update();
  }
  for (var i = 0; i < Enemies.length; i++) {
    if (Enemies[i] == undefined) continue;
    if (Enemies[i].alive == false) {
      Enemies.splice(i, 1);
      continue;
    }
    if (Enemies[i].boat)
      Enemies[i].update();
  }
  if (boat.health >= 0) {
    text2.style.top = 20 + 'px';
    text2.style.left = 50 + 'px';
    text2.innerHTML = "Enemies Killed: " + enemiesKilled + "\t" + "Chests Picked: " + chestPicked + "\t" + "Health: " + boat.health;
  }
  else {
    text2.style.top = 450 + 'px'
    text2.style.left = 450 + 'px'
    text2.innerHTML = "You died Press\'R\' to start again. You killed: " + enemiesKilled + " enemines and collected: " + chestPicked + " chests."
  }
  if (numEnemiesLeft <= 0)
    generateEnemies(numEnemies)
  if (numChestsLeft <= 0)
    generateChests(numChests)
}

function render() {
  water.material.uniforms['time'].value += 1.0 / 60.0;
  // renderer.render(scene, cameraTop);
  if (boat.health <= 0) {
    var scene2 = new Scene()
    scene2.background = new Color("black");
    renderer.render(scene2, camera)
    return
  }
  if (cameraType == "p")
    renderer.render(scene, camera);
  else
    renderer.render(scene, cameraTop);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}



