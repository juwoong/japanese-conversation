import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import Svg, { Line as SvgLine } from "react-native-svg";
import { colors } from "../constants/theme";

export type NodeStatus = "completed" | "recommended" | "available" | "advanced";

export interface MapNode {
  situationSlug: string;
  label: string;
  emoji: string;
  color: string;
  position: { x: number; y: number };
  status: NodeStatus;
  connections: string[];
  situationId: number | null;
}

interface TravelMapProps {
  nodes: MapNode[];
  onNodePress: (node: MapNode) => void;
}

const NODE_SIZE = 72;
const MAP_PADDING_H = 24;

function PulsingNode({
  node,
  onPress,
  mapWidth,
}: {
  node: MapNode;
  onPress: () => void;
  mapWidth: number;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (node.status === "recommended") {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [node.status]);

  const opacity =
    node.status === "available"
      ? 0.6
      : node.status === "advanced"
        ? 0.4
        : 1;

  const left = node.position.x * (mapWidth - NODE_SIZE - MAP_PADDING_H * 2) + MAP_PADDING_H;
  const top = node.position.y;

  return (
    <Animated.View
      style={[
        styles.nodeOuter,
        {
          left,
          top,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.node,
          { backgroundColor: node.color, opacity },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.nodeEmoji}>{node.emoji}</Text>
        {node.status === "completed" && (
          <View style={styles.checkOverlay}>
            <Text style={styles.checkMark}>{"✓"}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={[styles.nodeLabel, { opacity: Math.max(opacity, 0.6) }]}>
        {node.label}
      </Text>
    </Animated.View>
  );
}

export default function TravelMap({ nodes, onNodePress }: TravelMapProps) {
  const screenWidth = Dimensions.get("window").width;
  const mapWidth = screenWidth;

  // Calculate connection line positions
  const nodePositions = new Map<string, { cx: number; cy: number }>();
  nodes.forEach((node) => {
    const left = node.position.x * (mapWidth - NODE_SIZE - MAP_PADDING_H * 2) + MAP_PADDING_H;
    const top = node.position.y;
    nodePositions.set(node.situationSlug, {
      cx: left + NODE_SIZE / 2,
      cy: top + NODE_SIZE / 2,
    });
  });

  // Total height: last node y + extra space for label
  const maxY = Math.max(...nodes.map((n) => n.position.y));
  const mapHeight = maxY + NODE_SIZE + 40;

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      {/* Connection lines */}
      <Svg
        width={mapWidth}
        height={mapHeight}
        style={StyleSheet.absoluteFill}
      >
        {nodes.flatMap((node) =>
          node.connections
            .filter((slug) => nodePositions.has(slug))
            .map((targetSlug) => {
              const from = nodePositions.get(node.situationSlug)!;
              const to = nodePositions.get(targetSlug)!;
              return (
                <SvgLine
                  key={`${node.situationSlug}-${targetSlug}`}
                  x1={from.cx}
                  y1={from.cy}
                  x2={to.cx}
                  y2={to.cy}
                  stroke={colors.borderLight}
                  strokeWidth={2}
                  strokeDasharray="6,4"
                />
              );
            })
        )}
      </Svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <PulsingNode
          key={node.situationSlug}
          node={node}
          onPress={() => onNodePress(node)}
          mapWidth={mapWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  nodeOuter: {
    position: "absolute",
    width: NODE_SIZE,
    alignItems: "center",
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  nodeEmoji: {
    fontSize: 28,
  },
  checkOverlay: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  checkMark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  nodeLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
    textAlign: "center",
  },
});
