import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    role?: string;
  };
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8888',
        'http://localhost:4000',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  @WebSocketServer()
  server: Server;

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: AuthenticatedSocket): void {
    try {
      const token = client.handshake.auth?.token
        || client.handshake.query?.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.disconnect();
        return;
      }

      const jwtSecret = this.configService.get<string>('jwt.secret');
      if (!jwtSecret) {
        this.logger.error('JWT_SECRET not configured');
        client.disconnect();
        return;
      }

      const payload = jwt.verify(token, jwtSecret) as { sub: string; role: string };
      const userId = payload.sub;

      client.data.userId = userId;
      client.data.role = payload.role;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user_${userId}`);
      this.logger.log(`Client connected: ${client.id} for user ${userId}`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: AuthenticatedSocket, data: string): void {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return;
    }
    client.join(`user_${userId}`);
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.logger.log(`User ${userId} subscribed to notifications`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: AuthenticatedSocket, data: string): void {
    const userId = client.data.userId;
    if (!userId) return;
    client.leave(`user_${userId}`);
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  sendNotificationToUser(userId: string, notification: unknown): void {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  sendNotificationToRole(role: string, notification: unknown): void {
    this.server.to(`role_${role}`).emit('notification', notification);
  }

  broadcastNotification(notification: unknown): void {
    this.server.emit('notification', notification);
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
