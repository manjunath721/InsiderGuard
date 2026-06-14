import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normal;
    vPosition = position;
    float displacement = 0.1 * sin(time + position.y * 2.0) + 0.05 * sin(time * 2.0 + position.x * 3.0);
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec3 vPosition;

  void main() {
    float mixFactor = (sin(vPosition.x * 2.0 + time) + 1.0) * 0.5;
    vec3 finalColor = mix(color1, color2, mixFactor);
    gl_FragColor = vec4(finalColor, 0.5);
  }
`;

interface NeuralMeshProps {
  className?: string;
}

export function NeuralMesh({ className }: NeuralMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(2.5, 3);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      wireframe: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        time: { value: 0.0 },
        color1: { value: new THREE.Color(0xBF5AF2) },
        color2: { value: new THREE.Color(0x0A84FF) },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Invisible hit plane for mouse interaction
    const hitGeometry = new THREE.PlaneGeometry(1000, 1000);
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hitPlane = new THREE.Mesh(hitGeometry, hitMaterial);
    hitPlane.position.z = 0;
    scene.add(hitPlane);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      clock.getDelta();
      const elapsed = clock.getElapsedTime();

      material.uniforms.time.value = elapsed;
      mesh.rotation.y += 0.002;
      mesh.rotation.x += 0.001;

      // Mouse interaction
      mouse.set(mouseRef.current.x, mouseRef.current.y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(hitPlane);
      if (intersects.length > 0) {
        const scale = 1 + (1 - intersects[0].distance / 5) * 0.3;
        mesh.scale.setScalar(scale);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  );
}
