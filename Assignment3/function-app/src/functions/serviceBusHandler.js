const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

app.serviceBusQueue('serviceBusHandler', {
    connection: 'ServiceBusConnection',
    queueName: 'messages',
    handler: async (message, context) => {
        context.log('Service Bus queue trigger received message:', message);

        const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
        const containerName = process.env.STORAGE_CONTAINER_NAME || 'messages';

        if (!storageAccountName) {
            context.log.error('STORAGE_ACCOUNT_NAME environment variable not set');
            throw new Error('STORAGE_ACCOUNT_NAME not configured');
        }

        try {
            // Use Managed Identity to connect to blob storage
            const credential = new DefaultAzureCredential();
            const blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                credential
            );

            const containerClient = blobServiceClient.getContainerClient(containerName);

            // Create a unique blob name with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const blobName = `message-${timestamp}.json`;

            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Prepare message content
            const messageContent = {
                receivedAt: new Date().toISOString(),
                message: typeof message === 'string' ? message : JSON.stringify(message),
                originalMessage: message
            };

            // Upload message to blob storage
            const content = JSON.stringify(messageContent, null, 2);
            await blockBlobClient.upload(content, content.length, {
                blobHTTPHeaders: { blobContentType: 'application/json' }
            });

            context.log(`Message saved to blob: ${blobName}`);
        } catch (error) {
            context.log.error('Error writing message to storage:', error);
            throw error;
        }
    }
});
