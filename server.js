require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A MONGODB ---
// Recuerda configurar MONGO_URI en las variables de entorno de Railway
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
    .catch(err => {
        console.error('❌ Error crítico de conexión:', err.message);
        process.exit(1); 
    });

// --- MODELO DE DATOS (ESQUEMA) ---
const PedidoSchema = new mongoose.Schema({
    cliente: {
        nombre: String,
        telefono: String,
        direccion: String
    },
    productos: Array,
    subtotal: Number,
    envio: Number,
    total: Number,
    metodoPago: String,
    fecha: { type: Date, default: Date.now },
    estado: { type: String, default: 'Pendiente' }
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

// --- RUTAS DEL SERVIDOR ---

// 1. Ruta de bienvenida (Para probar que el servidor funciona)
app.get('/', (req, res) => {
    res.send('🚀 Servidor de PhoneStore (Cuba) funcionando correctamente.');
});

// 2. Ruta para recibir pedidos desde el index.html
app.post('/api/pedidos', async (req, res) => {
    try {
        const nuevoPedido = new Pedido(req.body);
        const pedidoGuardado = await nuevoPedido.save();
        
        // Generamos un ID corto (últimos 6 caracteres del ID de Mongo)
        const orderIdCorto = pedidoGuardado._id.toString().slice(-6).toUpperCase();
        
        console.log(`🛒 Nuevo Pedido Recibido: #${orderIdCorto}`);
        
        res.status(201).json({ 
            success: true, 
            orderId: orderIdCorto 
        });
    } catch (error) {
        console.error("❌ Error al guardar pedido:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

// 3. Ruta de Administración (Para ver todos los pedidos guardados)
// IMPORTANTE: Cambia 'tu_clave_secreta_123' por una contraseña tuya
app.get('/api/admin/pedidos', async (req, res) => {
    const clave = req.headers['x-admin-key'];
    
    if (clave !== 'tu_clave_secreta_123') {
        return res.status(401).json({ message: "Acceso no autorizado" });
    }

    try {
        const pedidos = await Pedido.find().sort({ fecha: -1 });
        res.json(pedidos);
    } catch (error) {
        console.error("❌ Error al obtener pedidos:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- ARRANCAR EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`📡 SERVIDOR ACTIVO`);
    console.log(`🔌 Puerto: ${PORT}`);
    console.log(`🏠 Local: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});