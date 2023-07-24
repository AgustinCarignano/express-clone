import { express } from "./main.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/:id", (req, res) => {
  const id = req.params.id;
  res.send(id);
});

app.get("/user", (req, res) => {
  res.send("this is the user");
});
app.post("/user", (req, res) => {
  const { email } = req.body;
  res.json({ email });
});
app.post("/user/:id", (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  res.json({ id, email });
});

app.get("/user/:id", (req, res) => {
  const id = req.params.id;
  res.send(id);
});

app.delete("/user/:id", (req, res) => {
  const id = req.params.id;
  res.send(id);
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
