const { Client, Databases, ID } = require('node-appwrite');

// Configuración de Appwrite
const client = new Client()
  .setEndpoint('https://sfo.cloud.appwrite.io/v1')
  .setProject('69ed2bd70024539b431a')
  .setKey(process.env.APPWRITE_API_KEY); // Necesitas configurar esta variable de entorno

const databases = new Databases(client);

// Helper para delay entre operaciones
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupAdminCollections() {
  try {
    console.log('Setting up admin collections...');

    // Crear colección de configuraciones de precios
    await databases.createCollection(
      '69ed2dbb00235dbf613f',
      'pricing_configs',
      'pricing_configs'
    );

    console.log('Created pricing_configs collection');
    await delay(2000); // Esperar 2 segundos antes de agregar atributos

    // Crear atributos para pricing_configs
    await databases.createStringAttribute(
      '69ed2dbb00235dbf613f',
      'pricing_configs',
      'planId',
      50,
      true
    );

    await databases.createFloatAttribute(
      '69ed2dbb00235dbf613f',
      'pricing_configs',
      'price',
      true
    );

    await databases.createStringAttribute(
      '69ed2dbb00235dbf613f',
      'pricing_configs',
      'paypalPlanId',
      100,
      false
    );

    console.log('Created pricing_configs attributes');

    // Crear colección de configuración de PayPal
    await databases.createCollection(
      '69ed2dbb00235dbf613f',
      'paypal_config',
      'paypal_config'
    );

    console.log('Created paypal_config collection');
    await delay(2000); // Esperar 2 segundos antes de agregar atributos

    // Crear atributos para paypal_config
    await databases.createStringAttribute(
      '69ed2dbb00235dbf613f',
      'paypal_config',
      'clientId',
      100,
      true
    );

    await databases.createStringAttribute(
      '69ed2dbb00235dbf613f',
      'paypal_config',
      'clientSecret',
      100,
      true
    );

    await databases.createStringAttribute(
      '69ed2dbb00235dbf613f',
      'paypal_config',
      'environment',
      20,
      true
    );

    await databases.createStringAttribute(
      '69ed2dbb00235dbf613f',
      'paypal_config',
      'webhookId',
      100,
      false
    );

    console.log('Created paypal_config attributes');

    // Insertar configuraciones iniciales de precios
    const pricingConfigs = [
      { planId: 'free', price: 0 },
      { planId: 'basic', price: 9.99 },
      { planId: 'pro', price: 19.99 },
      { planId: 'business', price: 49.99 }
    ];

    for (const config of pricingConfigs) {
      await databases.createDocument(
        '69ed2dbb00235dbf613f',
        'pricing_configs',
        ID.unique(),
        config
      );
    }

    console.log('Inserted initial pricing configs');

    // Insertar configuración inicial de PayPal (con valores de ejemplo)
    await databases.createDocument(
      '69ed2dbb00235dbf613f',
      'paypal_config',
      ID.unique(),
      {
        clientId: 'your_paypal_client_id',
        clientSecret: 'your_paypal_client_secret',
        environment: 'sandbox',
        webhookId: null
      }
    );

    console.log('Inserted initial PayPal config');
    console.log('Admin collections setup completed successfully!');

  } catch (error) {
    console.error('Error setting up admin collections:', error);
  }
}

setupAdminCollections();
