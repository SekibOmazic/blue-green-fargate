import { v4 as uuid } from "uuid";

let users = [];

export const getUsers = (_req, res) => {
  console.log(`Users in the database:`);
  users.map((user) => console.log(user));

  res.send(users);
};

export const createUser = (req, res) => {
  const usr = req.body;

  const user = { ...usr, id: uuid() };
  users.push(user);

  console.log(`User [${JSON.stringify(user)}] added to the database.`);

  res.send(user);
};

export const getUser = (req, res) => {
  const user = users.find((user) => user.id === req.params.id);

  res.send(user);
};

export const deleteUser = (req, res) => {
  users = users.filter((user) => user.id !== req.params.id);

  console.log(`user with id ${req.params.id} has been deleted`);

  res.send(req.params.id);
};

export const updateUser = (req, res) => {
  const user = users.find((user) => user.id === req.params.id);

  user.username = req.body.username;
  user.age = req.body.age;

  console.log(
    `username has been updated to ${req.body.username}.age has been updated to ${req.body.age}`
  );

  res.send(user);
};
