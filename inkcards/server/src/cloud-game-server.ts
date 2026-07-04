/**
 * 云游戏服务端 - WebSocket 流式传输
 * 实现低延迟游戏画面传输
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { performSecurityCheck } from '../security/startup-check.js';

if (!performSecurityCheck()) {
  console.error('[FATAL] 安全自检失败，服务拒绝启动！');
  process.exit(1);
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 游戏房间管理
interface GameRoom {
  roomId: string;
  hostId: string;
  players: Set<string>;
  gameState: any;
  createdAt: number;
}

const rooms = new Map<string, GameRoom>();
const playerRooms = new Map<string, string>();

// WebSocket 连接处理
wss.on('connection', (ws: WebSocket, req) => {
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[云游戏] 玩家连接: ${playerId}`);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connected',
    playerId,
    message: '欢迎来到万古长夜云游戏',
  }));

  // 心跳检测
  let heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);

  // 消息处理
  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, playerId, message);
    } catch (error) {
      console.error('[云游戏] 消息解析错误:', error);
    }
  });

  // 断开连接
  ws.on('close', () => {
    console.log(`[云游戏] 玩家断开: ${playerId}`);
    clearInterval(heartbeatInterval);
    
    // 清理房间
    const roomId = playerRooms.get(playerId);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          rooms.delete(roomId);
        }
      }
      playerRooms.delete(playerId);
    }
  });

  // 错误处理
  ws.on('error', (error) => {
    console.error(`[云游戏] WebSocket 错误: ${playerId}`, error);
  });
});

// 消息处理
function handleMessage(ws: WebSocket, playerId: string, message: any) {
  switch (message.type) {
    case 'pong':
      // 心跳响应
      break;

    case 'create_room':
      // 创建房间
      const roomId = `room_${Date.now()}`;
      const room: GameRoom = {
        roomId,
        hostId: playerId,
        players: new Set([playerId]),
        gameState: initializeGameState(),
        createdAt: Date.now(),
      };
      rooms.set(roomId, room);
      playerRooms.set(playerId, roomId);
      
      ws.send(JSON.stringify({
        type: 'room_created',
        roomId,
        message: '房间创建成功',
      }));
      break;

    case 'join_room':
      // 加入房间
      const joinRoomId = message.roomId;
      const joinRoom = rooms.get(joinRoomId);
      
      if (joinRoom) {
        joinRoom.players.add(playerId);
        playerRooms.set(playerId, joinRoomId);
        
        ws.send(JSON.stringify({
          type: 'room_joined',
          roomId: joinRoomId,
          gameState: joinRoom.gameState,
        }));
        
        // 广播给房间内其他玩家
        broadcastToRoom(joinRoomId, {
          type: 'player_joined',
          playerId,
        }, playerId);
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: '房间不存在',
        }));
      }
      break;

    case 'game_action':
      // 游戏操作
      const actionRoomId = playerRooms.get(playerId);
      if (actionRoomId) {
        const actionRoom = rooms.get(actionRoomId);
        if (actionRoom) {
          // 处理游戏操作
          const result = processGameAction(actionRoom.gameState, message.action, playerId);
          actionRoom.gameState = result.newState;
          
          // 广播给所有玩家
          broadcastToRoom(actionRoomId, {
            type: 'game_update',
            state: actionRoom.gameState,
            action: message.action,
            playerId,
          });
        }
      }
      break;

    case 'stream_frame':
      // 视频帧流传输（云游戏核心）
      // 这里会接收游戏画面帧并转发给客户端
      const streamRoomId = playerRooms.get(playerId);
      if (streamRoomId) {
        broadcastToRoom(streamRoomId, {
          type: 'frame_update',
          frame: message.frame,
          timestamp: Date.now(),
        }, playerId);
      }
      break;

    default:
      console.log(`[云游戏] 未知消息类型: ${message.type}`);
  }
}

// 广播给房间内玩家
function broadcastToRoom(roomId: string, message: any, excludePlayer?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    // 这里需要维护 playerId -> WebSocket 的映射
    // 简化实现，实际需要更完善的映射
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// 初始化游戏状态
function initializeGameState() {
  return {
    turn: 1,
    currentPlayer: 1,
    players: {
      1: { hp: 100, mana: 5, hand: [], field: [] },
      2: { hp: 100, mana: 5, hand: [], field: [] },
    },
    logs: [],
  };
}

// 处理游戏操作
function processGameAction(state: any, action: any, playerId: string) {
  // 这里实现游戏逻辑
  // 返回新的游戏状态
  return {
    newState: {
      ...state,
      logs: [...state.logs, { action, playerId, timestamp: Date.now() }],
    },
  };
}

// API 路由
app.get('/api/v1/cloud/status', (req, res) => {
  res.json({
    success: true,
    data: {
      activeRooms: rooms.size,
      activePlayers: playerRooms.size,
      uptime: process.uptime(),
    },
  });
});

app.post('/api/v1/cloud/match', (req, res) => {
  // 匹配系统
  res.json({
    success: true,
    message: '匹配中...',
    estimatedWait: 5,
  });
});

const PORT = process.env.CLOUD_GAME_PORT || 9092;
server.listen(PORT, () => {
  console.log(`[云游戏服务] 已启动在端口 ${PORT}`);
});

export { app, server, wss };
