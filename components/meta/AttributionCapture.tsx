"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution-client";

export function AttributionCapture() {
  useEffect(() => {
    captureAttribution(window.location.search);
  }, []);
  return null;
}
