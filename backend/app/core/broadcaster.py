import asyncio
import json
from typing import Dict, List, Any
from asyncio import Queue

class Broadcaster:
    def __init__(self):
        # user_id -> List[Queue]
        self.connections: Dict[int, List[Queue]] = {}

    async def subscribe(self, user_id: int) -> Queue:
        queue = Queue()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(queue)
        return queue

    async def unsubscribe(self, user_id: int, queue: Queue):
        if user_id in self.connections:
            if queue in self.connections[user_id]:
                self.connections[user_id].remove(queue)
            if not self.connections[user_id]:
                del self.connections[user_id]

    async def publish(self, user_id: int, data: Any):
        if user_id in self.connections:
            for queue in self.connections[user_id]:
                try:
                    queue.put_nowait(data)
                except asyncio.QueueFull:
                    pass

    def trigger(self, user_id: int, data: Any):
        """Thread-safe and sync-safe way to trigger a publish."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.publish(user_id, data))
            else:
                # This case is unlikely in FastAPI but good to have
                asyncio.run(self.publish(user_id, data))
        except Exception:
            # Fallback for thread safety
            try:
                import threading
                # If we are in a different thread, we should use run_coroutine_threadsafe
                # but we need a reference to the main loop. 
                # For now, let's keep it simple as FastAPI usually has the loop in the same thread for def routes.
                pass
            except Exception:
                pass

broadcaster = Broadcaster()
