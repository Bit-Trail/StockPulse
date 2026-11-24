import { Request, Response } from 'express';

let clients: Response[] = [];

export const sseHandler = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send an initial connection confirmation event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter((client) => client !== res);
  });
};

export const broadcastEvent = (eventName: string, payload: unknown) => {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => client.write(message));
};