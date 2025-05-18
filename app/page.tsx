"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";

const N = 3;
const CANVAS_WIDTH = 150;
const CANVAS_HEIGHT = 150;

// Snake properties
const SNAKE_MAX_LENGTH = 30;
const SNAKE_SPEED = 5;
const INITIAL_POINTS = [{ x: 50, y: 50 }];
const STROKE_WIDTH = 2;

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

export default function Home() {
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
  const transformationRef = useRef<keyof typeof transformations>("p1");

  const transformations = useMemo(
    () => ({
      // p1: No transformation
      p1: (points: { x: number; y: number }[]) => [points],

      // p2: 180 degree rotation
      p2: (points: { x: number; y: number }[]) => [
        points,
        points.map((p) => {
          const centerX = CANVAS_WIDTH / 2;
          const centerY = CANVAS_HEIGHT / 2;
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const angle = Math.PI; // 180 degree rotation
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          return {
            x: centerX + dx * cos - dy * sin,
            y: centerY + dx * sin + dy * cos,
          };
        }),
      ],

      // p4: 90 degree rotation
      p4: (points: { x: number; y: number }[]) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        return [
          points,
          points.map((p) => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const angle = Math.PI / 2; // 90 degree rotation
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
              x: centerX + dx * cos - dy * sin,
              y: centerY + dx * sin + dy * cos,
            };
          }),
          points.map((p) => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const angle = Math.PI; // 180 degree rotation
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
              x: centerX + dx * cos - dy * sin,
              y: centerY + dx * sin + dy * cos,
            };
          }),
          points.map((p) => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const angle = (3 * Math.PI) / 2; // 270 degree rotation
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
              x: centerX + dx * cos - dy * sin,
              y: centerY + dx * sin + dy * cos,
            };
          }),
        ];
      },

      // pm: Reflection across vertical line
      pm: (points: { x: number; y: number }[]) => [
        points,
        points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        })),
      ],

      // pg: Glide reflection
      pg: (points: { x: number; y: number }[]) => [
        points,
        points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y + CANVAS_HEIGHT / 2,
        })),
      ],

      // cm: Reflection across horizontal line
      cm: (points: { x: number; y: number }[]) => [
        points,
        points.map((p) => ({
          x: p.x,
          y: CANVAS_HEIGHT - p.y,
        })),
      ],

      // cmm: Two perpendicular reflections with center point
      cmm: (points: { x: number; y: number }[]) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const vertical = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        const horizontal = points.map((p) => ({
          x: p.x,
          y: CANVAS_HEIGHT - p.y,
        }));
        const both = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: CANVAS_HEIGHT - p.y,
        }));
        const center = points.map((p) => ({
          x: centerX + (centerX - p.x),
          y: centerY + (centerY - p.y),
        }));
        return [points, vertical, horizontal, both, center];
      },

      // pmm: Two perpendicular reflections
      pmm: (points: { x: number; y: number }[]) => {
        const vertical = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        const horizontal = points.map((p) => ({
          x: p.x,
          y: CANVAS_HEIGHT - p.y,
        }));
        const both = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: CANVAS_HEIGHT - p.y,
        }));
        return [points, vertical, horizontal, both];
      },

      // pmg: Glide reflection and vertical reflection
      pmg: (points: { x: number; y: number }[]) => {
        const glide = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y + CANVAS_HEIGHT / 2,
        }));
        const vertical = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        const glideVertical = points.map((p) => ({
          x: p.x,
          y: p.y + CANVAS_HEIGHT / 2,
        }));
        return [points, glide, vertical, glideVertical];
      },

      // pgg: Two perpendicular glide reflections
      pgg: (points: { x: number; y: number }[]) => {
        const horizontalGlide = points.map((p) => ({
          x: p.x + CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - p.y,
        }));
        const verticalGlide = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y + CANVAS_HEIGHT / 2,
        }));
        const both = points.map((p) => ({
          x: p.x + CANVAS_WIDTH / 2,
          y: p.y + CANVAS_HEIGHT / 2,
        }));
        return [points, horizontalGlide, verticalGlide, both];
      },

      // p4m: Square with mirror reflections
      p4m: (points: { x: number; y: number }[]) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const rotate90 = points.map((p) => ({
          x: centerY - p.y + centerX,
          y: p.x - centerX + centerY,
        }));
        const rotate180 = points.map((p) => ({
          x: centerX + (centerX - p.x),
          y: centerY + (centerY - p.y),
        }));
        const rotate270 = points.map((p) => ({
          x: p.y - centerY + centerX,
          y: centerX - p.x + centerY,
        }));
        const mirror = points.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        const mirror90 = rotate90.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        const mirror180 = rotate180.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        const mirror270 = rotate270.map((p) => ({
          x: CANVAS_WIDTH - p.x,
          y: p.y,
        }));
        return [
          points,
          rotate90,
          rotate180,
          rotate270,
          mirror,
          mirror90,
          mirror180,
          mirror270,
        ];
      },

      // p4g: Square with glide reflections
      p4g: (points: { x: number; y: number }[]) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const rotate90 = points.map((p) => ({
          x: centerY - p.y + centerX,
          y: p.x - centerX + centerY,
        }));
        const rotate180 = points.map((p) => ({
          x: centerX + (centerX - p.x),
          y: centerY + (centerY - p.y),
        }));
        const rotate270 = points.map((p) => ({
          x: p.y - centerY + centerX,
          y: centerX - p.x + centerY,
        }));
        const glide = points.map((p) => ({
          x: p.x + CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - p.y,
        }));
        const glide90 = rotate90.map((p) => ({
          x: p.x + CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - p.y,
        }));
        const glide180 = rotate180.map((p) => ({
          x: p.x + CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - p.y,
        }));
        const glide270 = rotate270.map((p) => ({
          x: p.x + CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - p.y,
        }));
        return [
          points,
          rotate90,
          rotate180,
          rotate270,
          glide,
          glide90,
          glide180,
          glide270,
        ];
      },
    }),
    []
  );

  // Define gameLoop before useEffect that might reference it indirectly via requestAnimationFrame
  const gameLoop = useCallback(() => {
    if (!canvasRefs.current[0]) {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    const firstCanvasWidth = canvasRefs.current[0].width;
    const firstCanvasHeight = canvasRefs.current[0].height;

    const [updatedPoints, newAngle] = updateSnake(
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
      if (ctx && canvasRefs.current[index]) {
        ctx.clearRect(
          0,
          0,
          canvasRefs.current[index]!.width,
          canvasRefs.current[index]!.height
        );
        const transformedPoints = transformations[transformationRef.current](
          pointsRef.current
        );
        transformedPoints.forEach((points) => {
          drawSnake(ctx, points);
        });
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
  }, [transformations]); // No dependencies, uses refs and constants only

  useEffect(() => {
    transformationRef.current = "p1";
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
    const firstCanvasPresent = !!canvasRefs.current[0];

    if (allGridCtxReady && demoCtxReady && firstCanvasPresent) {
      angleRef.current = Math.random() * 2 * Math.PI;
      pointsRef.current = [...INITIAL_POINTS];
      animationFrameIdRef.current = requestAnimationFrame(gameLoop); // Start the loop
    } else {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameLoop]); // gameLoop is stable due to useCallback([])

  return (
    <div className="lg:flex h-screen justify-center items-center gap-8">
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex gap-4 mb-4">
          {Object.keys(transformations).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="radio"
                name="transformation"
                value={key}
                onChange={(e) => {
                  transformationRef.current = e.target
                    .value as keyof typeof transformations;
                }}
              />
              {key}
            </label>
          ))}
        </div>
        <div
          id="canvas-grid-container"
          style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${N}, auto)`,
          }}
        >
          {Array.from({ length: N * N }).map((_, i) => (
            <div
              key={i}
              className="grid-item border border-black/80 text-3xl text-center w-fit"
            >
              <canvas
                className="border-2 border-gray-300"
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
      <div className="flex items-center bg-blue-100">
        <div>
          <canvas
            className="border-2 border-gray-300"
            id="demo"
            width="150"
            height="150"
            ref={(el) => {
              if (el) {
                demoCanvasRef.current = el;
              }
            }}
          ></canvas>
        </div>
      </div>
    </div>
  );
}
