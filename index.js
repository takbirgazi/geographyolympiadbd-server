const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Start

// MongoDB End

app.get('/', (req, res)=>{
    res.send(`Welcome to Geography Olympiad BD`);
})
app.listen(port, ()=>{
    console.log(`Geography Olympiad BD is running at ${port}`);
})