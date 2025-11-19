from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import logging
from datetime import datetime
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics
notifications_sent = Counter('notifications_sent_total', 'Total notifications sent', ['type'])

class OrderNotification(BaseModel):
    userId: int
    orderId: int
    total: float

class EmailNotification(BaseModel):
    to: str
    subject: str
    body: str

# Mock notification functions
async def send_email(to: str, subject: str, body: str):
    """Mock email sending"""
    logger.info(f"📧 Sending email to {to}: {subject}")
    logger.info(f"Body: {body}")
    notifications_sent.labels(type='email').inc()

async def send_sms(phone: str, message: str):
    """Mock SMS sending"""
    logger.info(f"📱 Sending SMS to {phone}: {message}")
    notifications_sent.labels(type='sms').inc()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "notification-service",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/ready")
async def readiness_check():
    return {"status": "ready"}

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/api/notifications/order-created")
async def notify_order_created(notification: OrderNotification, background_tasks: BackgroundTasks):
    """Send notification when order is created"""
    subject = f"Order #{notification.orderId} Confirmed"
    body = f"""
    Thank you for your order!

    Order ID: {notification.orderId}
    Total: ${notification.total:.2f}

    We'll send you updates as your order is processed.
    """

    # In production, fetch user email from user service
    background_tasks.add_task(send_email, f"user{notification.userId}@example.com", subject, body)

    logger.info(f"Order notification queued for order {notification.orderId}")
    return {"status": "notification queued"}

@app.post("/api/notifications/email")
async def send_email_notification(email: EmailNotification, background_tasks: BackgroundTasks):
    """Send custom email notification"""
    background_tasks.add_task(send_email, email.to, email.subject, email.body)
    return {"status": "email queued"}

@app.post("/api/notifications/sms")
async def send_sms_notification(phone: str, message: str, background_tasks: BackgroundTasks):
    """Send SMS notification"""
    background_tasks.add_task(send_sms, phone, message)
    return {"status": "sms queued"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5004, reload=True)
