"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const N = 3;
const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 100;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

// Snake properties
const SNAKE_MAX_LENGTH = 100;
const SNAKE_SPEED = 2;
const INITIAL_POINTS = [
  { x: 10, y: 10 }, // Top of F, start of horizontal bar
  { x: 30, y: 10 }, // End of top horizontal bar
  { x: 10, y: 10 }, // Back to top of F (for continuous line if drawn sequentially)
  { x: 10, y: 50 }, // Bottom of F's vertical bar
  { x: 10, y: 30 }, // Mid-point of F's vertical bar, start of middle horizontal bar
  { x: 25, y: 30 }, // End of middle horizontal bar
];
const STROKE_WIDTH = 2;

const rotate = (
  points: { x: number; y: number }[],
  angle: number,
  x0: number = CENTER_X,
  y0: number = CENTER_Y
) => {
  return points.map((p) => {
    const dx = p.x - x0;
    const dy = p.y - y0;
    return {
      x: x0 + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: y0 + dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  });
};

const reflect = (
  points: { x: number; y: number }[],
  x0: number = CENTER_X,
  y0: number = CENTER_Y,
  x1: number = CENTER_X,
  y1: number = CENTER_Y
) => {
  return points.map((p) => {
    // Vector from line start to point
    const dx = p.x - x0;
    const dy = p.y - y0;

    // Vector of the line
    const lineDx = x1 - x0;
    const lineDy = y1 - y0;

    // Project point vector onto line vector
    const dot = dx * lineDx + dy * lineDy;
    const lineLengthSquared = lineDx * lineDx + lineDy * lineDy;
    const projection = dot / lineLengthSquared;

    // Find closest point on line
    const closestX = x0 + projection * lineDx;
    const closestY = y0 + projection * lineDy;

    // Reflect point across closest point
    return {
      x: 2 * closestX - p.x,
      y: 2 * closestY - p.y,
    };
  });
};

const translate = (
  points: { x: number; y: number }[],
  x: number = CANVAS_WIDTH,
  y: number = CANVAS_HEIGHT
) => {
  return points.map((p) => ({ x: p.x + x, y: p.y + y }));
};

// Rotate n times around a point
const rotateN = (
  points: { x: number; y: number }[],
  n: number,
  x: number = CENTER_X,
  y: number = CENTER_Y
) => {
  return Array.from({ length: n }, (_, i) =>
    rotate(points, (i * Math.PI * 2) / n, x, y)
  );
};
// Glide reflection across y, shifted by dx
const glideY = (
  points: { x: number; y: number }[],
  y: number = CENTER_Y,
  dx: number = CENTER_X
) => {
  return translate(reflect(points, 0, y, CANVAS_WIDTH, y), dx, 0);
};

const transformations: Record<
  string,
  (points: { x: number; y: number }[]) => { x: number; y: number }[][]
> = {
  // p1: No transformation
  p1: (points: { x: number; y: number }[]) => [
    translate(points, CANVAS_WIDTH, CANVAS_HEIGHT),
  ],

  // p2: 180 degree rotation
  p2: (points: { x: number; y: number }[]) => [
    points,
    // 2-fold rotation centers
    ...[
      [Math.PI, 0, 0],
      [Math.PI, CENTER_X, 0],
      [Math.PI, CANVAS_WIDTH, 0],
      [Math.PI, 0, CENTER_Y],
      [Math.PI, CENTER_X, CENTER_Y],
      [Math.PI, CANVAS_WIDTH, CENTER_Y],
      [Math.PI, 0, CANVAS_HEIGHT],
      [Math.PI, CENTER_X, CANVAS_HEIGHT],
      [Math.PI, CANVAS_WIDTH, CANVAS_HEIGHT],
    ].map(([angle, dx, dy]) => rotate(points, angle, dx, dy)),
  ],

  // p4: 90 degree rotation
  p4: (points: { x: number; y: number }[]) => [
    points,
    // 4-fold rotation centers
    ...[
      [0, 0],
      [CANVAS_WIDTH, 0],
      [0, CANVAS_HEIGHT],
      [CANVAS_WIDTH, CANVAS_HEIGHT],
    ].flatMap(([dx, dy]) => rotateN(points, 4, dx, dy)),
    // 2-fold rotation centers
    ...[
      // Center top, center right, center bottom, center left
      [CENTER_X, 0],
      [CANVAS_WIDTH, CENTER_Y],
      [CENTER_X, CANVAS_HEIGHT],
      [0, CENTER_Y],
    ].flatMap(([dx, dy]) => rotateN(points, 2, dx, dy)),
  ],

  // pm: Reflection across vertical line
  pm: (points: { x: number; y: number }[]) => [
    points,
    // x = 0
    reflect(points, 0, 0, 0, CANVAS_HEIGHT),
    // x = CANVAS_WIDTH / 2
    reflect(points, CENTER_X, 0, CENTER_X, CANVAS_HEIGHT),
    // x = CANVAS_WIDTH
    reflect(points, CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT),
  ],

  // pg: Glide reflection
  pg: (points: { x: number; y: number }[]) => [
    points,
    // y = 0
    glideY(points, 0, CENTER_X),
  ],

  // cm: Reflection across horizontal line + glide reflection
  cm: (points: { x: number; y: number }[]) => [
    points,
    translate(
      reflect(points, CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT),
      0,
      CANVAS_HEIGHT / 2
    ),
    translate(points, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2),
    translate(
      reflect(points, CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT),
      CANVAS_WIDTH / 2,
      0
    ),
  ],

  // cmm: Two perpendicular reflections with center point
  cmm: (points: { x: number; y: number }[]) => [
    // 1. Original
    points,
    // 2. 180° rotation
    rotate(points, Math.PI, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2),
    // 3. Vertical reflection (center)
    reflect(points, CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT),
    // 4. Horizontal reflection (center)
    reflect(points, 0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2),
    // 5. Main diagonal reflection
    reflect(points, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT),
    // 6. Anti-diagonal reflection
    reflect(points, CANVAS_WIDTH, 0, 0, CANVAS_HEIGHT),
    // 7. Main diagonal + vertical reflection
    reflect(
      reflect(points, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT),
      CANVAS_WIDTH / 2,
      0,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT
    ),
    // 8. Main diagonal + horizontal reflection
    reflect(
      reflect(points, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT),
      0,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH,
      CANVAS_HEIGHT / 2
    ),
  ],

  // pmm: Two perpendicular reflections
  pmm: (points: { x: number; y: number }[]) => [
    points,
    rotate(points, Math.PI),
    reflect(points, CENTER_X, 0, CENTER_X, CANVAS_HEIGHT),
    reflect(points, 0, CENTER_Y, CANVAS_WIDTH, CENTER_Y),
  ],

  // pmg: Glide reflection and vertical reflection
  pmg: (points: { x: number; y: number }[]) => [
    // Original motif
    points,
    rotate(points, Math.PI),
    // Glide-reflected across y = 0, shifted right by half tile
    translate(reflect(points, 0, 0, CANVAS_WIDTH, 0), CANVAS_WIDTH / 2, 0),
    // Glide-reflected across x = CENTER_X, shifted right by half tile
    translate(
      reflect(points, CENTER_X, 0, CENTER_X, CANVAS_HEIGHT),
      CANVAS_WIDTH / 2,
      0
    ),
  ],

  // pgg: Two perpendicular glide reflections
  pgg: (points) => [
    // 1. Original motif
    points,
    // Rotate about halfway between top corner and center
    rotate(points, Math.PI, CENTER_X / 2, CENTER_Y / 2),
    // Glide reflection (horizontal), then shift, then rotate 180°
    glideY(points, CANVAS_HEIGHT / 2, CENTER_X),
    // Rotate the glide reflection
    rotate(
      glideY(points, CANVAS_HEIGHT / 2, CENTER_X),
      Math.PI,
      CENTER_X / 2,
      CENTER_Y / 2
    ),
  ],

  // p4m: Square with mirror reflections
  p4m: (points: { x: number; y: number }[]) => [
    points,
    rotate(points, Math.PI / 2),
    rotate(points, Math.PI),
    rotate(points, (Math.PI * 3) / 2),
    reflect(points, CENTER_X, 0, CENTER_X, CANVAS_HEIGHT),
    reflect(rotate(points, Math.PI / 2), CENTER_X, 0, CENTER_X, CANVAS_HEIGHT),
    reflect(points, 0, CENTER_Y, CANVAS_WIDTH, CENTER_Y),
    reflect(points, CANVAS_WIDTH, 0, 0, CANVAS_HEIGHT),
    reflect(points, 0, CANVAS_HEIGHT, CANVAS_WIDTH, 0),
  ],

  // p4g: Square with glide reflections
  p4g: (points: { x: number; y: number }[]) => {
    const smallRotation = rotateN(points, 4);
    const glide = glideY(points, CENTER_Y / 2, CENTER_X);
    return [points, ...smallRotation, glide, ...rotateN(glide, 4)];
  },
};

const transformationDescriptions: Record<keyof typeof transformations, string> =
  {
    p1: "Basic translation only",
    p2: "180° rotation pattern",
    p4: "90° rotation pattern",
    pm: "Vertical reflection pattern",
    pg: "Glide reflection pattern",
    cm: "Horizontal reflection with glide",
    cmm: "Two perpendicular reflections",
    pmm: "Two perpendicular mirrors",
    pmg: "Glide and vertical reflection",
    pgg: "Two perpendicular glides",
    p4m: "Square with mirrors",
    p4g: "Square with glides",
  };

const DEFAULT_TRANSFORMATION: keyof typeof transformations = "p1";

// Helper function to draw a single continuous segment of the snake
function drawSegment(
  context: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  startIndex: number,
  endIndex: number
) {
  const segmentPoints = points.slice(startIndex, endIndex + 1);
  if (segmentPoints.length === 0) return;

  context.beginPath();
  context.moveTo(segmentPoints[0].x, segmentPoints[0].y);

  if (segmentPoints.length === 1) {
    // For a single point segment (e.g., after a wrap),
    // stroke() will draw the moveTo point if line width is > 0.
  } else if (segmentPoints.length === 2) {
    context.lineTo(segmentPoints[1].x, segmentPoints[1].y);
  } else {
    let k_bezier;
    for (k_bezier = 1; k_bezier < segmentPoints.length - 2; k_bezier++) {
      const P_control = segmentPoints[k_bezier];
      const P_next_for_mid = segmentPoints[k_bezier + 1];
      const mid_x = (P_control.x + P_next_for_mid.x) / 2;
      const mid_y = (P_control.y + P_next_for_mid.y) / 2;
      context.quadraticCurveTo(P_control.x, P_control.y, mid_x, mid_y);
    }
    context.quadraticCurveTo(
      segmentPoints[k_bezier].x,
      segmentPoints[k_bezier].y,
      segmentPoints[k_bezier + 1].x,
      segmentPoints[k_bezier + 1].y
    );
  }
  context.stroke();
}

function drawSnake(
  context: CanvasRenderingContext2D | null,
  currentPoints: { x: number; y: number }[]
) {
  if (!context) return;
  if (currentPoints.length === 0) return;

  const thresholdFactor = 0.8;
  const thresholdX = CANVAS_WIDTH * thresholdFactor;
  const thresholdY = CANVAS_HEIGHT * thresholdFactor;

  function isWrap(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): boolean {
    if (!p1 || !p2) return true;
    return (
      Math.abs(p1.x - p2.x) > thresholdX || Math.abs(p1.y - p2.y) > thresholdY
    );
  }

  let currentSegmentStartIndex = 0;

  for (let i = 0; i < currentPoints.length; i++) {
    if (i > 0 && isWrap(currentPoints[i - 1], currentPoints[i])) {
      drawSegment(context, currentPoints, currentSegmentStartIndex, i - 1);
      currentSegmentStartIndex = i;
    }
    if (i === currentPoints.length - 1) {
      drawSegment(context, currentPoints, currentSegmentStartIndex, i);
    }
  }
}

function updateSnake(
  currentPoints: { x: number; y: number }[],
  angle: number,
  snakeSpeed: number,
  snakeMaxLength: number,
  canvasWidth: number,
  canvasHeight: number
): [{ x: number; y: number }[], number] {
  const head = currentPoints[currentPoints.length - 1];
  if (!head) return [currentPoints, angle];

  let newX = head.x + snakeSpeed * Math.cos(angle);
  let newY = head.y + snakeSpeed * Math.sin(angle);

  if (newX < 0) newX = canvasWidth;
  else if (newX > canvasWidth) newX = 0;
  if (newY < 0) newY = canvasHeight;
  else if (newY > canvasHeight) newY = 0;

  const newPoints = [...currentPoints, { x: newX, y: newY }];
  if (newPoints.length > snakeMaxLength) {
    newPoints.shift();
  }

  let newAngle = angle;
  if (Math.random() < 0.05) {
    newAngle += ((Math.random() - 0.5) * Math.PI) / 2;
  }
  return [newPoints, newAngle];
}

export default function Geometry() {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>(
    Array.from({ length: N * N }, () => null)
  );
  const ctxRefs = useRef<(CanvasRenderingContext2D | null)[]>(
    Array.from({ length: N * N }, () => null)
  );
  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const demoCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const pointsRef = useRef<{ x: number; y: number }[]>([...INITIAL_POINTS]);
  const angleRef = useRef<number>(Math.random() * 2 * Math.PI);
  const animationFrameIdRef = useRef<number | null>(null);
  const transformationRef = useRef<keyof typeof transformations>(
    DEFAULT_TRANSFORMATION
  );
  const [paused, setPaused] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Define gameLoop before useEffect that might reference it indirectly via requestAnimationFrame
  const gameLoop = useCallback(() => {
    const firstCanvas = canvasRefs.current[0];
    if (!firstCanvas) {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    const firstCanvasWidth = firstCanvas.width;
    const firstCanvasHeight = firstCanvas.height;

    const [updatedPoints, newAngle] = paused
      ? [pointsRef.current, angleRef.current]
      : updateSnake(
          pointsRef.current,
          angleRef.current,
          SNAKE_SPEED,
          SNAKE_MAX_LENGTH,
          firstCanvasWidth,
          firstCanvasHeight
        );

    pointsRef.current = updatedPoints;
    angleRef.current = newAngle;

    ctxRefs.current.forEach((ctx, index) => {
      const currentCanvas = canvasRefs.current[index];
      if (ctx && currentCanvas) {
        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        const transformedPointsArray = transformations[
          transformationRef.current
        ](pointsRef.current);
        transformedPointsArray.forEach(
          (pathPoints: { x: number; y: number }[]) => {
            const offsets = [
              { dx: 0, dy: 0 },
              { dx: firstCanvasWidth, dy: 0 },
              { dx: -firstCanvasWidth, dy: 0 },
              { dx: 0, dy: firstCanvasHeight },
              { dx: 0, dy: -firstCanvasHeight },
              { dx: firstCanvasWidth, dy: firstCanvasHeight },
              { dx: firstCanvasWidth, dy: -firstCanvasHeight },
              { dx: -firstCanvasWidth, dy: firstCanvasHeight },
              { dx: -firstCanvasWidth, dy: -firstCanvasHeight },
            ];
            offsets.forEach((offset) => {
              drawSnake(ctx, translate(pathPoints, offset.dx, offset.dy));
            });
          }
        );
      }
    });

    if (demoCtxRef.current && demoCanvasRef.current) {
      demoCtxRef.current.clearRect(
        0,
        0,
        demoCanvasRef.current.width,
        demoCanvasRef.current.height
      );
      drawSnake(demoCtxRef.current, pointsRef.current);
    }

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, [paused]); // Add paused to dependency array

  useEffect(() => {
    transformationRef.current = DEFAULT_TRANSFORMATION;
    // Initialize contexts for the grid canvases
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas && !ctxRefs.current[i]) {
        ctxRefs.current[i] = canvas.getContext("2d");
        if (ctxRefs.current[i]) {
          ctxRefs.current[i]!.lineWidth = STROKE_WIDTH; // Set stroke width for grid canvases
        }
      }
    });

    if (demoCanvasRef.current && !demoCtxRef.current) {
      demoCtxRef.current = demoCanvasRef.current.getContext("2d");
      if (demoCtxRef.current) {
        demoCtxRef.current.lineWidth = STROKE_WIDTH; // Set stroke width for demo canvas
      }
    }

    // Check if all contexts are ready
    const allGridCtxReady = ctxRefs.current
      .slice(0, N * N)
      .every((ctx) => !!ctx);
    const demoCtxReady = !!demoCtxRef.current;
    // Refined check for first canvas and its context
    const firstGridCanvasAndContextReady = !!(
      canvasRefs.current[0] && ctxRefs.current[0]
    );

    if (allGridCtxReady && demoCtxReady && firstGridCanvasAndContextReady) {
      if (!isInitialized) {
        angleRef.current = Math.random() * 2 * Math.PI;
        pointsRef.current = [...INITIAL_POINTS];
        setIsInitialized(true);
      }
      animationFrameIdRef.current = requestAnimationFrame(gameLoop); // Start the loop
    } else {
      // Canvases not fully ready yet, try to start the loop.
      // gameLoop has an internal check for canvasRefs.current[0] to keep trying.
      // If paused, gameLoop will return immediately.
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null; // Set to null
      }
    };
  }, [gameLoop, isInitialized]); // gameLoop is stable due to useCallback([])

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="flex items-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">Root Motif:</h2>
            <canvas
              className="border-2 border-gray-300"
              id="demo"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              ref={(el) => {
                if (el) {
                  demoCanvasRef.current = el;
                }
              }}
            ></canvas>
          </div>
        </div>
        <div
          id="canvas-grid-container"
          style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${N}, auto)`,
          }}
        >
          {Array.from({ length: N * N }).map((_, i) => (
            <div key={i} className="grid-item text-3xl text-center w-fit">
              <canvas
                className="border-[0.5px] border-gray-300"
                id={`canvas${i}`}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                ref={(el) => {
                  if (el) {
                    canvasRefs.current[i] = el;
                  }
                }}
              ></canvas>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <select
          className="p-2 border border-gray-300 rounded"
          onChange={(e) => {
            transformationRef.current = e.target
              .value as keyof typeof transformations;
          }}
          defaultValue={transformationRef.current}
        >
          {Object.keys(transformations).map((key) => (
            <option key={key} value={key}>
              {key} (
              {transformationDescriptions[key as keyof typeof transformations]})
            </option>
          ))}
        </select>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Play" : "Pause"}
        </button>
        <p className="text-sm text-gray-500">{paused ? "Paused" : "Playing"}</p>
      </div>
    </div>
  );
}
