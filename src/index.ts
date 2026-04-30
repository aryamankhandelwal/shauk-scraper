import "dotenv/config";
import express, { Request, Response } from "express";
import { supabase } from "./lib/supabase";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "shauk-scraper" });
});

app.get("/search", async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  if (!q) {
    return res.status(400).json({ ok: false, error: "q parameter is required" });
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("title", `%${q}%`)
    .limit(10);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  res.json({ ok: true, products: data });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`shauk-scraper API running on port ${PORT}`);
});
