import os
import json
import asyncio
from aiokafka import AIOKafkaConsumer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import AccessLog
from backend.database.session import AsyncSessionLocal
from backend.ml.engine import calculate_anomaly_score_for_log
from backend.services.alert_correlation import correlate_alerts

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPIC = os.getenv("KAFKA_TOPIC", "insiderguard-events")

async def _process_message(message: bytes, db: AsyncSession) -> None:
    payload = json.loads(message.decode("utf-8"))
    access_log = AccessLog(**payload)
    db.add(access_log)
    await db.commit()
    await db.refresh(access_log)
    access_log.anomaly_score = await calculate_anomaly_score_for_log(access_log)
    await db.commit()

async def start_consumer() -> None:
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id="insiderguard-consumer",
        enable_auto_commit=False,
    )
    await consumer.start()
    try:
        async for msg in consumer:
            async with AsyncSessionLocal() as db:
                await _process_message(msg.value, db)
            await consumer.commit()
    finally:
        await consumer.stop()
