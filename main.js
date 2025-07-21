import * as THREE from 'three';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(0, 3, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg')
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// Teapot
const geometry = new TeapotGeometry(0.8, 10);
const material = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 1.0,
    roughness: 0.1
});
const teapot = new THREE.Mesh(geometry, material);
teapot.position.y = 2;
scene.add(teapot);

// Seagulls
const loader = new GLTFLoader();
const mixers = [];

loader.load('/models/seagull.glb', (gltf) => {
    const model = gltf.scene;
    const animations = gltf.animations;

    for (let i = 0; i < 5; i++) {
        const seagull = model.clone();
        seagull.position.set(
            Math.random() * 100 - 50,
            Math.random() * 10 + 5,
            Math.random() * 100 - 50
        );
        seagull.scale.set(0.1, 0.1, 0.1);
        scene.add(seagull);

        const mixer = new THREE.AnimationMixer(seagull);
        const action = mixer.clipAction(animations[0]);
        action.play();
        mixers.push({ mixer, seagull });
    }
});

// Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('/textures/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = -Math.PI / 2;
scene.add(water);

// Sky
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

const effectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: renderer.toneMappingExposure
};

function updateSky() {
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = effectController.turbidity;
    uniforms['rayleigh'].value = effectController.rayleigh;
    uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms['sunPosition'].value.copy(sun);

    renderer.toneMappingExposure = effectController.exposure;
    renderer.render(scene, camera);
}

updateSky();

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Mouse
const mouse = {
    x: 0,
    y: 0
};

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

// Animation
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update teapot rotation
    teapot.rotation.x += (mouse.y * 0.5 - teapot.rotation.x) * 0.05;
    teapot.rotation.y += (mouse.x * 0.5 - teapot.rotation.y) * 0.05;

    // Animate water
    water.material.uniforms['time'].value += 1.0 / 600.0;

    // Animate seagulls
    const delta = clock.getDelta();
    for (const { mixer, seagull } of mixers) {
        mixer.update(delta);
        seagull.position.x += 0.1;
        if (seagull.position.x > 50) {
            seagull.position.x = -50;
        }
    }

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

// Handle window resize
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});