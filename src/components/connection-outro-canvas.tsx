import { useEffect, useRef } from 'react';

type SmokeWisp = {
  angle: number;
  distance: number;
  drift: number;
  lift: number;
  opacity: number;
  rotation: number;
  size: number;
  stretch: number;
};

const OUTRO_DURATION_MS = 2000;

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createSmokeWisps() {
  const random = createRandom(2702);

  return Array.from<unknown, SmokeWisp>({ length: 34 }, () => ({
    angle: random() * Math.PI * 2,
    distance: 0.08 + random() * 0.34,
    drift: (random() - 0.5) * 0.12,
    lift: 0.04 + random() * 0.14,
    opacity: 0.18 + random() * 0.18,
    rotation: random() * Math.PI,
    size: 0.08 + random() * 0.13,
    stretch: 1.25 + random() * 1.7,
  }));
}

function createLightningPoints() {
  const random = createRandom(6119);

  return Array.from({ length: 17 }, (_, index) => ({
    x: index === 0 || index === 16 ? 0 : (random() - 0.5) * 0.045,
    y: index / 16,
  }));
}

const smokeWisps = createSmokeWisps();
const lightningPoints = createLightningPoints();

export function ConnectionOutroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const render = (now: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const density = Math.min(window.devicePixelRatio || 1, 2);

      if (
        canvas.width !== Math.round(width * density) ||
        canvas.height !== Math.round(height * density)
      ) {
        canvas.width = Math.round(width * density);
        canvas.height = Math.round(height * density);
      }

      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';

      const elapsed = Math.min(now - startedAt, OUTRO_DURATION_MS);
      const impactX = width / 2;
      const impactY = height * 0.48;
      const strikeProgress = Math.min(elapsed / 320, 1);
      const strikeOpacity =
        elapsed < 320 ? Math.sin(strikeProgress * Math.PI) : 0;

      if (strikeOpacity > 0) {
        const flash = context.createRadialGradient(
          impactX,
          impactY,
          0,
          impactX,
          impactY,
          Math.max(width, height) * 0.5,
        );
        flash.addColorStop(0, `rgb(255 255 255 / ${0.82 * strikeOpacity})`);
        flash.addColorStop(
          0.14,
          `rgb(151 229 255 / ${0.54 * strikeOpacity})`,
        );
        flash.addColorStop(
          0.48,
          `rgb(2 123 255 / ${0.16 * strikeOpacity})`,
        );
        flash.addColorStop(1, 'rgb(255 255 255 / 0)');
        context.fillStyle = flash;
        context.fillRect(0, 0, width, height);

        const drawStrike = (
          lineWidth: number,
          strokeStyle: string,
          blur: number,
        ) => {
          context.save();
          context.beginPath();
          lightningPoints.forEach((point, index) => {
            const x = impactX + point.x * width;
            const y = point.y * height;

            if (index === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          });
          context.lineWidth = lineWidth;
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.strokeStyle = strokeStyle;
          context.shadowBlur = blur;
          context.shadowColor = strokeStyle;
          context.stroke();
          context.restore();
        };

        drawStrike(
          11,
          `rgb(110 214 255 / ${0.3 * strikeOpacity})`,
          28,
        );
        drawStrike(
          3.4,
          `rgb(126 220 255 / ${0.9 * strikeOpacity})`,
          14,
        );
        drawStrike(
          1.35,
          `rgb(255 255 255 / ${0.98 * strikeOpacity})`,
          5,
        );
      }

      if (elapsed >= 180) {
        const smokeProgress = Math.min((elapsed - 180) / 1820, 1);
        const expansion = Math.min(smokeProgress / 0.34, 1);
        const dissipation =
          smokeProgress < 0.42
            ? 1
            : Math.max(0, 1 - (smokeProgress - 0.42) / 0.58);

        smokeWisps.forEach((wisp) => {
          const travel = expansion * wisp.distance;
          const x =
            impactX +
            Math.cos(wisp.angle) * width * travel +
            wisp.drift * width * smokeProgress;
          const y =
            impactY +
            Math.sin(wisp.angle) * height * travel -
            wisp.lift * height * smokeProgress;
          const radius =
            Math.min(width, height) *
            wisp.size *
            (0.55 + expansion * 0.95);
          const alpha = wisp.opacity * dissipation;

          context.save();
          context.translate(x, y);
          context.rotate(wisp.rotation + smokeProgress * 0.18);
          context.scale(wisp.stretch, 1);

          const smoke = context.createRadialGradient(0, 0, 0, 0, 0, radius);
          smoke.addColorStop(0, `rgb(181 231 251 / ${alpha})`);
          smoke.addColorStop(0.38, `rgb(211 241 253 / ${alpha * 0.8})`);
          smoke.addColorStop(0.76, `rgb(235 248 255 / ${alpha * 0.38})`);
          smoke.addColorStop(1, 'rgb(255 255 255 / 0)');

          context.fillStyle = smoke;
          context.fillRect(-radius, -radius, radius * 2, radius * 2);
          context.restore();
        });
      }

      context.globalCompositeOperation = 'source-over';

      if (elapsed < OUTRO_DURATION_MS) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="connection-outro-canvas"
      aria-hidden="true"
    />
  );
}