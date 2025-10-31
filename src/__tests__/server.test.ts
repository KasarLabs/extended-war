// import supertest from "supertest";
// import { createServer } from "../server.js";
// import { ConfigSchema } from "../core/config.js";

// describe("Server", () => {
//   it("health check returns 200", async () => {
//     await supertest(createServer(config))
//       .get("/status")
//       .expect(200)
//       .then((res) => {
//         expect(res.ok).toBe(true);
//       });
//   });

//   it("message endpoint says hello", async () => {
//     const config : ConfigSchema = {};
//     await supertest(createServer(config))
//       .get("/message/jared")
//       .expect(200)
//       .then((res) => {
//         expect(res.body).toEqual({ message: "hello jared" });
//       });
//   });
// });
