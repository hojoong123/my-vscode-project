import client from "./client";

export const login = (username, password) => {
  return client.post("/auth/login", { username, password });
};