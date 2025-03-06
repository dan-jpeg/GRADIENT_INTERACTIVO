import * as THREE from 'three';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Define uniforms
const uniforms = {
    u_time: { value: 0.0 },
    u_mouse: { value: new THREE.Vector2() },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_click: { value: 0.0 }
};

// GLSL Fragment Shader
const fragmentShader = `
precision mediump float;

uniform float u_time;
uniform float u_click;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
varying vec2 vUv;


float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    uv *= aspect;

    float mouseInfluence = distance(u_mouse * aspect, uv) * 2.0;
    mouseInfluence = 1.0 - smoothstep(0.0, 1.0, mouseInfluence);
    
  
    float speedMultiplier = mix(1.0, 3.0, u_click);

    vec2 movement = vec2(u_time * 0.1 * speedMultiplier, u_time * 0.05 * speedMultiplier);
    float smoke = fbm(uv * 3.0 + movement);
    smoke += fbm(uv * 2.0 - movement * 1.4) * 0.5;
    smoke += mouseInfluence * 0.2;

    vec3 color1 = vec3(0.7, 0.75, 0.8);
    vec3 color2 = vec3(0.2, 0.23, 0.25);
    vec3 background = vec3(0.5, 0.1, 0.33);

    vec3 finalColor = mix(color1, color2, smoke);
    finalColor = mix(background, finalColor, smoothstep(0.1, 0.9, smoke + mouseInfluence * 0.3));

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// GLSL Vertex Shader (Passes UV)
const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Create Plane Geometry with ShaderMaterial
const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    uniforms
});
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Animate Scene
function animate() {
    uniforms.u_time.value += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Handle Mouse Movement
window.addEventListener('mousemove', (event) => {
    uniforms.u_mouse.value.x = event.clientX / window.innerWidth;
    uniforms.u_mouse.value.y = 1.0 - event.clientY / window.innerHeight;
});

// Resize Handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

// Start Animation
animate();