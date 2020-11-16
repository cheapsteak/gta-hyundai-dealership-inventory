import express from "express";
import { getAllDealershipsInventory } from "./getAllDealershipsInventory";

const app = express();

app.get("/api/getAllDealershipsInventory", async function (req, res) {
  res.send(await getAllDealershipsInventory());
});

app.listen(process.env.PORT || 12345);
