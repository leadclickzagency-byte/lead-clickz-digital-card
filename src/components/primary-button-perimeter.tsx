import { useEffect, useRef, useState } from 'react';

const STROKE_WIDTH = 1.5;
const HALF_STROKE_WIDTH = STROKE_WIDTH / 2;

type PrimaryButtonPerimeterProps = {
  className?: string;
};

export function PrimaryButtonPerimeter({
  className = '',
}: PrimaryButtonPerimeterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const svg = svgRef.current;
    const button = svg?.parentElement;

    if (!button) {
      return;
    }

    const updateSize = () => {
      const { width, height } = button.getBoundingClientRect();

      setSize((currentSize) =>
        currentSize.width === width && currentSize.height === height
          ? currentSize
          : { width, height },
      );
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(button);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (size.width === 0 || size.height === 0) {
    return (
      <svg
        ref={svgRef}
        className={`lead-clickz-primary-button__perimeter ${className}`}
        aria-hidden="true"
      />
    );
  }

  const innerWidth = Math.max(0, size.width - STROKE_WIDTH);
  const innerHeight = Math.max(0, size.height - STROKE_WIDTH);
  const radius = Math.max(0, size.height / 2 - HALF_STROKE_WIDTH);

  return (
    <svg
      ref={svgRef}
      className={`lead-clickz-primary-button__perimeter ${className}`}
      viewBox={`0 0 ${size.width} ${size.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect
        x={HALF_STROKE_WIDTH}
        y={HALF_STROKE_WIDTH}
        width={innerWidth}
        height={innerHeight}
        rx={radius}
        ry={radius}
        pathLength="100"
      />
    </svg>
  );
}