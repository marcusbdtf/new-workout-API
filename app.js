const admin = require('firebase-admin');
const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8080;
const http = require('http');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const cors = require('cors');
app.use(cors());

const serviceAccount = require('./serviceAccountKey.json');
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://workoutlog-947f7.firebaseio.com"
};

// Initialize Firebase app
admin.initializeApp(firebaseConfig);
// Initialize Firestore
const db = admin.firestore();

// Collection name
const workoutsCollection = db.collection('workouts');

const workout = {workouts: []}

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/index.html")
})

app.get("/log", async (req, res) => {
    const snapshot = await workoutsCollection.get();
    const workouts = snapshot.docs.map(doc => doc.data());
    res.send(workouts);
});

app.post('/add', async (req, res) => {
    try {
      const newWorkout = {
        id: uuidv4(),
        name: req.body.name,
        reps: req.body.reps,
        weight: req.body.weight,
        date: new Date().toLocaleDateString(),
      };
      const docRef = await workoutsCollection.doc(newWorkout.id).set(newWorkout);
      res.send(`Workout ${newWorkout.name} was added`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error adding new workout');
    }
  });

app.put("/edit/:id", async (req, res) => {
    try {
      const q = workoutsCollection.where("id", "==", req.params.id);
      const querySnapshot = await q.get();
      const updates = querySnapshot.docs.map(doc => {
        const updatedWorkout = {
          name: req.body.name || doc.data().name,
          reps: req.body.reps || doc.data().reps,
          weight: req.body.weight || doc.data().weight,
          date: doc.data().date
        };
        return workoutsCollection.doc(doc.id).set(updatedWorkout, { merge: true });
      });
      await Promise.all(updates);
      res.send(`Workout with id: ${req.params.id} was updated`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error updating workout');
    }
  });

app.delete("/delete/:id", async (req, res) => {
    try {
        const workoutId = req.params.id;
        const workoutRef = workoutsCollection.doc(workoutId);
        await workoutRef.delete();
        res.send(`Successfully deleted workout with id: ${workoutId}`);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error deleting workout');
    }
});

app.listen(PORT, ()=>{
    console.log("listening to port "+ PORT)
})
