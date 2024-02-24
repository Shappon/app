const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const hbs = require('hbs');
const axios = require('axios'); 
const app = express();
const port = 3000;

// Configuration de hbs comme moteur de template
app.set('view engine', 'hbs');

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());

// Configuration de la connexion MongoDB
const uri = 'mongodb+srv://sthuynhpro:dTugGSzXdyDReqvy@manyig.xkmqits.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de mon application !');
});

// Point de terminaison pour recevoir le webhook ManyChat
app.post('/webhook', async (req, res) => {
    try {
        const customFields = req.body;
        console.log('Data from ManyChat Webhook:', customFields);
        const userData = {
            _id: Math.random().toString(36).substring(2) + Date.now().toString(36),
            gender: customFields.gender,
            rdvHD: customFields.rdvHD,
            NombreCli: customFields.NombreCli,
            Service: customFields.Service
        };
        await insertDataIntoMongoDB(userData);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route pour afficher les réservations
app.get('/reservations', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('Rescli');
        const collection = database.collection('Reservations');
        const reservations = await collection.find({}).toArray();
        res.render('reservations', { reservations: reservations });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

 // Route pour confirmer une réservation
 app.post('/confirm-reservation', async (req, res) => {
    try {
        console.log('confirm-reservation');
        const reservationId = req.body.reservationId;
        await client.connect();
        const database = client.db('Rescli');
        const collection = database.collection('Reservations');
        await collection.updateOne(
            { _id: reservationId },
            { $set: { status: 'confirmed' } }
       );
       console.log('Reservation confirmed:', reservationId);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error confirming reservation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

// Route pour rejeter une réservation
app.post('/reject-reservation', async (req, res) => {
   try {
       console.log('reject-reservation');
        const reservationId = req.body.reservationId;
       await client.connect();
        const database = client.db('Rescli');
        const collection = database.collection('Reservations');
       await collection.updateOne(
            { _id: reservationId },
           { $set: { status: 'rejected' } }
       );
       console.log('Reservation rejected:', reservationId);
        res.sendStatus(200);
   } catch (error) {
        console.error('Error rejecting reservation:', error);
       res.status(500).json({ error: 'Internal Server Error' });
   } finally {
        await client.close();
    }
});





// Fonction pour insérer les données dans MongoDB
async function insertDataIntoMongoDB(userData) {
    try {
        await client.connect();
        const database = client.db('Rescli');
        const collection = database.collection('Reservations');
        await collection.insertOne(userData);
        console.log('Data inserted into MongoDB collection');
    } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
    } finally {
        await client.close();
    }
}

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}); 