import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';

const app = express();
const PORT = process.env.PORT || 3001;

const users = [
  { id: nanoid(), name: 'Daniel', city: 'Milano', points: 185 },
  { id: nanoid(), name: 'Giulia', city: 'Roma', points: 240 },
  { id: nanoid(), name: 'Marco', city: 'Torino', points: 130 }
];

const goals = [
  { id: nanoid(), userId: users[0].id, title: 'Leggere 5 libri', category: 'Crescita personale', points: 80, progress: 3, target: 5, completed: false },
  { id: nanoid(), userId: users[0].id, title: 'Correre 50 km', category: 'Sport', points: 105, progress: 35, target: 50, completed: false },
  { id: nanoid(), userId: users[1].id, title: 'Visitare 4 città', category: 'Viaggi', points: 120, progress: 4, target: 4, completed: true },
  { id: nanoid(), userId: users[2].id, title: 'Studiare React', category: 'Studio', points: 130, progress: 10, target: 10, completed: true }
];

const recomputePoints = () => {
  users.forEach((user) => {
    user.points = goals
      .filter((goal) => goal.userId === user.id)
      .reduce((sum, goal) => sum + Math.round((goal.progress / goal.target) * goal.points), 0);
  });
};

recomputePoints();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_, res) => res.json({ ok: true, app: 'fantabon' }));
app.get('/api/users', (_, res) => res.json(users));
app.post('/api/users', (req, res) => {
  const { name, city } = req.body;
  if (!name) return res.status(400).json({ message: 'Il nome è obbligatorio' });
  const user = { id: nanoid(), name, city: city || 'Non specificata', points: 0 };
  users.push(user);
  res.status(201).json(user);
});
app.get('/api/goals', (_, res) => res.json(goals.map((goal) => ({ ...goal, user: users.find((u) => u.id === goal.userId)?.name || 'Utente' }))));
app.post('/api/goals', (req, res) => {
  const { userId, title, category, points, target } = req.body;
  if (!userId || !title || !target || !points) return res.status(400).json({ message: 'Compila tutti i campi richiesti' });
  const goal = { id: nanoid(), userId, title, category: category || 'Altro', points: Number(points), progress: 0, target: Number(target), completed: false };
  goals.push(goal);
  recomputePoints();
  res.status(201).json(goal);
});
app.patch('/api/goals/:id/progress', (req, res) => {
  const goal = goals.find((item) => item.id === req.params.id);
  if (!goal) return res.status(404).json({ message: 'Obiettivo non trovato' });
  goal.progress = Math.min(Number(req.body.progress), goal.target);
  goal.completed = goal.progress >= goal.target;
  recomputePoints();
  res.json(goal);
});
app.get('/api/leaderboard', (_, res) => res.json([...users].sort((a, b) => b.points - a.points)));
app.get('/api/stats', (_, res) => res.json({ totalUsers: users.length, totalGoals: goals.length, totalPoints: users.reduce((s, u) => s + u.points, 0), completedGoals: goals.filter((goal) => goal.completed).length }));
app.listen(PORT, () => console.log(`Fantabon API attiva sulla porta ${PORT}`));
