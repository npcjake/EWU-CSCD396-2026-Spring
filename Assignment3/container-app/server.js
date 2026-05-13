const express = require('express');
const { ServiceBusClient } = require('@azure/service-bus');
const { DefaultAzureCredential } = require('@azure/identity');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const serviceBusNamespace = process.env.SERVICEBUS_NAMESPACE;
const queueName = process.env.SERVICEBUS_QUEUE || 'messages';

// HTML page with message form
const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assignment 3 - Service Bus Messenger</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0078d4;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        textarea {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            resize: vertical;
            min-height: 100px;
        }
        textarea:focus {
            outline: none;
            border-color: #0078d4;
        }
        button {
            padding: 15px 30px;
            background: #0078d4;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #005a9e;
        }
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #e7f3ff;
            color: #0c5460;
            border: 1px solid #bee5eb;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Service Bus Messenger</h1>
        <p class="subtitle">EWU CSCD396 - Assignment 3</p>

        {{MESSAGE_PLACEHOLDER}}

        <div class="message info">
            <strong>How it works:</strong> Enter a message below and click Send.
            The message will be sent to Azure Service Bus, which triggers an Azure Function
            that saves the message to Azure Blob Storage.
        </div>

        <form action="/send" method="POST">
            <textarea name="message" placeholder="Enter your message here..." required></textarea>
            <button type="submit">Send Message to Service Bus</button>
        </form>
    </div>
</body>
</html>
`;

// Home page
app.get('/', (req, res) => {
    const page = htmlPage.replace('{{MESSAGE_PLACEHOLDER}}', '');
    res.send(page);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Send message endpoint
app.post('/send', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        const page = htmlPage.replace('{{MESSAGE_PLACEHOLDER}}',
            '<div class="message error">Please enter a message.</div>');
        return res.status(400).send(page);
    }

    if (!serviceBusNamespace) {
        const page = htmlPage.replace('{{MESSAGE_PLACEHOLDER}}',
            '<div class="message error">Service Bus not configured. SERVICEBUS_NAMESPACE environment variable is missing.</div>');
        return res.status(500).send(page);
    }

    try {
        // Use Managed Identity to connect to Service Bus
        const credential = new DefaultAzureCredential();
        const sbClient = new ServiceBusClient(serviceBusNamespace, credential);
        const sender = sbClient.createSender(queueName);

        const messagePayload = {
            content: message,
            sentAt: new Date().toISOString(),
            source: 'Assignment3-WebApp'
        };

        await sender.sendMessages({
            body: messagePayload,
            contentType: 'application/json'
        });

        await sender.close();
        await sbClient.close();

        console.log('Message sent successfully:', messagePayload);

        const page = htmlPage.replace('{{MESSAGE_PLACEHOLDER}}',
            '<div class="message success">Message sent successfully! Check your storage account for the saved message.</div>');
        res.send(page);

    } catch (error) {
        console.error('Error sending message:', error);
        const page = htmlPage.replace('{{MESSAGE_PLACEHOLDER}}',
            `<div class="message error">Error sending message: ${error.message}</div>`);
        res.status(500).send(page);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Service Bus Namespace: ${serviceBusNamespace || 'NOT CONFIGURED'}`);
    console.log(`Queue Name: ${queueName}`);
});
