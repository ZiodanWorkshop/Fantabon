import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { users, goals, recomputePoints } from './data.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true, app: 'fantabon' });
});

app.get('/api/users', (_, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, city } = req.body;
  if (!name) return res.status(400).json({ message: 'Il nome è obbligatorio' });
  const user = { id: nanoid(), name, city: city || 'Non specificata', points: 0 };
  users.push(user);
  res.status(201).json(user);
});

app.get('/api/goals', (_, res) => {
  const payload = goals.map((goal) => ({
    ...goal,
    user: users.find((u) => u.id === goal.userId)?.name || 'Utente'
  }));
  res.json(payload);
});

app.post('/api/goals', (req, res) => {
  const { userId, title, category, points, target } = req.body;
  if (!userId || !title || !target || !points) {
    return res.status(400).json({ message: 'Compila tutti i campi richiesti' });
  }
  const goal = {
    id: nanoid(),
    userId,
    title,
    category: category || 'Altro',
    points: Number(points),
    progress: 0,
    target: Number(target),
    completed: false
  };
  goals.push(goal);
  recomputePoints();
  res.status(201).json(goal);
});

app.patch('/api/goals/:id/progress', (req, res) => {
  const goal = goals.find((item) => item.id === req.params.id);
  if (!goal) return res.status(404).json({ message: 'Obiettivo non trovato' });
  const progress = Number(req.body.progress);
  goal.progress = Math.min(progress, goal.target);
  goal.completed = goal.progress >= goal.target;
  recomputePoints();
  res.json(goal);
});

app.get('/api/leaderboard', (_, res) => {
  const leaderboard = [...users].sort((a, b) => b.points - a.points);
  res.json(leaderboard);
});

app.get('/api/stats', (_, res) => {
  const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
  const completedGoals = goals.filter((goal) => goal.completed).length;
  res.json({
    totalUsers: users.length,
    totalGoals: goals.length,
    totalPoints,
    completedGoals
  });
});

app.listen(PORT, () => {
  console.log(`Fantabon API attiva sulla porta ${PORT}`);
});
