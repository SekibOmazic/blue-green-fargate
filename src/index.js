import express from 'express';

import usersRoutes from './routes/users.js';

const app = express();
const PORT = 80;

app.use(express.json());

const page = `
<head>
  <title>Blue-Green deployment</title>
</head>

<body style="background-color: cornflowerblue;">
  <h1 style="color: white; text-align: center;">
    Hello from AWS Fargate
  </h1>
</body>
`

app.get('/', (_req, res) => {
  res.setHeader('Content-type', 'text/html')
  return res.send(page)
})

app.use('/user', usersRoutes);
app.get('/health', (_req, res) => res.send('Healthy!'));
app.all('*', (_req, res) => res.send('Ooops, no such route'));

app.listen(PORT, () =>
  console.log(`Server running on port: http://localhost:${PORT}`)
);