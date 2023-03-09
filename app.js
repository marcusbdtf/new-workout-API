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

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/index.html")
})

// Get all workouts for all users
app.get('/workouts/backup', async (req, res) => {
  try {
    const allWorkoutsRef = await workoutsCollection.get();
    const allWorkouts = allWorkoutsRef.docs.map(doc => doc.data());
    res.send(allWorkouts);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error getting all workouts');
  }
});

// Get all workouts for a specific user
app.get('/workouts/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userWorkoutsRef = await workoutsCollection.where('userId', '==', userId).get();
    const workouts = userWorkoutsRef.docs.map(doc => doc.data());
    res.send(workouts);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error getting workouts');
  }
});

app.post('/workouts', async (req, res) => {
  try {
    const newWorkout = {
      id: uuidv4(),
      userId: req.body.userId,
      name: req.body.name,
      reps: req.body.reps,
      weight: req.body.weight,
      date: new Date().toLocaleDateString(),
    };

    await workoutsCollection.doc(newWorkout.id)
      .set({
        id: newWorkout.id,
        userId: newWorkout.userId,
        name: newWorkout.name,
        reps: newWorkout.reps,
        weight: newWorkout.weight,
        date: newWorkout.date
      });

    res.send(`Workout ${newWorkout.name} was added`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error adding new workout');
  }
});

app.put('/workouts/:userId/:id', async (req, res) => {
  try {
    const workoutId = req.params.id;
    const updatedWorkout = {
      id: workoutId,
      userId: req.params.userId,
      name: req.body.name,
      reps: req.body.reps,
      weight: req.body.weight,
      date: new Date().toLocaleDateString(),
    };
    const workoutRef = workoutsCollection.doc(workoutId);
    await workoutRef.set(updatedWorkout);
    res.send(`Workout with id: ${workoutId} was updated`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error updating workout');
  }
});

app.delete('/workouts/:userId/:id', async (req, res) => {
  try {
    const workoutId = req.params.id;
    const workoutRef = workoutsCollection.doc(workoutId);
    await workoutRef.delete();
    res.send(`Workout with id: ${workoutId} was deleted`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error deleting workout');
  }
});

app.listen(PORT, ()=>{
    console.log("listening to port "+ PORT)
})
