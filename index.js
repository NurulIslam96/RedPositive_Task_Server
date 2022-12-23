const express =require("express");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yfy0tas.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const usersCollection = client.db("dbRedPositive").collection("users");

async function dbConnect() {
    try {
        await client.connect();
        console.log("Database is Connected")
    } catch (error) {
        console.log(error)
    }
}
dbConnect()

app.post("/addEntry", async(req,res)=>{
    try {
        const existingEmail = await usersCollection.findOne({email: req.body.email})
        if(existingEmail){
            return res.send({status: "User Exist already"})
        }
        const result = await usersCollection.insertOne(req.body)
        res.send({result, status: "Added User Successfully"})
    } catch (error) {
        console.log(error.message)
    }
})

app.get("/entries", async(req,res)=>{
    try {
        const result = await usersCollection.find({}).toArray()
        res.send(result)
    } catch (error) {
        console.log(error.message)
    }
})

app.delete("/delete/:id", async(req,res)=>{
    try {
        const result = await usersCollection.deleteOne({_id: ObjectId(req.params.id)})
        res.send(result)
    } catch (error) {
        console.log(error.message)
    }
})

app.post("/sendMail", async(req,res)=>{
    try {
        let idCollection = []
        const ids = req.body;
        for(id of ids){
            const user = await usersCollection.findOne({_id: ObjectId(id)})
            idCollection = [...idCollection,user]
        }
        if(idCollection){
            const msg ={
                from: "testing@hok.co",
                to: `${process.env.TO_MAIL}`,
                subject: "Testing",
                html: `${idCollection.map((id,i) => `
                <p>Here are the info of the users</p>
                <p>SerialNo: ${i+1}</p>
                <p>Name: ${id.name}</p>
                <p>Email: ${id.email}</p>
                <p>Hobbies: ${id.hobbies}</p>
                `)}`
            };
            nodemailer.createTransport({
                service: 'gmail',
                auth:{
                    user:`${process.env.APP_MAIL}`,
                    pass:`${process.env.APP_PASSWORD}`
                },
                port: 465,
                host: "smtp.gmail.com"
            })
            .sendMail(msg, (err)=>{
                if(err){
                    return console.log(err)
                }else{
                    return res.send({status: "Email Sent Successfully"})
                }
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

app.get("/", (req,res)=>{
    res.send("API is Running")
})

app.listen(port, ()=>console.log("Server is running through, ",port))