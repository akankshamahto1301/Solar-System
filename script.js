import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.module.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 30, 80);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const sunLight = new THREE.PointLight(0xffffff, 2, 300);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
scene.add(ambientLight);

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Sun
const sunTexture = textureLoader.load("textures/sun.jpg");
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);

// Planets data
const planets = [
  {
    name: "Mercury",
    radius: 2,
    distance: 20,
    speed: 0.1,
    texture: "textures/mercury.jpg",
  },
  {
    name: "Venus",
    radius: 3,
    distance: 30,
    speed: 0.08,
    texture: "textures/venus.jpg",
  },
  {
    name: "Earth",
    radius: 3.5,
    distance: 40,
    speed: 0.06,
    texture: "textures/earth.jpg",
  },
  {
    name: "Mars",
    radius: 2.5,
    distance: 50,
    speed: 0.05,
    texture: "textures/mars.jpg",
  },
  {
    name: "Jupiter",
    radius: 6,
    distance: 70,
    speed: 0.04,
    texture: "textures/Jupiter.png",
  },
  {
    name: "Saturn",
    radius: 5,
    distance: 90,
    speed: 0.03,
    texture: "textures/saturn.jpg",
  },
  {
    name: "Uranus",
    radius: 4,
    distance: 110,
    speed: 0.02,
    texture: "textures/uranus.jpg",
  },
  {
    name: "Neptune",
    radius: 4,
    distance: 130,
    speed: 0.01,
    texture: "textures/neptune.png",
  },
];

// Create planets and orbits
const planetMeshes = [];
const orbitLines = [];

planets.forEach((planet, index) => {
  const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
  const texture = textureLoader.load(planet.texture);
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(planet.distance, 0, 0);
  mesh.userData = {
    name: planet.name,
    distance: planet.distance,
    angle: 0,
    speed: planet.speed,
  };
  scene.add(mesh);
  planetMeshes.push(mesh);

  // Orbit path
  const orbitGeometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * planet.distance,
        0,
        Math.sin(angle) * planet.distance
      )
    );
  }
  orbitGeometry.setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbitLine);
  orbitLines.push(orbitLine);
});

// Background stars
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 1000; i++) {
  starVertices.push(
    THREE.MathUtils.randFloatSpread(2000),
    THREE.MathUtils.randFloatSpread(2000),
    THREE.MathUtils.randFloatSpread(2000)
  );
}
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Slider controls for individual planets
const speedSliders = Array.from(
  document.querySelectorAll('#controls input[type="range"]')
);
speedSliders.forEach((slider, index) => {
  if (slider.id !== "globalSpeed") {
    slider.addEventListener("input", () => {
      planetMeshes[index].userData.speed = parseFloat(slider.value);
    });
  }
});

// Pause/Resume
const pauseResumeButton = document.getElementById("pauseResume");
let isPaused = false;
pauseResumeButton.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseResumeButton.textContent = isPaused ? "Resume" : "Pause";
});

// Theme toggle
const themeToggleButton = document.getElementById("themeToggle");
let isDarkTheme = true;
themeToggleButton.addEventListener("click", () => {
  isDarkTheme = !isDarkTheme;
  document.body.style.background = isDarkTheme ? "#000" : "#fff";
  document.body.style.color = isDarkTheme ? "#fff" : "#000";
  document.getElementById("controls").style.background = isDarkTheme
    ? "rgba(0, 0, 0, 0.7)"
    : "rgba(255, 255, 255, 0.7)";
});

// Global speed multiplier
let globalSpeedMultiplier = 1;
const globalSpeedSlider = document.getElementById("globalSpeed");
const globalSpeedLabel = document.getElementById("globalSpeedValue");

globalSpeedSlider.addEventListener("input", (e) => {
  globalSpeedMultiplier = parseFloat(e.target.value);
  globalSpeedLabel.textContent = globalSpeedMultiplier.toFixed(2);
});

// Tooltip
const tooltip = document.getElementById("tooltip");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Camera controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
renderer.domElement.addEventListener("mousedown", () => {
  isDragging = true;
});
renderer.domElement.addEventListener("mouseup", () => {
  isDragging = false;
});
renderer.domElement.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };
    camera.position.x += deltaMove.x * 0.1;
    camera.position.y -= deltaMove.y * 0.1;
    camera.lookAt(0, 0, 0);
  }
  previousMousePosition = { x: event.clientX, y: event.clientY };

  // Tooltip logic
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);
  if (intersects.length > 0) {
    const planet = intersects[0].object;
    tooltip.style.display = "block";
    tooltip.textContent = planet.userData.name;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  } else {
    tooltip.style.display = "none";
  }
});

renderer.domElement.addEventListener("wheel", (event) => {
  camera.position.z += event.deltaY * 0.1;
  camera.position.z = Math.max(20, Math.min(200, camera.position.z));
  camera.lookAt(0, 0, 0);
});

// Animation
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    const delta = clock.getDelta();
    planetMeshes.forEach((planet) => {
      planet.userData.angle +=
        planet.userData.speed * globalSpeedMultiplier * delta;
      planet.position.x =
        planet.userData.distance * Math.cos(planet.userData.angle);
      planet.position.z =
        planet.userData.distance * Math.sin(planet.userData.angle);
      planet.rotation.y += 0.01;
    });
  }
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
