import {
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  Quaternion,
  Vector3,
} from "three";

export const LOOP_SEGMENTS = 128;
export const MORPH_START = 0.56;
export const MORPH_END = 1;

type RibbonOptions = {
  width: number;
  thickness: number;
  normalOffset?: number;
  depthOffset?: number;
  segments?: number;
};

export type LoopSample = {
  points: Vector3[];
  tangents: Vector3[];
  normals: Vector3[];
  binormals: Vector3[];
};

function loosePoint(t: number) {
  return new Vector3(
    1.08 * Math.cos(1.84 * Math.PI * t + 0.55) +
      0.24 * Math.sin(5 * Math.PI * t),
    0.92 * Math.sin(1.84 * Math.PI * t + 0.55) +
      0.3 * Math.sin(3 * Math.PI * t + 0.35),
    0.18 * Math.sin(6 * Math.PI * t),
  );
}

function formedPoint(t: number) {
  const u = 2 * Math.PI * (0.92 * t + 0.04);
  return new Vector3(
    1.06 * Math.cos(u),
    1.28 * Math.sin(u),
    0.1 * Math.sin(2 * u),
  );
}

function resampleByArcLength(
  pointAt: (t: number) => Vector3,
  segments: number,
) {
  const sourceSegments = 512;
  const source = Array.from({ length: sourceSegments + 1 }, (_, index) =>
    pointAt(index / sourceSegments),
  );
  const cumulative = [0];

  for (let index = 1; index < source.length; index += 1) {
    cumulative[index] =
      cumulative[index - 1] + source[index].distanceTo(source[index - 1]);
  }

  const total = cumulative[cumulative.length - 1];
  return Array.from({ length: segments + 1 }, (_, index) => {
    const target = (index / segments) * total;
    let high = cumulative.findIndex((distance) => distance >= target);
    high = high <= 0 ? 1 : high;
    const low = high - 1;
    const span = cumulative[high] - cumulative[low] || 1;
    const alpha = (target - cumulative[low]) / span;
    return source[low].clone().lerp(source[high], alpha);
  });
}

function buildParallelTransportFrames(points: Vector3[]): LoopSample {
  const tangents = points.map((_, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    return after.clone().sub(before).normalize();
  });

  const normals: Vector3[] = [];
  const binormals: Vector3[] = [];
  const worldZ = new Vector3(0, 0, 1);
  const worldY = new Vector3(0, 1, 0);
  const firstNormal = worldZ.clone().cross(tangents[0]);
  normals[0] = (firstNormal.lengthSq() < 0.0001 ? worldY : firstNormal).normalize();
  binormals[0] = tangents[0].clone().cross(normals[0]).normalize();

  for (let index = 1; index < points.length; index += 1) {
    const transport = new Quaternion().setFromUnitVectors(
      tangents[index - 1],
      tangents[index],
    );
    const transported = normals[index - 1].clone().applyQuaternion(transport);
    transported.addScaledVector(
      tangents[index],
      -transported.dot(tangents[index]),
    );
    normals[index] = transported.normalize();
    binormals[index] = tangents[index].clone().cross(normals[index]).normalize();
  }

  return { points, tangents, normals, binormals };
}

export function sampleLoop(
  morph: number,
  segments = LOOP_SEGMENTS,
): LoopSample {
  const loose = resampleByArcLength(loosePoint, segments);
  const formed = resampleByArcLength(formedPoint, segments);
  const easedMorph = MathUtils.smoothstep(morph, 0, 1);
  const points = loose.map((point, index) =>
    point.clone().lerp(formed[index], easedMorph),
  );
  return buildParallelTransportFrames(points);
}

function writeRibbonPositions(
  destination: Float32Array,
  sample: LoopSample,
  options: RibbonOptions,
) {
  const halfWidth = options.width / 2;
  const halfThickness = options.thickness / 2;
  const normalOffset = options.normalOffset ?? 0;
  const depthOffset = options.depthOffset ?? 0;

  sample.points.forEach((point, index) => {
    const normal = sample.normals[index];
    const binormal = sample.binormals[index];
    const center = point
      .clone()
      .addScaledVector(normal, normalOffset)
      .addScaledVector(binormal, depthOffset);
    const vertices = [
      center.clone().addScaledVector(normal, -halfWidth).addScaledVector(binormal, halfThickness),
      center.clone().addScaledVector(normal, halfWidth).addScaledVector(binormal, halfThickness),
      center.clone().addScaledVector(normal, -halfWidth).addScaledVector(binormal, -halfThickness),
      center.clone().addScaledVector(normal, halfWidth).addScaledVector(binormal, -halfThickness),
    ];

    vertices.forEach((vertex, vertexIndex) => {
      const offset = (index * 4 + vertexIndex) * 3;
      destination[offset] = vertex.x;
      destination[offset + 1] = vertex.y;
      destination[offset + 2] = vertex.z;
    });
  });
}

function createRibbonIndices(segments: number) {
  const indices: number[] = [];
  for (let index = 0; index < segments; index += 1) {
    const current = index * 4;
    const next = (index + 1) * 4;
    indices.push(
      current,
      next,
      current + 1,
      current + 1,
      next,
      next + 1,
      current + 2,
      current + 3,
      next + 2,
      current + 3,
      next + 3,
      next + 2,
      current,
      current + 2,
      next,
      current + 2,
      next + 2,
      next,
      current + 1,
      next + 1,
      current + 3,
      current + 3,
      next + 1,
      next + 3,
    );
  }
  return indices;
}

export function createRibbonGeometry(
  morph: number,
  options: RibbonOptions,
) {
  const segments = options.segments ?? LOOP_SEGMENTS;
  const geometry = new BufferGeometry();
  const positions = new Float32Array((segments + 1) * 4 * 3);
  writeRibbonPositions(positions, sampleLoop(morph, segments), options);
  geometry.setAttribute("position", new BufferAttribute(positions, 3));

  const uvs = new Float32Array((segments + 1) * 4 * 2);
  for (let index = 0; index <= segments; index += 1) {
    const u = index / segments;
    const offset = index * 8;
    uvs.set([u, 0, u, 1, u, 0, u, 1], offset);
  }
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(createRibbonIndices(segments));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData.ribbonOptions = options;
  return geometry;
}

export function updateRibbonGeometry(
  geometry: BufferGeometry,
  morph: number,
) {
  const options = geometry.userData.ribbonOptions as RibbonOptions;
  const segments = options.segments ?? LOOP_SEGMENTS;
  const position = geometry.getAttribute("position") as BufferAttribute;
  writeRibbonPositions(
    position.array as Float32Array,
    sampleLoop(morph, segments),
    options,
  );
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute("normal") as BufferAttribute;
  normal.needsUpdate = true;
  geometry.computeBoundingSphere();
}
