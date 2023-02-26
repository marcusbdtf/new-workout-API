const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, where, query, deleteDoc } = require('firebase/firestore');
const { updateDoc } = require('firebase/firestore');
const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 80;
const http = require('http');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const cors = require('cors');
app.use(cors());


const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
  };

// Initialize Firebase app
const defaultApp = initializeApp(firebaseConfig);
// Initialize Firestore
const db = getFirestore(defaultApp);

// Collection name
const workoutsCollection = collection(db, 'workouts');

const workout = {workouts: []}

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/index.html")
})

app.get("/log", async (req, res) => {
    const snapshot = await getDocs(workoutsCollection);
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
      const docRef = await setDoc(doc(workoutsCollection, newWorkout.id), newWorkout);
      res.send(`Workout ${newWorkout.name} was added`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error adding new workout');
    }
  });

  app.put("/edit/:id", async (req, res) => {
    try {
      const q = query(collection(db, 'workouts'), where("id", "==", req.params.id));
      // query to find specific document containing id
      const querySnapshot = await getDocs(q); // executes the query to get a 
      const updates = querySnapshot.docs.map(doc => {
        const updatedWorkout = {
          name: req.body.name || doc.data().name,
          reps: req.body.reps || doc.data().reps,
          weight: req.body.weight || doc.data().weight,
          date: doc.data().date
        };
        return updateDoc(doc.ref, updatedWorkout);
      });
      await Promise.all(updates); // waits for updates to complete before sending response
      res.send(`Workout with id: ${req.params.id} was updated`);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error updating workout');
    }
  });

app.delete("/delete/:id", async (req, res) => {
    try {
        const workoutId = req.params.id;
        const workoutRef = doc(workoutsCollection, workoutId);
        await deleteDoc(workoutRef);
        res.send(`Successfully deleted workout with id: ${workoutId}`);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error deleting workout');
    }
});

app.listen(PORT, ()=>{
    console.log("listening to port "+ PORT)
})

