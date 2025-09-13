const express = require("express");
const connectDb = require("./connection/db")
const dotenv = require("dotenv");
const adminRouter = require("./router/admin");
const userRouter = require("./router/user");
const cors=require("cors");

const app = express();
let PORT = 3000;
app.use(express.json());
app.use(cors());
dotenv.config();
connectDb();


app.use('/user/api/', userRouter)
app.use('/user/api/admin', adminRouter)


app.get('/', (req, res) => {
  res.send('Server is running');
});


app.listen(PORT, () => {
  console.log(`Order.India-Api is running  on http://localhost:${PORT}`);
});