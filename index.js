const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt =require('jsonwebtoken')
// const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
// const jwt = require('jsonwebtoken')

const port = process.env.PORT || 8000

// middleware
// const corsOptions = {
//   origin: ['http://localhost:5173', 'http://localhost:5174'],
//   credentials: true,
//   optionSuccessStatus: 200,
// }
app.use(cors())

app.use(express.json())
// app.use(cookieParser())

// Verify Token Middleware
// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token
//   console.log(token)
//   if (!token) {
//     return res.status(401).send({ message: 'unauthorized access' })
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       console.log(err)
//       return res.status(401).send({ message: 'unauthorized access' })
//     }
//     req.user = decoded
//     next()
//   })
// }
    // varify token
    const varifyToken=(req,res,next)=>{
      const token=req.headers?.authorization.split(' ')[1]
      if(!token){
        return res.status(401).send({message:'unahorized access'})
      }
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(403).send({message:'forbidden access'})
        }
        req.user=decoded
        next()
      })
      // console.log(req.headers.authorization.split(' ')[1])
    }

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rzyh2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    // mongodb data collections
    const roomsCollections = client.db('hotels_DB').collection('rooms')
    const usersCollections = client.db('hotels_DB').collection('users')


    // auth related api
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'2d'})
      res.send(token)
    })

    //   app.post('/jwt', async (req, res) => {
    //     const user = req.body
    //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //       expiresIn: '365d',
    //     })
    //     res
    //       .cookie('token', token, {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === 'production',
    //         sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    //       })
    //       .send({ success: true })
    //   })
    // // Logout
    // app.get('/logout', async (req, res) => {
    //   try {
    //     res
    //       .clearCookie('token', {
    //         maxAge: 0,
    //         secure: process.env.NODE_ENV === 'production',
    //         sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    //       })
    //       .send({ success: true })
    //     console.log('Logout successful')
    //   } catch (err) {
    //     res.status(500).send(err)
    //   }
    // })

    // mongodb crud operations

    // // get all data
    app.get('/rooms', async (req, res) => {
      const category = req.query.category
      console.log(category);
      let query = {}
      if (category && category !== 'null') {
        query = { category: category }
      }
      const result = await roomsCollections.find(query).toArray()
      res.send(result)
    })
    // get single data
    app.get('/room/:id',varifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await roomsCollections.findOne(query)
      res.send(result)
    })
    // get data my lishining
    app.get('/listing/:email', async (req, res) => {
      const email = req.params.email
      const query = { 'host.email': email }
      const result = await roomsCollections.find(query).toArray()
      res.send(result)
    })
    // get user data
    app.get('/user/:email',async(req,res)=>{
      const email=req.params.email 
      const query ={email: email}
      const result=await usersCollections.findOne(query)
      res.send(result)
    })
    // get all users information
    app.get('/users',async(req,res)=>{
      const result =await usersCollections.find().toArray()
      res.send(result)
    })

    // insert data in rooms components
    app.post('/rooms', async (req, res) => {
      const info = req.body
      const result = await roomsCollections.insertOne(info)
      res.send(result)
    })
    // insert  user information
    app.post('/user/:email', async (req, res) => {
      const email = req.params.email
      const isUser = await usersCollections.findOne({ email: email })
      if (isUser) {
        return res.send({ massage: 'user already haven' })
      }
      const info = req.body
      const result = await usersCollections.insertOne(info)
      res.send(result)
    })

    // update a elements
    app.put('/rooms/:id', async (req, res) => {
      const info = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...info
        }
      }
      const result = await roomsCollections.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    // update a role in user
    app.patch('/user/:email', async (req, res) => {
      const email = req.params.email
      const info = req.body
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: info.status
        },
      };
      const result = await usersCollections.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    // upadate a user role
    app.patch('/users/updateRole/:id',async (req,res)=>{
      const id=req.params.id 
      const info=req.body
      const filter={_id: new ObjectId(id)}
      const options={upsert:true}
      const updateDoc={
        $set:{
          role:info.value
        }
      }
      const result=await usersCollections.updateOne(filter,updateDoc,options)
      res.send(result)
    })
    // delete elements
    app.delete('/room/delete/:id', async (req, res) => {
      const id = req.params.id
      console.log('server is hitting');
      const query = { _id: new ObjectId(id) }
      const result = await roomsCollections.deleteOne(query)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from StayVista Server..')
})

app.listen(port, () => {
  console.log(`StayVista is running on port ${port}`)
})
