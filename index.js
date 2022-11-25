const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config();
// const stripe = require("stripe")(process.env.STRIPE_ACCESS);
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



//-------------------------
//-------------------------
//-------------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6tylirv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//-------------------------
// jwt veryfication
//-------------------------
function veryfyJWT(req, res, next) {
    const authHeader = req.headers.authuraization;
    if (!authHeader) {
        return res.status(401).send('unauthorize access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'fobiden access' })
        }
        req.decoded = decoded;
        next();
    })
}
//-------------------------
// run funtin start here
//-------------------------
async function run() {
    try {
        //-------------------------------------
        // all cullections in Watch-Granary DB
        //-------------------------------------
        const userCullection = client.db('Watch-Granary').collection('users');
        const productCullection = client.db('Watch-Granary').collection('products');
        //------------------------- 
        // save user in DB
        //-------------------------
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            const email = req.body.email;
            const query = { email }
            const olduser = await userCullection.findOne(query);
            if (olduser == null) {
                const result = await userCullection.insertOne(userInfo);
                res.send(result)
            }
            res.send(olduser)
        });
        //-------------------------
        // get jwt token
        //-------------------------
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const quary = { email: email }
            const user = await userCullection.findOne(quary);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '3h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
            // res.send(user);
            // console.log(email, user)
        });
        //-------------------------
        // add product by seller
        //-------------------------
        app.post('/addproduct', async (req, res) => {
            const productInfo = req.body;
            const result = await productCullection.insertOne(productInfo);
            res.send(result);
        });
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
        //-------------------------
    }
    finally {

    }
}

run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('runing on wwwwwww')
})

app.listen(port, () => console.log(`runing on........... ${port}`))