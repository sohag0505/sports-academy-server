const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

require("dotenv").config();
//middleware
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nd7baz7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log("connected");
    const classesCollection = client
      .db("sportsAcademies")
      .collection("classes");
    const instructorsCollection = client
      .db("sportsAcademies")
      .collection("instructor");
    const selectedClassesCollection = client
      .db("fighting-spirit")
      .collection("selected-classes");
    const usersCollection = client.db("sportsAcademies").collection("users");
    const paymentCollection = client
      .db("sportsAcademies")
      .collection("payment");

    // for jwt make token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // classes
    app.get("/classes", async (req, res) => {
      const { email, status } = req.query;
      let query = {};
      if (email) {
        query = { instructorEmail: email };
      }
      if (status) {
        query = { status: status };
      }
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });
    // instructors
    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });
    // users
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user)
      const query = { email: user.email };
      const currentUser = await usersCollection.findOne(query);
      //    console.log(currentUser)
      if (currentUser) {
        res.send({});
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });
    // user //role
    // get single user
    app.get("/userRole", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = (await usersCollection.findOne(query)) || {};
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // get selected Classes
    app.get("/selectedClass/:email", async (req, res) => {
      const email = req.params.email;
      let query = {};
      if (email) {
        query = { studentEmail: email };
      }
      const result = await selectedClassesCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/singleSelectedClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassesCollection.findOne(query);
      res.send(result);
    });

    app.post("/selectedClass", async (req, res) => {
      const data = req.body;
      const result = await selectedClassesCollection.insertOne(data);
      res.send(result);
    });

    app.delete("/selectedClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassesCollection.deleteOne(query);
      res.send(result);
    });

    // admin roles work
    app.patch("/adminRole/:id", async (req, res) => {
      const id = req.params.id;
      const role = req.body.role;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: role } };
      const options = { upsert: true };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.patch("/courseStatus/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: status } };
      const options = { upsert: true };
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // instructor role
    app.post("/addCourse", async (req, res) => {
      const courses = req.body;
      const result = await classesCollection.insertOne(courses);
      res.send(result);
    });
    app.post("/updateCourse/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const { _id, ...rest } = data;
      const filter = { _id: new ObjectId(id) };
      // console.log(id, filter, data)
      const updateDoc = { $set: rest };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/deleteCourse/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    });

    // create payment intent
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment related api
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);

      const query = { _id: new ObjectId(payment.itemId) };
      const deleteResult = await selectedClassesCollection.deleteOne(query);
      res.send({ insertResult, deleteResult });
    });
    // get Payment History
    app.get("/paymentHistory/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await paymentCollection
        .find(query)
        .sort({ fieldToSort: -1 })
        .toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Animal Toys server are running");
});

app.listen(port, () => {
  console.log(`Animal Toys server is running on port ${port}`);
});
