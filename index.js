const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
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
        // await client.connect();
        // Database and Collections
        const database = client.db('geographyolympiad');
        const allUsers = database.collection('users');
        const registerUser = database.collection('registerUser');


        // Token Verify
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorize access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorize access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        //JWT API
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
                expiresIn: "1h"
            })
            res.send(token);
        })

        app.get('/users/registration/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await allUsers.findOne(query);
            res.send(result);
        });
        app.post('/users', async (req, res) => {
            const data = req.body;
            const query = { email: data.email };
            const existUser = await allUsers.findOne(query);
            if (existUser) {
                return res.send({ message: 'Already Have The User', insertedId: null });
            };
            const result = await allUsers.insertOne(data);
            res.send(result);
        });

        app.patch("/users/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const updateData = {
                $set: {
                    isRegister: "Registered"
                }
            }
            const result = await allUsers.updateOne(query, updateData);
            res.send(result);
        })

        app.post('/registration', verifyToken, async (req, res) => {
            const regData = req.body;
            const result = await registerUser.insertOne(regData);
            res.send(result);
        })
        app.get("/registration/:stdEmail", async (req, res) => {
            const stdEmail = req.params;
            const option = {
                projection: {
                    _id: 0,
                    stdName: 1,
                    stdDOB: 1,
                    stdPhone: 1,
                    stdEmail: 1,
                    stdPresentAddr: 1,
                    stdPermanentAddr: 1,
                    expectedLevel: 1,
                    stdSclClzName: 1,
                    stdSclClzAddr: 1,
                    pssExprDate: 1,
                },
            }
            const result = await registerUser.findOne(stdEmail, option);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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