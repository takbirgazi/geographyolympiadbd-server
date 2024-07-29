const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
require("dotenv").config();

// SSL Commerz Start
const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.SSLCOMMERZ_STORE_ID
const store_passwd = process.env.SSLCOMMERZ_STORE_PASS
const is_live = false //true for live, false for sandbox
//SSL Commerz End
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
        const paymentInfo = database.collection('payment');


        // SSL Commerz
        //sslcommerz init
        const tranjectionId = new ObjectId().toString()
        app.post("/order", async (req, res) => {
            const product = await registerUser.findOne({ _id: new ObjectId(req.body._id) });

            const data = {
                total_amount: 100,
                currency: 'BDT',
                tran_id: tranjectionId, // use unique tran_id for each api call
                success_url: `${process.env.SERVER_API}/payment/success/${tranjectionId}`,
                fail_url: `${process.env.SERVER_API}/payment/fail`,
                cancel_url: `${process.env.SERVER_API}/payment/cancel`,
                ipn_url: `${process.env.SERVER_API}/payment/ipn`,
                shipping_method: 'No Shipping',
                product_name: 'geographyolympiadbd',
                product_category: 'geographyolympiadbd',
                product_profile: 'Register',
                cus_name: product.stdName,
                cus_email: product.stdEmail,
                cus_add1: 'Bangladesh',
                cus_add2: 'Bangladesh',
                cus_city: 'Bangladesh',
                cus_state: 'Bangladesh',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: product.stdPhone,
                cus_fax: product.stdPhone,
                ship_name: product.stdName,
                ship_add1: 'Bangladesh',
                ship_add2: 'Bangladesh',
                ship_city: 'Bangladesh',
                ship_state: 'Bangladesh',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };

            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL })
            });

            app.post(`/payment/success/:tran_id`, (req, res) => {
                const paymentSuccess = req.params.tran_id;
                const paymentData = {
                    userName: product.stdName,
                    userEmail: product.stdEmail,
                    userPhone: product.stdPhone,
                    transectionId: tranjectionId,
                    successTransectionId: paymentSuccess
                }
                const email = product.stdEmail;
                const query = { email };
                const updateData = {
                    $set: {
                        isRegister: "Paid"
                    }
                }
                allUsers.updateOne(query, updateData);
                paymentInfo.insertOne(paymentData);
                res.redirect(`${process.env.CLIENT_API}/registration`)
            });

            app.post(`/payment/fail`, (req, res) => {
                res.redirect(`${process.env.CLIENT_API}/registration`)
            });
            app.post(`/payment/cancel`, (req, res) => {
                res.redirect(`${process.env.CLIENT_API}/registration`)
            });

        })
        // SSL Commerz


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
        app.get('/users', async (req, res) => {
            const users = await allUsers.find().toArray();
            res.send(users);
            
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