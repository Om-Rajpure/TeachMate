import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'notifications'
        
        # Join group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def send_notification(self, event):
        message = event['message']
        notification_type = event['notification_type']
        title = event['title']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'title': title,
            'message': message,
            'type': notification_type
        }))
