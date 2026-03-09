"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SEGMENT_COUNT = 150;

export default function DataTunnelCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let mounted = true;

    let animationId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let composer: InstanceType<
      typeof import("three/examples/jsm/postprocessing/EffectComposer.js").EffectComposer
    >;
    let contentGroup: THREE.Group;
    let backgroundLines: THREE.Line[] = [];
    let signals: Array<{
      mesh: THREE.Line;
      laneIndex: number;
      speed: number;
      progress: number;
      history: THREE.Vector3[];
      assignedColor: THREE.Color;
    }> = [];
    let bloomPass: InstanceType<
      typeof import("three/examples/jsm/postprocessing/UnrealBloomPass.js").UnrealBloomPass
    >;
    let bgMaterial: THREE.LineBasicMaterial;
    let signalMaterial: THREE.LineBasicMaterial;
    let signalColorObj1: THREE.Color;
    let signalColorObj2: THREE.Color;
    let signalColorObj3: THREE.Color;

    const params = {
      colorBg: "#060a14",
      colorLine: "#373f48",
      colorSignal: "#0db8d1",
      useColor2: true,
      colorSignal2: "#3b82f6",
      useColor3: true,
      colorSignal3: "#6366f1",
      lineCount: 34,
      globalRotation: 0,
      positionX: 0,
      positionY: 0,
      spreadHeight: 100,
      spreadDepth: 0,
      curveLength: 250,
      straightLength: 200,
      curvePower: 0.4,
      waveSpeed: 2.48,
      waveHeight: 5,
      lineOpacity: 0.02,
      signalCount: 200,
      speedGlobal: 0.3,
      trailLength: 9,
      bloomStrength: 3,
      bloomRadius: 0.5,
    };
    params.positionX = (params.curveLength - params.straightLength) / 2;

    let cleanupFn: (() => void) | null = null;

    async function init() {
      if (!mounted) return;
      const { EffectComposer } =
        await import("three/examples/jsm/postprocessing/EffectComposer.js");
      const { RenderPass } =
        await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { UnrealBloomPass } =
        await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
      if (!mounted) return;

      const width = container?.clientWidth || 0;
      const height = container?.clientHeight || 0;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(params.colorBg);
      scene.fog = new THREE.FogExp2(params.colorBg, 0.002);

      camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
      camera.position.set(0, 0, 90);
      camera.lookAt(0, 0, 0);

      // alpha: false so the canvas is opaque and scene.background matches the sample (no CSS blend)
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container?.appendChild(renderer.domElement);

      contentGroup = new THREE.Group();
      contentGroup.position.set(params.positionX, params.positionY, 0);
      scene.add(contentGroup);

      const renderScene = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        1.5,
        0.4,
        0.85,
      );
      bloomPass.threshold = 0;
      bloomPass.strength = params.bloomStrength;
      bloomPass.radius = params.bloomRadius;

      composer = new EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);

      function getPathPoint(
        t: number,
        lineIndex: number,
        time: number,
      ): THREE.Vector3 {
        const totalLen = params.curveLength + params.straightLength;
        const currentX = -params.curveLength + t * totalLen;
        let y = 0;
        let z = 0;
        const spreadFactor = (lineIndex / params.lineCount - 0.5) * 2;

        if (currentX < 0) {
          const ratio = (currentX + params.curveLength) / params.curveLength;
          let shapeFactor = (Math.cos(ratio * Math.PI) + 1) / 2;
          shapeFactor = Math.pow(shapeFactor, params.curvePower);
          y = spreadFactor * params.spreadHeight * shapeFactor;
          z = spreadFactor * params.spreadDepth * shapeFactor;
          const waveFactor = shapeFactor;
          const wave =
            Math.sin(time * params.waveSpeed + currentX * 0.1 + lineIndex) *
            params.waveHeight *
            waveFactor;
          y += wave;
        }
        return new THREE.Vector3(currentX, y, z);
      }

      bgMaterial = new THREE.LineBasicMaterial({
        color: params.colorLine,
        transparent: true,
        opacity: params.lineOpacity,
        depthWrite: false,
      });

      signalMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
      });
      signalColorObj1 = new THREE.Color(params.colorSignal);
      signalColorObj2 = new THREE.Color(params.colorSignal2);
      signalColorObj3 = new THREE.Color(params.colorSignal3);

      function pickSignalColor(): THREE.Color {
        const choices = [signalColorObj1];
        if (params.useColor2) choices.push(signalColorObj2);
        if (params.useColor3) choices.push(signalColorObj3);
        return choices[Math.floor(Math.random() * choices.length)];
      }

      function rebuildLines() {
        backgroundLines.forEach((l) => {
          contentGroup.remove(l);
          l.geometry.dispose();
        });
        backgroundLines = [];

        for (let i = 0; i < params.lineCount; i++) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(SEGMENT_COUNT * 3);
          geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3),
          );
          const line = new THREE.Line(geometry, bgMaterial);
          line.userData = { id: i };
          line.renderOrder = 0;
          contentGroup.add(line);
          backgroundLines.push(line);
        }
        rebuildSignals();
      }

      function rebuildSignals() {
        signals.forEach((s) => {
          contentGroup.remove(s.mesh);
          s.mesh.geometry.dispose();
        });
        signals = [];
        for (let i = 0; i < params.signalCount; i++) {
          createSignal();
        }
      }

      function createSignal() {
        const maxTrail = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxTrail * 3);
        const colors = new Float32Array(maxTrail * 3);
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const mesh = new THREE.Line(geometry, signalMaterial);
        mesh.frustumCulled = false;
        mesh.renderOrder = 1;
        contentGroup.add(mesh);
        signals.push({
          mesh,
          laneIndex: Math.floor(Math.random() * params.lineCount),
          speed: 0.2 + Math.random() * 0.5,
          progress: Math.random(),
          history: [],
          assignedColor: pickSignalColor(),
        });
      }

      rebuildLines();

      const clock = new THREE.Clock();

      function animate() {
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        backgroundLines.forEach((line) => {
          const positions = line.geometry.attributes.position
            .array as Float32Array;
          const lineId = line.userData.id as number;
          for (let j = 0; j < SEGMENT_COUNT; j++) {
            const t = j / (SEGMENT_COUNT - 1);
            const vec = getPathPoint(t, lineId, time);
            positions[j * 3] = vec.x;
            positions[j * 3 + 1] = vec.y;
            positions[j * 3 + 2] = vec.z;
          }
          line.geometry.attributes.position.needsUpdate = true;
        });

        signals.forEach((sig) => {
          sig.progress += sig.speed * 0.005 * params.speedGlobal;
          if (sig.progress > 1.0) {
            sig.progress = 0;
            sig.laneIndex = Math.floor(Math.random() * params.lineCount);
            sig.history = [];
            sig.assignedColor = pickSignalColor();
          }
          const pos = getPathPoint(sig.progress, sig.laneIndex, time);
          sig.history.push(pos);
          if (sig.history.length > params.trailLength + 1) {
            sig.history.shift();
          }
          const positions = sig.mesh.geometry.attributes.position
            .array as Float32Array;
          const colors = sig.mesh.geometry.attributes.color
            .array as Float32Array;
          const drawCount = Math.max(1, params.trailLength);
          const currentLen = sig.history.length;
          for (let i = 0; i < drawCount; i++) {
            let index = currentLen - 1 - i;
            if (index < 0) index = 0;
            const p = sig.history[index] || new THREE.Vector3();
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
            let alpha = 1;
            if (params.trailLength > 0) {
              alpha = Math.max(0, 1 - i / params.trailLength);
            }
            colors[i * 3] = sig.assignedColor.r * alpha;
            colors[i * 3 + 1] = sig.assignedColor.g * alpha;
            colors[i * 3 + 2] = sig.assignedColor.b * alpha;
          }
          sig.mesh.geometry.setDrawRange(0, drawCount);
          sig.mesh.geometry.attributes.position.needsUpdate = true;
          sig.mesh.geometry.attributes.color.needsUpdate = true;
        });

        composer.render();
      }

      const onResize = () => {
        const w = container?.clientWidth || 0;
        const h = container?.clientHeight || 0;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        bloomPass.resolution.set(w, h);
      };

      window.addEventListener("resize", onResize);
      animate();

      cleanupFn = () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animationId);
        backgroundLines.forEach((l) => {
          contentGroup.remove(l);
          l.geometry.dispose();
        });
        bgMaterial.dispose();
        signals.forEach((s) => {
          contentGroup.remove(s.mesh);
          s.mesh.geometry.dispose();
        });
        signalMaterial.dispose();
        renderer.dispose();
        if (container?.contains(renderer.domElement)) {
          container?.removeChild(renderer.domElement);
        }
      };
    }

    init();
    return () => {
      mounted = false;
      cleanupFn?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0f1e]"
      aria-hidden
    />
  );
}
