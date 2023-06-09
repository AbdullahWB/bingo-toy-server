const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luk9jtm.mongodb.net/?retryWrites=true&w=majority`;

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
    //  client.connect();




    const productCollection = client.db('bingoToy').collection('productCollection');

    app.get('/products', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = page * limit
      const result = await productCollection.find().skip(skip).limit(limit).toArray();
      res.send(result);
    })

    app.get('/products/details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.findOne(query);
      res.send(result);
    })

    app.get('/totalProducts', async (req, res) => {
      const result = await productCollection.estimatedDocumentCount();
      res.send({ totalProducts: result });
    })


    app.get("/itemSearch/:name", async (req, res) => {
      const searchItems = req.params.name;
      const indexKeys = { name: 1, category: 1 };
      const indexOptions = { name: "nameCategory" }

      const result2 = await productCollection.createIndex(indexKeys, indexOptions);
      const result = await productCollection.find({
        $or: [
          { name: { $regex: searchItems, $options: "i" } },
          { category: { $regex: searchItems, $options: "i" } }
        ]
      }).toArray();

      res.send(result);
    });


    app.get('/products/:subcategory', async (req, res) => {
      if (req.params.subcategory == "Science" || req.params.subcategory == "Language" || req.params.subcategory == "Engineering" || req.params.subcategory == "Math") {
        const result = await productCollection.find({ sub_category: req.params.subcategory }).toArray();
        return res.send(result)
      }
      const result = await productCollection.find({}).toArray();
      res.send(result);
    })

    app.post("/addToy", async (req, res) => {
      const body = req.body;
      if (!body) {
        return
      }
      const result = await productCollection.insertOne(body);
      res.send(result);
    })

    app.get('/myToy/:email', async (req, res) => {
      console.log(req.params.email);
      const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
      const result = await productCollection
        .find({ seller_email: req.params.email })
        .sort({ price: sortOrder })
        .toArray();
      res.send(result);
    });


    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          name: body.name,
          price: body.price,
          rating: body.rating,
          category: body.category,
          sub_category: body.sub_category,
          available_quantity: body.available_quantity,
          seller_name: body.seller_name,
          seller_email: body.seller_email,
          product_details: body.product_details,
          picture: body.picture
        }
      };
      const result = await productCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.deleteOne(query)
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Bingo is running Kids are happy');
})

app.listen(port, () => {
  console.log(`bingo toy  server is running on port ${port}`);
})