"""Kafka integration for InsiderGuard."""
from .producer import produce_event
from .consumer import start_consumer

__all__ = ["produce_event", "start_consumer"]
