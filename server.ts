import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  owner: 'partner1' | 'partner2' | 'shared';
  date: string;
  payment_method: string;
  status: 'paid' | 'pending';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// In-memory data store with file persistence
const DATA_FILE = path.join(__dirname, 'transactions-data.json');

const INITIAL_DATA: TransactionItem[] = [
  {
    id: 'tx-001',
    description: 'Salário Johnatha',
    amount: 6500.00,
    type: 'income',
    category: 'salario',
    owner: 'partner1',
    date: '2026-09-05',
    payment_method: 'transferencia',
    status: 'paid',
    notes: 'Salário mensal recebido via conta jurídica',
  },
  {
    id: 'tx-002',
    description: 'Salário Esposa',
    amount: 5800.00,
    type: 'income',
    category: 'salario',
    owner: 'partner2',
    date: '2026-09-05',
    payment_method: 'transferencia',
    status: 'paid',
    notes: 'Salário mensal recebido via CLT',
  },
  {
    id: 'tx-003',
    description: 'Aluguel do Apartamento + Condomínio',
    amount: 3200.00,
    type: 'expense',
    category: 'moradia',
    owner: 'shared',
    date: '2026-09-10',
    payment_method: 'boleto',
    status: 'paid',
    notes: 'Pago por Johnatha',
  },
  {
    id: 'tx-004',
    description: 'Supermercado do Mês (Pão de Açúcar)',
    amount: 1450.60,
    type: 'expense',
    category: 'supermercado',
    owner: 'shared',
    date: '2026-09-12',
    payment_method: 'cartao_credito',
    status: 'paid',
    notes: 'Passado no cartão da Esposa',
  },
  {
    id: 'tx-005',
    description: 'Conta de Energia (Enel)',
    amount: 280.40,
    type: 'expense',
    category: 'utilidades',
    owner: 'shared',
    date: '2026-09-15',
    payment_method: 'pix',
    status: 'paid',
    notes: 'Debitado da conta conjunta',
  },
  {
    id: 'tx-006',
    description: 'Internet Fibra 500MB',
    amount: 129.90,
    type: 'expense',
    category: 'utilidades',
    owner: 'shared',
    date: '2026-09-18',
    payment_method: 'pix',
    status: 'paid',
  },
  {
    id: 'tx-007',
    description: 'Jantar Romântico de Sexta',
    amount: 320.00,
    type: 'expense',
    category: 'restaurante',
    owner: 'shared',
    date: '2026-09-19',
    payment_method: 'cartao_credito',
    status: 'paid',
    notes: 'Comemoração no bistrô',
  },
  {
    id: 'tx-012',
    description: 'Plano de Saúde Familiar (Próximo Vencimento)',
    amount: 980.00,
    type: 'expense',
    category: 'saude',
    owner: 'shared',
    date: '2026-09-28',
    payment_method: 'boleto',
    status: 'pending',
    notes: 'Vence no fim do mês',
  }
];

let transactions: TransactionItem[] = [];

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    transactions = JSON.parse(raw);
  } else {
    transactions = [...INITIAL_DATA];
    fs.writeFileSync(DATA_FILE, JSON.stringify(transactions, null, 2));
  }
} catch (e) {
  transactions = [...INITIAL_DATA];
}

function persistData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transactions, null, 2));
  } catch (err) {
    console.error('Erro ao salvar transactions-data.json', err);
  }
}

// SSE Connected clients
type SSEClient = {
  id: string;
  res: express.Response;
};

let clients: SSEClient[] = [];

function broadcast(eventType: string, data: any, originClientId?: string) {
  const payload = JSON.stringify({ eventType, data, timestamp: new Date().toISOString() });
  clients.forEach(client => {
    try {
      client.res.write(`event: message\ndata: ${payload}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

function broadcastClientCount() {
  const payload = JSON.stringify({
    eventType: 'CONNECTED_DEVICES',
    count: clients.length,
    timestamp: new Date().toISOString(),
  });
  clients.forEach(client => {
    try {
      client.res.write(`event: message\ndata: ${payload}\n\n`);
    } catch (e) {}
  });
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // API Routes
  // 1. Get all transactions
  app.get('/api/transactions', (req, res) => {
    res.json({ transactions });
  });

  // 2. Add transaction
  app.post('/api/transactions', (req, res) => {
    const newTx: TransactionItem = {
      ...req.body,
      id: req.body.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    // Prepend to list
    transactions = [newTx, ...transactions.filter(t => t.id !== newTx.id)];
    persistData();

    // Broadcast instant event to all other open devices (phones, tablets, laptops)
    broadcast('INSERT', newTx, req.headers['x-client-id'] as string);

    res.status(201).json({ success: true, transaction: newTx });
  });

  // 3. Update transaction
  app.put('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    const index = transactions.findIndex(t => t.id === id);

    if (index === -1) {
      // If not exists, insert it
      const newTx: TransactionItem = {
        ...req.body,
        id,
        updated_at: new Date().toISOString(),
      };
      transactions = [newTx, ...transactions];
      persistData();
      broadcast('INSERT', newTx, req.headers['x-client-id'] as string);
      return res.json({ success: true, transaction: newTx });
    }

    const updatedTx = {
      ...transactions[index],
      ...req.body,
      id,
      updated_at: new Date().toISOString(),
    };
    transactions[index] = updatedTx;
    persistData();

    broadcast('UPDATE', updatedTx, req.headers['x-client-id'] as string);
    res.json({ success: true, transaction: updatedTx });
  });

  // 4. Delete transaction
  app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    transactions = transactions.filter(t => t.id !== id);
    persistData();

    broadcast('DELETE', { id }, req.headers['x-client-id'] as string);
    res.json({ success: true, id });
  });

  // 5. Bulk sync / restore
  app.post('/api/transactions/bulk', (req, res) => {
    const incoming: TransactionItem[] = req.body.transactions || [];
    if (Array.isArray(incoming) && incoming.length > 0) {
      const map = new Map<string, TransactionItem>();
      incoming.forEach(t => map.set(t.id, t));
      transactions.forEach(t => {
        if (!map.has(t.id)) map.set(t.id, t);
      });
      transactions = Array.from(map.values());
      persistData();
      broadcast('RELOAD', { transactions }, req.headers['x-client-id'] as string);
    }
    res.json({ success: true, count: transactions.length });
  });

  // 6. Real-time Server-Sent Events (SSE) stream for instant synchronization
  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newClient: SSEClient = { id: clientId, res };
    clients.push(newClient);

    // Initial greeting with client id and current count
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, connectedDevices: clients.length })}\n\n`);
    broadcastClientCount();

    // Heartbeat every 20s to avoid Cloud Run / proxy idle timeouts
    const heartbeatTimer = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      clients = clients.filter(c => c.id !== clientId);
      broadcastClientCount();
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer();
