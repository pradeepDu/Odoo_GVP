import request from "supertest";
import express from "express";
import routes from "../src/routes";

const app = express();
app.use(express.json());
app.use("/api", routes);

describe("Auth API", () => {
  it("POST /api/auth/login with missing body returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/login with invalid email returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "secret" });
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/register with invalid body returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });
});
