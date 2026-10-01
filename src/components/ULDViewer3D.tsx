import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useLang } from '../lib/i18n';
import type { ULDContainer } from '../types/air-freight';
import {
  RotateCcw,
  Play,
  Pause,
  DoorOpen,
  DoorClosed,
  Eye,
  ZoomIn,
  ZoomOut,
  Layers,
  Radio,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface ULDViewer3DProps {
  uld: ULDContainer;
}

// 3D Point & Projection helpers
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number; // depth
}

interface PolygonFace {
  pts: Point3D[];
  color: string;
  strokeColor?: string;
  lineWidth?: number;
  isWireframe?: boolean;
  normalZ?: number;
  label?: string;
  isHotspot?: boolean;
  hotspotType?: 'temp' | 'cargo' | 'power' | 'acid';
}

export const ULDViewer3D: React.FC<ULDViewer3DProps> = ({ uld }) => {
  const { isRtl } = useLang();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewer state
  const [rotationX, setRotationX] = useState<number>(0.35); // Pitch
  const [rotationY, setRotationY] = useState<number>(-0.65); // Yaw
  const [zoom, setZoom] = useState<number>(1.0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [isDoorOpen, setIsDoorOpen] = useState<boolean>(false);
  const [doorProgress, setDoorProgress] = useState<number>(0); // 0 (closed) to 1 (fully open)
  const [isInsideView, setIsInsideView] = useState<boolean>(false);
  const [customModelNotice, setCustomModelNotice] = useState<boolean>(false);

  // Drag interaction
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Smooth door animation
  useEffect(() => {
    let animId: number;
    const target = isDoorOpen ? 1 : 0;
    const animateDoor = () => {
      setDoorProgress((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.02) return target;
        return prev + diff * 0.15;
      });
      if (Math.abs(target - doorProgress) >= 0.02) {
        animId = requestAnimationFrame(animateDoor);
      }
    };
    animId = requestAnimationFrame(animateDoor);
    return () => cancelAnimationFrame(animId);
  }, [isDoorOpen, doorProgress]);

  // Auto rotation loop
  useEffect(() => {
    if (!isAutoRotate || isInsideView) return;
    let animId: number;
    const loop = () => {
      setRotationY((prev) => prev + 0.006);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotate, isInsideView]);

  // Reset camera when switching containers
  useEffect(() => {
    if (isInsideView) {
      setIsInsideView(false);
    }
  }, [uld.id]);

  // Camera Presets
  const setPresetView = (view: 'iso' | 'front' | 'side' | 'top' | 'inside') => {
    setIsAutoRotate(false);
    if (view === 'iso') {
      setIsInsideView(false);
      setRotationX(0.35);
      setRotationY(-0.65);
      setZoom(1.0);
    } else if (view === 'front') {
      setIsInsideView(false);
      setRotationX(0.05);
      setRotationY(0.0);
      setZoom(1.1);
    } else if (view === 'side') {
      setIsInsideView(false);
      setRotationX(0.05);
      setRotationY(Math.PI / 2);
      setZoom(1.1);
    } else if (view === 'top') {
      setIsInsideView(false);
      setRotationX(Math.PI / 2 - 0.1);
      setRotationY(0);
      setZoom(0.9);
    } else if (view === 'inside') {
      setIsInsideView(true);
      setIsDoorOpen(true);
      setRotationX(0.08);
      setRotationY(0.02);
      setZoom(2.1);
    }
  };

  // Mouse / Touch interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setRotationY((prev) => prev + dx * 0.008);
    setRotationX((prev) => Math.max(-1.2, Math.min(1.2, prev + dy * 0.008)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.6, Math.min(2.8, prev - e.deltaY * 0.0015)));
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsAutoRotate(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePos.current.x;
    const dy = e.touches[0].clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setRotationY((prev) => prev + dx * 0.008);
    setRotationX((prev) => Math.max(-1.2, Math.min(1.2, prev + dy * 0.008)));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // 3D Geometry Generation for each ULD Type
  const faces = useMemo(() => {
    const list: PolygonFace[] = [];
    const dp = doorProgress; // 0 to 1

    if (uld.code === 'AKE') {
      // AKE / LD3: Contoured half-width lower belly container
      // Dimensions normalized: W=1.8, H=1.6, D=1.6
      // Contoured lower right side
      const w = 0.9;
      const h = 0.8;
      const d = 0.8;
      const ch = 0.45; // chamfer offset

      // Exterior shell faces
      // Back face
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: w, y: -h, z: -d },
          { x: w, y: h - ch, z: -d },
          { x: w - ch, y: h, z: -d },
          { x: -w, y: h, z: -d },
        ],
        color: '#1a2736',
        strokeColor: '#38bdf8',
        lineWidth: 1.5,
      });

      // Left wall (vertical)
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: -w, y: -h, z: d },
          { x: -w, y: h, z: d },
          { x: -w, y: h, z: -d },
        ],
        color: '#162230',
        strokeColor: '#0ea5e9',
        lineWidth: 1.2,
      });

      // Right wall (upper vertical)
      list.push({
        pts: [
          { x: w, y: -h, z: -d },
          { x: w, y: h - ch, z: -d },
          { x: w, y: h - ch, z: d },
          { x: w, y: -h, z: d },
        ],
        color: '#1e2d3d',
        strokeColor: '#38bdf8',
        lineWidth: 1.2,
      });

      // Chamfer slope (Belly lobe contour)
      list.push({
        pts: [
          { x: w, y: h - ch, z: -d },
          { x: w - ch, y: h, z: -d },
          { x: w - ch, y: h, z: d },
          { x: w, y: h - ch, z: d },
        ],
        color: '#0f1722',
        strokeColor: '#22d3ee',
        lineWidth: 1.5,
      });

      // Top roof
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: w, y: -h, z: -d },
          { x: w, y: -h, z: d },
          { x: -w, y: -h, z: d },
        ],
        color: '#243447',
        strokeColor: '#38bdf8',
        lineWidth: 1.5,
      });

      // Bottom base floor
      list.push({
        pts: [
          { x: -w, y: h, z: -d },
          { x: w - ch, y: h, z: -d },
          { x: w - ch, y: h, z: d },
          { x: -w, y: h, z: d },
        ],
        color: '#0a0f16',
        strokeColor: '#0284c7',
        lineWidth: 1.5,
      });

      // Inside Cargo: Boxes stacked on the floor
      const cargoY = h - 0.05;
      list.push({
        pts: [
          { x: -0.6, y: cargoY - 0.45, z: -0.4 },
          { x: 0.2, y: cargoY - 0.45, z: -0.4 },
          { x: 0.2, y: cargoY - 0.45, z: 0.3 },
          { x: -0.6, y: cargoY - 0.45, z: 0.3 },
        ],
        color: '#b45309',
        strokeColor: '#f59e0b',
        lineWidth: 1.5,
        label: 'CARGO',
      });
      list.push({
        pts: [
          { x: -0.6, y: cargoY, z: 0.3 },
          { x: 0.2, y: cargoY, z: 0.3 },
          { x: 0.2, y: cargoY - 0.45, z: 0.3 },
          { x: -0.6, y: cargoY - 0.45, z: 0.3 },
        ],
        color: '#d97706',
        strokeColor: '#f59e0b',
        lineWidth: 1.2,
      });

      // Roll-up Curtain Door (Animated: rolls up towards the top as dp increases)
      const curtainH = (h * 2 - ch) * (1 - dp);
      if (curtainH > 0.05) {
        list.push({
          pts: [
            { x: -w, y: -h, z: d },
            { x: w, y: -h, z: d },
            { x: w, y: -h + curtainH, z: d },
            { x: -w, y: -h + curtainH, z: d },
          ],
          color: '#0284c7',
          strokeColor: '#38bdf8',
          lineWidth: 2,
          label: dp < 0.1 ? 'AKE ROLL CURTAIN' : 'CURTAIN ROLLING UP',
        });
      }
    } else if (uld.code === 'PMC') {
      // PMC: Heavy Duty 125x96 aircraft flat pallet with loaded cargo & netting
      const w = 1.35;
      const d = 1.05;

      // Base Pallet Plate
      list.push({
        pts: [
          { x: -w, y: 0.6, z: -d },
          { x: w, y: 0.6, z: -d },
          { x: w, y: 0.6, z: d },
          { x: -w, y: 0.6, z: d },
        ],
        color: '#334155',
        strokeColor: '#94a3b8',
        lineWidth: 2,
      });

      // Cargo load stacked high
      const loadH = 0.85;
      const loadY = 0.6 - loadH;
      list.push({
        pts: [
          { x: -w + 0.15, y: loadY, z: -d + 0.15 },
          { x: w - 0.15, y: loadY, z: -d + 0.15 },
          { x: w - 0.15, y: loadY, z: d - 0.15 },
          { x: -w + 0.15, y: loadY, z: d - 0.15 },
        ],
        color: dp > 0.5 ? '#0284c7' : '#0369a1',
        strokeColor: '#38bdf8',
        lineWidth: 1.5,
        label: 'HEAVY INDUSTRIAL CARGO',
      });
      // Front cargo face
      list.push({
        pts: [
          { x: -w + 0.15, y: 0.6, z: d - 0.15 },
          { x: w - 0.15, y: 0.6, z: d - 0.15 },
          { x: w - 0.15, y: loadY, z: d - 0.15 },
          { x: -w + 0.15, y: loadY, z: d - 0.15 },
        ],
        color: '#075985',
        strokeColor: '#38bdf8',
        lineWidth: 1.2,
      });

      // Restraint Netting / Straps (Wireframe diamonds overlay)
      if (dp < 0.8) {
        list.push({
          pts: [
            { x: -w + 0.1, y: loadY - 0.02, z: d - 0.1 },
            { x: w - 0.1, y: loadY - 0.02, z: d - 0.1 },
            { x: w - 0.1, y: 0.6, z: d - 0.1 },
            { x: -w + 0.1, y: 0.6, z: d - 0.1 },
          ],
          color: 'rgba(56, 189, 248, 0.15)',
          strokeColor: '#f59e0b',
          lineWidth: 2,
          isWireframe: true,
          label: 'IATA CERTIFIED RESTRAINT NET',
        });
      }
    } else if (uld.code === 'RKN') {
      // RKN Envirotainer e1: Active cold-chain biopharma container
      const w = 0.85;
      const h = 0.8;
      const d = 0.85;

      // Outer Shell
      // Back
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: w, y: -h, z: -d },
          { x: w, y: h, z: -d },
          { x: -w, y: h, z: -d },
        ],
        color: '#0f1f2e',
        strokeColor: '#14b8a6',
        lineWidth: 1.5,
      });
      // Left Wall
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: -w, y: -h, z: d },
          { x: -w, y: h, z: d },
          { x: -w, y: h, z: -d },
        ],
        color: '#0d2836',
        strokeColor: '#0d9488',
        lineWidth: 1.5,
      });
      // Right Wall
      list.push({
        pts: [
          { x: w, y: -h, z: -d },
          { x: w, y: -h, z: d },
          { x: w, y: h, z: d },
          { x: w, y: h, z: -d },
        ],
        color: '#132e3d',
        strokeColor: '#14b8a6',
        lineWidth: 1.5,
      });
      // Top with Compressor Cooling Vent Block
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: w, y: -h, z: -d },
          { x: w, y: -h, z: d },
          { x: -w, y: -h, z: d },
        ],
        color: '#115e59',
        strokeColor: '#2dd4bf',
        lineWidth: 2,
        label: 'ACTIVE COMPRESSOR UNIT',
      });
      // Floor
      list.push({
        pts: [
          { x: -w, y: h, z: -d },
          { x: w, y: h, z: -d },
          { x: w, y: h, z: d },
          { x: -w, y: h, z: d },
        ],
        color: '#042f2e',
        strokeColor: '#0f766e',
        lineWidth: 1.5,
      });

      // Inside: Euro Pallet holding Pharma Vaccines Boxes
      list.push({
        pts: [
          { x: -0.5, y: h - 0.45, z: -0.3 },
          { x: 0.5, y: h - 0.45, z: -0.3 },
          { x: 0.5, y: h - 0.45, z: 0.4 },
          { x: -0.5, y: h - 0.45, z: 0.4 },
        ],
        color: '#0f766e',
        strokeColor: '#2dd4bf',
        lineWidth: 1.5,
        label: 'BIOPHARMA PALLET (+4.2°C)',
      });

      // Hinged Insulated Door (Swings open on left hinge around Y axis)
      const doorAngle = dp * 1.8; // 0 to ~103 degrees
      const doorW = w * 1.8;
      const doorEndX = -w + Math.cos(doorAngle) * doorW;
      const doorEndZ = d + Math.sin(doorAngle) * doorW;

      list.push({
        pts: [
          { x: -w, y: -h + 0.1, z: d },
          { x: doorEndX, y: -h + 0.1, z: doorEndZ },
          { x: doorEndX, y: h - 0.05, z: doorEndZ },
          { x: -w, y: h - 0.05, z: d },
        ],
        color: '#14b8a6',
        strokeColor: '#5eead4',
        lineWidth: 2,
        label: dp < 0.1 ? 'RKN SEALED DOOR (+4°C)' : 'DOOR OPEN',
      });
    } else {
      // RAP: Multi-Pallet Mega Active Reefer Container
      const w = 1.35;
      const h = 0.85;
      const d = 0.95;

      // Outer Shell
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: w, y: -h, z: -d },
          { x: w, y: h, z: -d },
          { x: -w, y: h, z: -d },
        ],
        color: '#0c1a24',
        strokeColor: '#0284c7',
        lineWidth: 1.5,
      });
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: -w, y: -h, z: d },
          { x: -w, y: h, z: d },
          { x: -w, y: h, z: -d },
        ],
        color: '#071824',
        strokeColor: '#38bdf8',
        lineWidth: 1.5,
      });
      list.push({
        pts: [
          { x: w, y: -h, z: -d },
          { x: w, y: -h, z: d },
          { x: w, y: h, z: d },
          { x: w, y: h, z: -d },
        ],
        color: '#0d2232',
        strokeColor: '#38bdf8',
        lineWidth: 1.5,
      });
      list.push({
        pts: [
          { x: -w, y: -h, z: -d },
          { x: w, y: -h, z: -d },
          { x: w, y: -h, z: d },
          { x: -w, y: -h, z: d },
        ],
        color: '#0369a1',
        strokeColor: '#38bdf8',
        lineWidth: 2,
        label: 'DUAL REDUNDANT REEFER UNIT',
      });
      list.push({
        pts: [
          { x: -w, y: h, z: -d },
          { x: w, y: h, z: -d },
          { x: w, y: h, z: d },
          { x: -w, y: h, z: d },
        ],
        color: '#05131d',
        strokeColor: '#0284c7',
        lineWidth: 1.5,
      });

      // Inside: 5 Euro-pallets rows
      list.push({
        pts: [
          { x: -1.0, y: h - 0.4, z: -0.5 },
          { x: 1.0, y: h - 0.4, z: -0.5 },
          { x: 1.0, y: h - 0.4, z: 0.5 },
          { x: -1.0, y: h - 0.4, z: 0.5 },
        ],
        color: '#0f766e',
        strokeColor: '#2dd4bf',
        lineWidth: 1.5,
        label: '5x EURO PALLET BAYS',
      });

      // Bi-fold Double Doors
      const doorAngle = dp * 1.6;
      const halfW = w * 0.95;
      // Left Door
      const lDoorEndX = -w + Math.cos(doorAngle) * halfW;
      const lDoorEndZ = d + Math.sin(doorAngle) * halfW;
      list.push({
        pts: [
          { x: -w, y: -h + 0.1, z: d },
          { x: lDoorEndX, y: -h + 0.1, z: lDoorEndZ },
          { x: lDoorEndX, y: h - 0.05, z: lDoorEndZ },
          { x: -w, y: h - 0.05, z: d },
        ],
        color: '#0284c7',
        strokeColor: '#38bdf8',
        lineWidth: 2,
      });
      // Right Door
      const rDoorEndX = w - Math.cos(doorAngle) * halfW;
      const rDoorEndZ = d + Math.sin(doorAngle) * halfW;
      list.push({
        pts: [
          { x: w, y: -h + 0.1, z: d },
          { x: rDoorEndX, y: -h + 0.1, z: rDoorEndZ },
          { x: rDoorEndX, y: h - 0.05, z: rDoorEndZ },
          { x: w, y: h - 0.05, z: d },
        ],
        color: '#0284c7',
        strokeColor: '#38bdf8',
        lineWidth: 2,
        label: dp < 0.1 ? 'RAP DUAL BI-FOLD DOORS' : 'DOORS OPEN',
      });
    }

    return list;
  }, [uld.code, doorProgress]);

  // Render loop onto Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Camera transformation matrices
    const cx = width / 2;
    const cy = height / 2 + (isInsideView ? 30 : 10);
    const scale = Math.min(width, height) * 0.42 * zoom;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    // Project 3D point to 2D
    const project = (p: Point3D): ProjectedPoint => {
      // 1. Rotate Y (Yaw)
      let x1 = p.x * cosY - p.z * sinY;
      let z1 = p.x * sinY + p.z * cosY;
      let y1 = p.y;

      // 2. Rotate X (Pitch)
      let y2 = y1 * cosX - z1 * sinX;
      let z2 = y1 * sinX + z1 * cosX;
      let x2 = x1;

      // 3. Perspective division
      const cameraDistance = isInsideView ? 2.5 : 4.0;
      const depth = cameraDistance + z2;
      const fovFactor = cameraDistance / Math.max(0.5, depth);

      return {
        x: cx + x2 * scale * fovFactor,
        y: cy + y2 * scale * fovFactor,
        z: depth,
      };
    };

    // Calculate face depth for Painter's algorithm (Back to Front)
    const sortedFaces = faces
      .map((face) => {
        const proj = face.pts.map(project);
        const avgZ = proj.reduce((sum, p) => sum + p.z, 0) / proj.length;

        // Calculate normal for lighting/culling
        const v1x = proj[1].x - proj[0].x;
        const v1y = proj[1].y - proj[0].y;
        const v2x = proj[2].x - proj[0].x;
        const v2y = proj[2].y - proj[0].y;
        const crossZ = v1x * v2y - v1y * v2x;

        return {
          ...face,
          projected: proj,
          depth: avgZ,
          normalZ: crossZ,
        };
      })
      .sort((a, b) => b.depth - a.depth);

    // Draw grid floor in 3D
    const floorY = 0.85;
    const gridSize = 2.0;
    const gridLines = 8;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';

    for (let i = -gridLines; i <= gridLines; i++) {
      const p1 = project({ x: (i / gridLines) * gridSize, y: floorY, z: -gridSize });
      const p2 = project({ x: (i / gridLines) * gridSize, y: floorY, z: gridSize });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project({ x: -gridSize, y: floorY, z: (i / gridLines) * gridSize });
      const p4 = project({ x: gridSize, y: floorY, z: (i / gridLines) * gridSize });
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    // Draw 3D polygon faces
    sortedFaces.forEach((face) => {
      const pts = face.projected;
      if (pts.length < 3) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();

      if (!face.isWireframe) {
        ctx.fillStyle = face.color;
        ctx.fill();
      }

      if (face.strokeColor) {
        ctx.strokeStyle = face.strokeColor;
        ctx.lineWidth = face.lineWidth || 1;
        ctx.stroke();
      }

      // Render face label if available and face is facing camera
      if (face.label && face.normalZ !== undefined && face.normalZ < 0) {
        const center = pts.reduce(
          (acc, p) => ({ x: acc.x + p.x / pts.length, y: acc.y + p.y / pts.length }),
          { x: 0, y: 0 }
        );
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(face.label, center.x, center.y);
      }
    });

    // Draw Active Sensor Hotspot Beacons in 3D
    const hotspots = [
      {
        id: 'temp',
        label: uld.activeCooling ? '+4.2°C (GDP STABLE)' : 'AMBIENT HOLD',
        pos: { x: 0, y: -0.1, z: 0.1 },
        color: uld.activeCooling ? '#2dd4bf' : '#38bdf8',
      },
      {
        id: 'cargo',
        label: `${uld.volumeCbm} CBM · ${(uld.maxGrossWeightKg - uld.tareWeightKg).toLocaleString()} KG`,
        pos: { x: -0.2, y: 0.35, z: -0.1 },
        color: '#f59e0b',
      },
      {
        id: 'acid',
        label: 'NAFEZA ACID MATCHED',
        pos: { x: 0.3, y: 0.35, z: 0.2 },
        color: '#34d399',
      },
    ];

    hotspots.forEach((h) => {
      const p = project(h.pos);
      // Beacon ping
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = h.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tooltip pill in 3D space
      ctx.fillStyle = 'rgba(6, 11, 18, 0.85)';
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 1;
      const textW = ctx.measureText(h.label).width + 16;
      ctx.roundRect(p.x - textW / 2, p.y - 28, textW, 18, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(h.label, p.x, p.y - 19);
    });
  }, [faces, rotationX, rotationY, zoom, isInsideView, uld.activeCooling, uld.volumeCbm, uld.maxGrossWeightKg, uld.tareWeightKg]);

  // Request Animation Frame on render dependency change
  useEffect(() => {
    let animId: number;
    const update = () => {
      render();
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  return (
    <div className="relative rounded-3xl border border-cyan-500/30 bg-[#060b14] overflow-hidden shadow-2xl flex flex-col">
      {/* 3D Viewport Header Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-cyan-500/20 bg-[#09121f]/80 backdrop-blur-md gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white">
                {uld.code} · {isRtl ? 'المجسم التفاعلي 3D' : '3D DIGITAL TWIN'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                {isInsideView ? (isRtl ? 'وضع الاستكشاف الداخلي' : 'INSIDE VIEW') : (isRtl ? 'المظهر الخارجي' : 'ORBIT')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block">
              {isRtl ? 'اسحب للتدوير · حرّك العجلة للتكبير · افتح الباب لرؤية البضائع' : 'Drag to rotate · Scroll to zoom · Open door to inspect payload'}
            </span>
          </div>
        </div>

        {/* View mode actions */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {/* Open/Close Door Button */}
          <button
            type="button"
            onClick={() => setIsDoorOpen(!isDoorOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all shadow-md active:scale-95 ${
              isDoorOpen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/10'
                : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/10 hover:bg-cyan-500/30'
            }`}
          >
            {isDoorOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
            <span>{isDoorOpen ? (isRtl ? 'إغلاق الباب' : 'Close Door') : (isRtl ? 'فتح الباب / الستار' : 'Open Door')}</span>
          </button>

          {/* Step Inside Button */}
          <button
            type="button"
            onClick={() => setPresetView(isInsideView ? 'iso' : 'inside')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all active:scale-95 ${
              isInsideView
                ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                : 'glass-subcard border-white/10 text-slate-300 hover:text-white hover:border-cyan-400'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{isInsideView ? (isRtl ? 'الخروج للمظهر العام' : 'Exit to Orbit') : (isRtl ? 'الدخول للحاوية' : 'Step Inside')}</span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            title={isAutoRotate ? 'إيقاف الدوران' : 'تشغيل الدوران'}
            className="p-2 rounded-xl glass-subcard border-white/10 text-slate-300 hover:text-white hover:border-cyan-400"
          >
            {isAutoRotate ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={() => setPresetView('iso')}
            title="إعادة ضبط زاوية الرؤية"
            className="p-2 rounded-xl glass-subcard border-white/10 text-slate-300 hover:text-white hover:border-cyan-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport with Touch/Mouse Interaction */}
      <div className="relative h-[380px] sm:h-[440px] w-full cursor-grab active:cursor-grabbing select-none overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full object-cover"
        />

        {/* Floating Telemetry & Information HUD on Canvas */}
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10 pointer-events-none space-y-2">
          {/* Live Sensor Capsule */}
          <div className="glass-panel p-3 rounded-2xl border border-cyan-500/30 max-w-[230px] space-y-1.5 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>{isRtl ? 'حالة التيليميتري المباشرة' : 'LIVE TELEMETRY FEED'}</span>
              </span>
              <span className="text-emerald-400">ONLINE</span>
            </div>

            <div className="space-y-1 font-mono text-xs text-white">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">{isRtl ? 'درجة الحرارة:' : 'TEMP:'}</span>
                <span className="font-bold text-teal-300" dir="ltr">
                  {uld.activeCooling ? '+4.2°C (±0.5°C)' : 'PASSIVE AMBIENT'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">{isRtl ? 'نسبة الامتلاء:' : 'VOLUME:'}</span>
                <span className="font-bold text-cyan-300" dir="ltr">{uld.volumeCbm} m³ (84%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">{isRtl ? 'مستشعر الصدمة:' : 'G-SENSOR:'}</span>
                <span className="font-bold text-emerald-300" dir="ltr">0.02G (NOMINAL)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Preset Quick Buttons (Bottom Left) */}
        <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 z-10 flex items-center gap-1.5 font-mono text-[10px] pointer-events-auto">
          <span className="text-slate-400 mr-1 hidden sm:inline">{isRtl ? 'زوايا الرؤية:' : 'CAMERA:'}</span>
          <button
            type="button"
            onClick={() => setPresetView('iso')}
            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md transition-colors"
          >
            {isRtl ? 'منظور مائل' : 'ISO'}
          </button>
          <button
            type="button"
            onClick={() => setPresetView('front')}
            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md transition-colors"
          >
            {isRtl ? 'الواجهة' : 'FRONT'}
          </button>
          <button
            type="button"
            onClick={() => setPresetView('side')}
            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md transition-colors"
          >
            {isRtl ? 'الجانب' : 'SIDE'}
          </button>
          <button
            type="button"
            onClick={() => setPresetView('inside')}
            className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/50 hover:border-teal-300 text-teal-300 backdrop-blur-md transition-colors font-bold"
          >
            {isRtl ? 'الدخول للحاوية 🔍' : 'INSIDE 🔍'}
          </button>
        </div>

        {/* Zoom Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 z-10 flex items-center gap-1 font-mono pointer-events-auto">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(2.8, prev + 0.2))}
            title="تكبير"
            className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.2))}
            title="تصغير"
            className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Slot & Integration Drawer for Custom 3D Asset Imports */}
      <div className="border-t border-cyan-500/20 bg-[#070e1a] p-3 px-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {isRtl
              ? 'محرك عرض هندسي مبرمج بالأبعاد الواقعية لـ IATA TACT — مهيأ لدمج ملفات (.gltf / .obj)'
              : 'Engineered IATA 3D projection twin — Ready for custom (.gltf / .obj) asset insertion'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCustomModelNotice(!customModelNotice)}
          className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1 shrink-0"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{isRtl ? 'بوابة دمج النماذج ثلاثية الأبعاد (3D Asset Port)' : 'Custom 3D Asset Slot'}</span>
        </button>
      </div>

      {/* Expandable Technical Modal / Guidance for Custom Model Integration */}
      {customModelNotice && (
        <div className="p-4 bg-[#0a1424] border-t border-cyan-500/30 text-xs font-mono text-slate-300 space-y-2">
          <div className="flex items-center justify-between font-bold text-cyan-300">
            <span>{isRtl ? 'تعليمات ربط ودمج مجسمات الحاويات المخصصة:' : 'Custom 3D ULD Model Plug-In Interface:'}</span>
            <button
              type="button"
              onClick={() => setCustomModelNotice(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="leading-relaxed">
            {isRtl
              ? 'تمت تهيئة كامل منظومة الإسقاط والتحكم والإضاءة والتدوير وفتح الأبواب. عندما تصنع أو تصدّر ملفات الحاويات (بصيغ GLTF أو OBJ أو Three.js JSON)، يمكنك ببساطة وضعها في مجلد assets/uld/ مع نفس مسميات الأكواد (ake.gltf, pmc.gltf, rkn.gltf, rap.gltf) وستتولى المنصة عرضها فوراً مع الحفاظ على كل وظائف التيليميتري الحية.'
              : 'The camera orbit, turntable animation, door hinge kinematics, and telemetry HUD are completely configured. When you provide your custom 3D files (GLTF/OBJ), place them in assets/uld/ (ake.gltf, pmc.gltf, rkn.gltf, rap.gltf) to be automatically rendered seamlessly.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ULDViewer3D;
