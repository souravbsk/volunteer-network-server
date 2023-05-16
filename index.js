const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.pr3rbd0.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
},
});




//verify function for jwt 
const verifyJWT = (req,res,next) => {
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true,message: "unauthorized access"})
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (error,decoded) => {
        if(error){
        return res.status(401).send({error: true,message: "unauthorized access"})
        }
        else{
            req.decoded = decoded;
            next()
        }
    })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const eventsCollection = client.db("volunteerDB").collection("events");
    const eventBook = client.db("volunteerDB").collection("eventBook");

    // const indexKeys = { title: 1 };
    // const indexOptions = { name: "titleSearch" };
    // const result = await eventsCollection.createIndex(indexKeys,indexOptions);
  


    //jwt token collection
    app.post("/jwt",(req,res) => {
        const user = req.body;
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:"1h"
        })
        res.send({token})
    })



    app.get("/events", async (req, res) => {
      const result = await eventsCollection.find().toArray();
      res.send(result);
    });

    //get single event
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.findOne(query);
      res.send(result);
    });

    // search value
    app.get("/search/:text", async (req, res) => {
      const text = req.params.text;
      console.log(text);
      const query = { title: { $regex: text, $options: "i" } };
      const result = await eventsCollection.find(query).toArray();
      res.send(result)
    });

    // eventBooking
    app.post("/eventsBook", async (req, res) => {
      const newVolunteer = req.body;
      const result = await eventBook.insertOne(newVolunteer);
      res.send(result);
    });


    //user event list 
    app.get("/userEvents", verifyJWT, async (req,res) => {
        const decoded = req.decoded;
        if(decoded?.email !== req.query?.email){
            return res.status(401).send({error: 1,message: "forbidden access"})

        }
        let query ={};
        if(req.query?.email){

            query =  {email: req.query.email}
        }
        const result = await eventBook.find(query).toArray();
        res.send(result)
    })

    //user event event delete
    app.delete("/userEvents/:id", async (req,res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await eventBook.deleteOne(query);
        res.send(result)
    })

    //dashboard all book event list show

    app.post("/addEvent", async (req, res) => {
      const newEvent = req.body;
      const result = await eventsCollection.insertOne(newEvent);
      res.send(result);
    });

    app.get("/volunteerList", async (req, res) => {
      const result = await eventBook.find().toArray();
      res.send(result);
    });

    app.delete("/volunteerList/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventBook.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("volunteer-network-server");
});

app.listen(port, () => {
  console.log(`volunteer-network-server running on this port ${port}`);
});
