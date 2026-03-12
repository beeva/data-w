"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const params = {
  shape: "Cube" as const,
  backgroundColor: "#13181f",
  lineColor: "#92A1B1",
  dotColor: "#22D3EE",
  useFog: true,
  fogDensity: 0.02,
  useBloom: false,
  bloomThreshold: 0.1,
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  onlyExternal: true,
  speed: 0.1311,
  dotLength: 0.0181,
  dotDensity: 2.0,
};

function isPointInside(v: THREE.Vector3, shapeType: string): boolean {
  const x = v.x,
    y = v.y,
    z = v.z;
  const r = 12;
  switch (shapeType) {
    case "Cube":
      return Math.abs(x) < r && Math.abs(y) < r && Math.abs(z) < r;
    case "Sphere":
      return x * x + y * y + z * z < r * r;
    case "Pyramid":
      if (y < -r || y > r) return false;
      return (
        Math.abs(x) < r * 2 * ((r - y) / (2 * r)) &&
        Math.abs(z) < r * 2 * ((r - y) / (2 * r))
      );
    case "Hexagon":
      if (Math.abs(y) > r) return false;
      return Math.abs(x) * 0.866 + Math.abs(z) * 0.5 < r && Math.abs(x) < r;
    case "Torus": {
      const tubeRadius = 4,
        mainRadius = 10;
      const distXZ = Math.sqrt(x * x + z * z) - mainRadius;
      return distXZ * distXZ + y * y < tubeRadius * tubeRadius;
    }
    default:
      return Math.abs(x) < r && Math.abs(y) < r && Math.abs(z) < r;
  }
}

function isSurface(v: THREE.Vector3, shapeType: string, step: number): boolean {
  if (!isPointInside(v, shapeType)) return false;
  const dirs = [
    new THREE.Vector3(step, 0, 0),
    new THREE.Vector3(-step, 0, 0),
    new THREE.Vector3(0, step, 0),
    new THREE.Vector3(0, -step, 0),
    new THREE.Vector3(0, 0, step),
    new THREE.Vector3(0, 0, -step),
  ];
  for (const d of dirs) {
    const neighbor = v.clone().add(d);
    if (!isPointInside(neighbor, shapeType)) return true;
  }
  return false;
}

function createShapeGeometry(
  shapeType: string,
  onlyExternal: boolean,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const attributes: number[] = [];
  const step = 2;
  const maxSegments = 6000;
  let currentPos = new THREE.Vector3(0, 0, 0);
  let currentDist = 0;

  const findStartPoint = (): THREE.Vector3 => {
    const p = new THREE.Vector3();
    for (let k = 0; k < 200; k++) {
      p.set(
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 26,
      )
        .round()
        .multiplyScalar(1);
      p.x = Math.round(p.x / step) * step;
      p.y = Math.round(p.y / step) * step;
      p.z = Math.round(p.z / step) * step;
      if (onlyExternal) {
        if (isSurface(p, shapeType, step)) return p;
      } else {
        if (isPointInside(p, shapeType)) return p;
      }
    }
    return new THREE.Vector3(0, 0, 0);
  };

  currentPos = findStartPoint();

  const dirs = [
    new THREE.Vector3(step, 0, 0),
    new THREE.Vector3(-step, 0, 0),
    new THREE.Vector3(0, step, 0),
    new THREE.Vector3(0, -step, 0),
    new THREE.Vector3(0, 0, step),
    new THREE.Vector3(0, 0, -step),
  ];

  for (let i = 0; i < maxSegments; i++) {
    const dirIndex = Math.floor(Math.random() * 6);
    const direction = dirs[dirIndex];
    const nextPos = currentPos.clone().add(direction);
    let isValid = false;
    if (onlyExternal) {
      if (isSurface(nextPos, shapeType, step)) isValid = true;
    } else {
      if (isPointInside(nextPos, shapeType)) isValid = true;
    }
    if (isValid) {
      positions.push(
        currentPos.x,
        currentPos.y,
        currentPos.z,
        nextPos.x,
        nextPos.y,
        nextPos.z,
      );
      attributes.push(currentDist, currentDist + step);
      currentDist += step;
      currentPos.copy(nextPos);
    } else {
      currentDist += 50;
      currentPos = findStartPoint();
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "lineDistance",
    new THREE.Float32BufferAttribute(attributes, 1),
  );
  return geometry;
}

const vertexShader = `
  attribute float lineDistance;
  varying float vDistance;
  void main() {
    vDistance = lineDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 colorLine;
  uniform vec3 colorDot;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDotLength;
  uniform float uDotRepeat;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform bool uUseFog;
  varying float vDistance;
  void main() {
    float alpha = 0.2;
    float distanceState = vDistance - uTime * uSpeed * 10.0;
    float flow = mod(distanceState, uDotRepeat * 10.0);
    float lengthVal = (uDotRepeat * 10.0) * uDotLength;
    float signal = smoothstep((uDotRepeat * 10.0) - lengthVal, (uDotRepeat * 10.0), flow);
    if(flow < (uDotRepeat * 10.0) - lengthVal) signal = 0.0;
    vec3 finalColor = mix(colorLine, colorDot, signal);
    float finalAlpha = max(alpha, signal);
    gl_FragColor = vec4(finalColor, finalAlpha);
    if (uUseFog) {
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = exp2(-uFogDensity * uFogDensity * depth * depth * 1.442695);
      fogFactor = clamp(fogFactor, 0.0, 1.0);
      gl_FragColor.rgb = mix(uFogColor, gl_FragColor.rgb, fogFactor);
    }
  }
`;

export default function CTASceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let mounted = true;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let composer: InstanceType<
      typeof import("three/examples/jsm/postprocessing/EffectComposer.js").EffectComposer
    >;
    let bloomPass: InstanceType<
      typeof import("three/examples/jsm/postprocessing/UnrealBloomPass.js").UnrealBloomPass
    >;
    let mesh: THREE.LineSegments;
    let material: THREE.ShaderMaterial;
    let controls: InstanceType<
      typeof import("three/examples/jsm/controls/OrbitControls.js").OrbitControls
    >;
    let clock: THREE.Clock;
    let animationId: number;

    async function init() {
      const [
        EffectComposerMod,
        RenderPassMod,
        UnrealBloomPassMod,
        OrbitControlsMod,
      ] = await Promise.all([
        import("three/examples/jsm/postprocessing/EffectComposer.js"),
        import("three/examples/jsm/postprocessing/RenderPass.js"),
        import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
        import("three/examples/jsm/controls/OrbitControls.js"),
      ]);

      if (!mounted || !container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      scene = new THREE.Scene();
      // No solid background — transparent so CTA section shows through
      scene.background = null;
      scene.fog = new THREE.FogExp2(
        new THREE.Color(params.backgroundColor),
        params.fogDensity,
      );

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.set(0, -1, 35);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.domElement.style.pointerEvents = "none";
      container.appendChild(renderer.domElement);

      const { OrbitControls: OrbitControlsClass } = OrbitControlsMod;
      controls = new OrbitControlsClass(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      // No mouse interaction — scroll and move pass through to the page
      controls.enableRotate = false;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enabled = false; // fully disable so no pointer capture

      const RenderPass = RenderPassMod.RenderPass;
      const renderScene = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPassMod.UnrealBloomPass(
        new THREE.Vector2(width, height),
        1.5,
        0.4,
        0.85,
      );
      bloomPass.threshold = params.bloomThreshold;
      bloomPass.strength = params.bloomStrength;
      bloomPass.radius = params.bloomRadius;

      composer = new EffectComposerMod.EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          colorLine: { value: new THREE.Color(params.lineColor) },
          colorDot: { value: new THREE.Color(params.dotColor) },
          uTime: { value: 0 },
          uSpeed: { value: params.speed },
          uDotLength: { value: params.dotLength },
          uDotRepeat: { value: params.dotDensity },
          uFogColor: { value: new THREE.Color(params.backgroundColor) },
          uFogDensity: { value: params.fogDensity },
          uUseFog: { value: params.useFog },
        },
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.LineSegments(
        createShapeGeometry(params.shape, params.onlyExternal),
        material,
      );
      scene.add(mesh);

      clock = new THREE.Clock();

      function animate() {
        if (!mounted) return;
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        material.uniforms.uTime.value = time;
        controls.update();
        if (params.useBloom) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
      }
      animate();

      const onResize = () => {
        if (!container || !mounted) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animationId);
        controls.dispose();
        renderer.dispose();
        if (container && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        material.dispose();
        mesh.geometry.dispose();
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => {
      if (fn) cleanup = fn;
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[280px] w-full overflow-hidden pointer-events-none"
    />
  );
}
