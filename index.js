const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');


// MongoDB Start
// https://geographyolympiadbd-server.vercel.app 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mbbwdlc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Database and Collections
        const database = client.db('geographyolympiad');
        const allUsers = database.collection('users');


        app.get('/users', async(req, res)=>{
           const user =await allUsers.find().toArray();
           res.send(user);
        });
        app.post('/users', async(req, res)=>{
            const data = req.body;
            const result = await allUsers.insertOne(data);
            res.send(result);
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// MongoDB End

app.get('/', (req, res) => {
    res.send(`Welcome to Geography Olympiad BD`);
})
app.listen(port, () => {
    console.log(`Geography Olympiad BD is running at ${port}`);
})