import { ObjectId } from "mongodb";
import { getDb } from "../utils/db.js";

const getOrdersCollection = () => getDb().collection("orders");

// 1. Place a new Order
export const placeOrder = async (req, res) => {
  try {
    const result = await getOrdersCollection().insertOne(req.body);
    if (result.acknowledged) {
      res.status(201).json({ message: "Order placed!", insertedId: result.insertedId });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Failed to place order." });
  }
};

// 2. Get All Orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const result = await getOrdersCollection().find().toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching orders" });
  }
};

// 3. Get Orders by User Email (NEW FEATURE)
export const getOrdersByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    
    // Check if the requesting user matches the email (Security)
    if (req.user.email !== email) {
      return res.status(403).send({ message: "Forbidden access" });
    }

    const query = { "shippingInfo.email": email };
    const result = await getOrdersCollection().find(query).toArray();
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).send({ message: "Error fetching user orders" });
  }
};

// 4. Update Order Status (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid Order ID" });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = { $set: { status: status } };

    const result = await getOrdersCollection().updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).send({ message: "Failed to update status" });
  }
};