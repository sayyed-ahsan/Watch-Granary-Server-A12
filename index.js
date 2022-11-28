const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { parse } = require('dotenv');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_ACCESS);
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());




//-------------------------
// DB conection
//-------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6tylirv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//-------------------------
// jwt veryfication
//-------------------------
function veryfyJWT(req, res, next) {
    const authHeader = req?.headers?.authuraization;
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
        const categoriesCullection = client.db('Watch-Granary').collection('categories');
        const productCullection = client.db('Watch-Granary').collection('products');
        const userBookingCullection = client.db('Watch-Granary').collection('Userbooking');
        //-------------------------------------
        // all cullections in Watch-Granary DB
        //-------------------------------------




        //-------------------------
        //get current User
        //-------------------------
        app.get('/currectUser', async (req, res) => {
            const email = req.query.email;
            const quary = { email: email };
            const currentUser = await userCullection.findOne(quary);
            res.send(currentUser);
        });



        //-------------------------
        //save payments in DB
        //-------------------------
        app.put('/payments', async (req, res) => {
            const payment = req.body;
            const id = payment.bookingId
            // console.log(payment.email)
            const filter = { _id: ObjectId(id) }
            const option = { ussert: true }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                    advertise: false
                }
            }
            const updatedResult = await userBookingCullection.updateOne(filter, updatedDoc, option)
            res.send(updatedResult);
        })

        //-------------------------
        //change payment status from old cullection
        //-------------------------


        app.put('/paymentsOld/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: ObjectId(id) }
            const option = { ussert: true }
            const updatedDocOld = {
                $set: {
                    stoke: "sold",
                    advertise: false
                }
            }
            const updatedResultOld = await productCullection.updateOne(filter, updatedDocOld, option)
            res.send(updatedResultOld);
            console.log("donsssssss--------ss", updatedResultOld)
        })


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
                console.log(result);

            }
        });
        //------------------------- 
        // delete user from DB by id
        //-------------------------
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('trying to delete', id);
            const query = { _id: ObjectId(id) }
            const result = await userCullection.deleteOne(query);
            console.log(result);
            res.send(result);
        });
        //-------------------------
        // get jwt token
        //-------------------------
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const quary = { email: email }
            const user = await userCullection.findOne(quary);
            console.log(user)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '3h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
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
        // get all buyers to DB
        //-------------------------
        app.get('/buyers', async (req, res) => {
            const quary = { status: "buyer" }
            const buyers = await userCullection.find(quary).toArray();
            res.send(buyers);
        });
        //-------------------------
        // get all sellers to DB
        //-------------------------
        app.get('/sellers', async (req, res) => {
            const quary = { status: "seller" }
            const sellers = await userCullection.find(quary).toArray();
            res.send(sellers);
        });
        //-------------------------
        // seller products by email
        //-------------------------
        app.get('/myProducts', async (req, res) => {
            const email = req.query.email;
            const query = { email }
            const products = await productCullection.find(query).toArray();
            res.send(products);
        })
        //-------------------------
        // get categories cullection
        //-------------------------
        app.get('/categories', async (req, res) => {
            const query = {}
            const categories = await categoriesCullection.find(query).toArray();
            res.send(categories);
        })
        //-------------------------
        // get categories wise products
        //-------------------------
        app.get('/categories/:cullection', veryfyJWT, async (req, res) => {
            const cullection = req.params.cullection;
            const query = { category: cullection }
            const products = await productCullection.find(query).toArray();
            res.send(products);
        })
        //-------------------------
        // set booked info: stoke, bayerEmail
        //-------------------------
        // app.put('/categories/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const bayerEmail = req.query.email;
        //     const option = { upsert: true }
        //     const filter = { _id: ObjectId(id) }
        //     const updatDoc = {
        //         $set: {
        //             stoke: "sold",
        //             paid: false,
        //             buyerEmail: bayerEmail,
        //         }
        //     }
        //     const resust = await productCullection.updateOne(filter, updatDoc, option);
        //     res.send(resust);

        // })
        //-------------------------
        // set booked info in new cullection
        //-------------------------
        app.post('/categories/:id', async (req, res) => {
            const id = req.params.id;

            const bookingInfo = JSON.parse(req.headers.bookingproduct);
            const result = await userBookingCullection.insertOne(bookingInfo);
            res.send(result);
            console.log(result)

        })
        //-------------------------
        // report product by id
        //-------------------------
        app.put('/product/report/:id', async (req, res) => {
            const id = req.params.id;
            console.log('hitttttt', id)
            const option = { upsert: true }
            const filter = { _id: ObjectId(id) }
            const updatDoc = {
                $set: {
                    report: "reported",
                }
            }
            const resust = await productCullection.updateOne(filter, updatDoc, option);
            res.send(resust);
            console.log(resust)
        })
        //-------------------------
        // verify a seller by id
        //-------------------------
        app.put('/verifySeller/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('hitttttt')
            const option = { upsert: true }
            const filter = { _id: ObjectId(id) }
            const updatDoc = {
                $set: {
                    verify: true,
                }
            }
            const resust = await userCullection.updateOne(filter, updatDoc, option);
            res.send(resust);
            // console.log(resust)
        })
        //-------------------------
        // verify a Product by id
        //-------------------------
        app.put('/verifyProduct', async (req, res) => {
            const sellerEmail = req.query.email;
            // console.log('hitttttt', sellerEmail)
            const option = { upsert: true }
            const quary = { email: sellerEmail }
            const uadateproduct = {
                $set: {
                    verify: true,
                }
            }
            const resustproduct = await productCullection.updateMany(quary, uadateproduct, option);
            res.send(resustproduct);
            // console.log(resust)
        })
        //-------------------------
        // Advertise Product by id
        //-------------------------
        app.put('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            console.log('hitttttt', id)
            const option = { upsert: true }
            const filter = { _id: ObjectId(id) }
            const updatDoc = {
                $set: {
                    advertise: true,
                }
            }
            const resust = await productCullection.updateOne(filter, updatDoc, option);
            res.send(resust);
            // console.log(resust)
        })

        //-------------------------
        // Get Advertise Product from db
        //-------------------------
        app.get('/advertisedProduct', async (req, res) => {
            const query = { advertise: true }
            const categories = await productCullection.find(query).toArray();
            res.send(categories);
        })
        //-------------------------
        // get reported products
        //-------------------------
        app.get('/reportedProducts', async (req, res) => {
            const query = { report: "reported" }
            const result = await productCullection.find(query).toArray();
            // res.send({ isAdmin: user?.role === 'admin' });
            res.send(result)
        })
        //------------------------- 
        // delete reported product from DB by id
        //-------------------------
        app.delete('/reportedProduct/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('trying to delete', id);
            const query = { _id: ObjectId(id) }
            const result = await productCullection.deleteOne(query);
            console.log(result);
            res.send(result);
        });
        // //-------------------------
        // get mybookings by axios ------------------veryfyJWT
        //-------------------------
        app.get('/mybookings', veryfyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email }
            const result = await userBookingCullection.find(query).toArray();
            // res.send({ isAdmin: user?.role === 'admin' });
            res.send(result)
        })
        //-------------------------
        // to get product info in payment page
        //-------------------------
        app.get('/payment/:productId', async (req, res) => {
            const id = req.params.productId;
            const quary = { _id: ObjectId(id) }
            const result = await userBookingCullection.findOne(quary);
            res.send(result);
        });
        //-------------------------
        // stripe payment intent
        //-------------------------
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            // console.log(booking)
            const price = parseFloat(booking.price);
            const amount = price * 100;
            // console.log(booking, price, amount)
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
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
    }
    finally {

    }
}

run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('runing on wwwwwww')
})

app.listen(port, () => console.log(`runing on........... ${port}`))