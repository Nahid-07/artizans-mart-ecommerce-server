import express, { response } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
const app = express();
const port = process.env.PORT || 5000;
import { configDotenv } from "dotenv";
configDotenv();
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.ugpmzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("artizans server is running");
});

async function run() {
  try {
    const productData = client.db("artizans-mart").collection("product-data");
    const productReviews = client.db("artizans-mart").collection("reviews");
    const placeOrder = client.db("artizans-mart").collection("orders");

    app.post("/addProduct", async (req, res) => {
      const body = await req.body;
      const result = await productData.insertOne(body);
      res.send(result);
    });
    app.put("/update-product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = await req.body;
      const update = {
        $set: {
          name: body.name,
          brand: body.brand,
          price: body.price,
          rating: body.rating,
          reviews_count: 0,
          category: body.category,
          is_featured: body.is_featured,
          stock_status: body.stock_status,
          short_description: body.short_description,
          long_description: body.long_description,
          images: body.images,
          features: body.features,
        },
      };
      const options = { upsert: true };
      const result = await productData.updateOne(query, update, options);
      res.send(result);
    });
    // get all products api
    app.get("/products", async (req, res) => {
      const data = await productData.find().toArray();
      res.send(data);
    });
    app.get('/featuredProducts', async(req,res)=>{
      const products = await productData.find().toArray()
      const featuredProducts = products.filter(product => product.is_featured === true)
      res.send(featuredProducts)
    })
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await productData.findOne(query);
      const reviewOfProductCount = await productReviews.find().toArray();
      const filterRiview = reviewOfProductCount.filter(
        (i) => i.productId === id
      );
      res.send({ data, filterRiview });
    });
    // product delete api
    app.delete("/delete-a-product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productData.deleteOne(query);
      res.send(result);
    });
    // product reviews post api
    app.post("/reviews", async (req, res) => {
      const body = req.body;
      const reviews = await productReviews.insertOne(body);
      res.send(reviews);
    });

    app.get("/reviews", async (req, res) => {
      const data = await productReviews.find().toArray();
      res.send(data);
    });

    // order details post operation
    app.post("/place-order", async (req, res) => {
      const body = req.body;
      const orders = await placeOrder.insertOne(body);
      res.send(orders);
    });

    app.get("/orders", async (req, res) => {
      const orders = await placeOrder.find().toArray();
      res.send(orders);
    });
  } finally {
  }
}
run().catch((err) => {
  console.log(err);
});
app.listen(port);
