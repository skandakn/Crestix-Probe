import { NextRequest } from "next/server";
import { subscribeToSensorStream, getLatestSensorReading } from "../store";
import type { RealtimeSensorEnvelope } from "@/features/sensors/types";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const initialEnvelope: RealtimeSensorEnvelope = {
        event: "sensor.reading",
        topic: "crestix/probe/sensors/telemetry",
        payload: getLatestSensorReading() || ({} as unknown as RealtimeSensorEnvelope["payload"]),
        sentAt: new Date().toISOString(),
      };

      controller.enqueue(
        encoder.encode(`event: connect\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`)
      );

      if (initialEnvelope.payload && "readingId" in initialEnvelope.payload) {
        controller.enqueue(
          encoder.encode(`event: sensor.reading\ndata: ${JSON.stringify(initialEnvelope)}\n\n`)
        );
      }

      // Subscribe to subsequent hardware frames
      const unsubscribe = subscribeToSensorStream((envelope: RealtimeSensorEnvelope) => {
        try {
          const payloadString = JSON.stringify(envelope);
          controller.enqueue(
            encoder.encode(`event: sensor.reading\ndata: ${payloadString}\n\n`)
          );
        } catch {
          // Stream might be closed
        }
      });

      // Keepalive ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`)
          );
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
