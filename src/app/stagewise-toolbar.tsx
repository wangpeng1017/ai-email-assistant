"use client";
import dynamic from "next/dynamic";
import React from "react";

// 动态导入 StagewiseToolbar 以避免 SSR 问题
const StagewiseToolbar = dynamic(
  () => import("@stagewise/toolbar-next").then(mod => mod.StagewiseToolbar),
  { ssr: false }
);

import ReactPlugin from "@stagewise-plugins/react";

export default function StagewiseToolbarWrapper() {
  // 只在开发环境渲染
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
  );
}
