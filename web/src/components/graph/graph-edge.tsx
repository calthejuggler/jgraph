import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

function GraphEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
}: EdgeProps) {
  const isBackEdge = sourceY > targetY;

  if (!isBackEdge) {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <>
        <BaseEdge id={id} path={path} markerEnd={markerEnd} />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              }}
              className="nodrag nopan text-foreground bg-background rounded border px-1 py-0.5 text-xs"
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }

  // Back-edge: exit bottom of source, curve around the right side, enter top of target
  const offset = 60 + Math.abs(sourceY - targetY) * 0.3;
  const rightX = Math.max(sourceX, targetX) + offset;
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + offset}, ${rightX} ${sourceY}, ${rightX} ${midY} C ${rightX} ${targetY}, ${targetX} ${targetY - offset}, ${targetX} ${targetY}`;

  const labelX = rightX + 8;
  const labelY = midY;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="nodrag nopan text-foreground bg-background rounded border px-1 py-0.5 text-xs"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const graphEdgeTypes = { graphEdge: GraphEdgeComponent };
