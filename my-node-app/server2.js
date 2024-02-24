const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
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
async function sendManyChatRequest(action, reservationId) {
    try {
        // Exemple factice de l'appel API vers ManyChat avec une réponse simulée
        const simulatedResponse = {
            success: true,
            message: `Action "${action}" sent successfully for reservation ID: ${reservationId}`
        };
        console.log('Simulated ManyChat response:', simulatedResponse);
        return simulatedResponse;
    } catch (error) {
        console.error('Error sending ManyChat request:', error);
        throw error;
    }
}
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

// Routes pour confirmer et rejeter les réservations
// app.post('/confirm-reservation', async (req, res) => {
//     try {
//         const reservationId = req.body.reservationId;
//         await client.connect();
//         const database = client.db('Rescli');
//         const collection = database.collection('Reservations');
//         await collection.updateOne(
//             { _id: reservationId },
//             { $set: { status: 'confirmed' } }
//         );
//         console.log('Reservation confirmed:', reservationId);
//         res.sendStatus(200);
//     } catch (error) {
//         console.error('Error confirming reservation:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     } finally {
//         await client.close();
//     }
// });
app.post('/confirm-reservation', async (req, res) => {
    try {
        const reservationId = req.body.reservationId;
        await client.connect();
        const database = client.db('Rescli');
        const collection = database.collection('Reservations');
        await collection.updateOne(
            { _id: reservationId },
            { $set: { status: 'confirmed' } }
        );
        console.log('Reservation confirmed:', reservationId);
        
        // Envoyer une requête POST à l'URL ManyChat avec le statut confirmé
        const manyChatWebhookUrl = 'https://72a8-88-136-76-195.ngrok-free.app/confirm-reservation';
        const dataToSend = {
            reservationId: reservationId,
            status: 'confirmed'
        };
        await axios.post(manyChatWebhookUrl, dataToSend);
        console.log('web');
        res.sendStatus(200);
    } catch (error) {
        console.error('Error confirming reservation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});
app.post('/reject-reservation', async (req, res) => {
    try {
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
        console.error('Error confirming reservation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});


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
app.get('/test', async (req, res) => {
console.log(req.body)
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
