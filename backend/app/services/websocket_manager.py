"""WebSocket connection hub for streaming live sensor telemetry and job updates."""

import asyncio
from typing import Any

from fastapi import WebSocket


class TelemetryWebSocketManager:
    """Manages active WebSocket clients and broadcasts JSON messages."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    @property
    def active_count(self) -> int:
        return len(self._connections)

    async def broadcast(self, message: dict[str, Any]) -> None:
        if not self._connections:
            return
        stale: list[WebSocket] = []
        for connection in list(self._connections):
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)
        for dead in stale:
            self._connections.discard(dead)


ws_manager = TelemetryWebSocketManager()
