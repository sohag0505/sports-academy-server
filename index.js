const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

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
    const instructorCollection = client
      .db("sportsAcademies")
      .collection("instructor");

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
    app.post("/classes", async (req, res) => {
      const data = req.body;
      const result = await classesCollection.insertOne(data);
      res.send(result);
    });
    app.get("/instructor", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });
    app.post("/instructor", async (req, res) => {
      const data = req.body;
      const result = await instructorCollection.insertOne(data);
      res.send(result);
    });
    // app.get("/myToys", async (req, res) => {
    //   const email = req.query.email;
    //   //   console.log(email, req.query)
    //   const query = { email: email };
    //   const cursor = allToysCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // app.get("/singleToys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const query = { _id: new ObjectId(id) };
    //   const result = await allToysCollection.findOne(query);
    //   res.send(result);
    // });
    // app.post("/addToy", async (req, res) => {
    //   const user = req.body;
    //   console.log("new user", user);
    //   const result = await allToysCollection.insertOne(user);
    //   res.send(result);
    // });

    // app.delete("/myToys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log("please delete from database", id);
    //   const query = { _id: new ObjectId(id) };
    //   const result = await allToysCollection.deleteOne(query);
    //   res.send(result);
    // });

    // // for update
    // app.get("/updateToys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await allToysCollection.findOne(query);
    //   res.send(result);
    // });

    // app.put("/updateToys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const user = req.body;
    //   console.log(user);
    //   const filter = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedUser = {
    //     $set: {
    //       name: user.name,
    //       category: user.category,
    //       price: user.price,
    //       rating: user.rating,
    //       quantity: user.quantity,
    //       details: user.details,
    //       photo: user.photo,
    //     },
    //   };
    //   const result = await allToysCollection.updateOne(
    //     filter,
    //     updatedUser,
    //     options
    //   );
    //   res.send(result);
    // });

    // Send a ping to confirm a successful connection
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
