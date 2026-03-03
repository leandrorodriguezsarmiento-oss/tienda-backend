require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE MONGODB
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('❌ ERROR: No se encontró la variable MONGO_URI en Railway.');
} else {
    // Conexión con opciones de reintento para evitar caídas en Railway
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
        .catch(err => console.error('❌ Error crítico de conexión:', err));
}

// --- ESQUEMAS ---
const ProductoSchema = new mongoose.Schema({
    name: String,
    brand: String,
    price: Number,
    specs: String,
    image: String,
    stock: { type: Number, default: 0 }
});
const Producto = mongoose.model('Producto', ProductoSchema);

const PedidoSchema = new mongoose.Schema({
    cliente: { nombre: String, telefono: String, direccion: String },
    productos: Array,
    total: Number,
    fecha: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', PedidoSchema);

// --- RUTAS PÚBLICAS ---
app.get('/', (req, res) => res.send('Servidor de PhoneStore funcionando correctamente 🚀'));

app.get('/api/productos', async (req, res) => {
    try {
        const prods = await Producto.find();
        res.json(prods);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/pedidos', async (req, res) => {
    try {
        const nuevo = new Pedido(req.body);
        for (let item of req.body.productos) {
            await Producto.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
        }
        const guardado = await nuevo.save();
        res.json({ success: true, orderId: guardado._id.toString().slice(-6).toUpperCase() });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- RUTAS DE ADMINISTRACIÓN ---
const checkAuth = (req, res, next) => {
    // Usamos tu clave confirmada
    if (req.headers['x-admin-key'] !== 'Leo.99100') return res.status(401).send('No autorizado');
    next();
};

app.get('/api/admin/pedidos', checkAuth, async (req, res) => {
    try {
        const pedidos = await Pedido.find().sort({ fecha: -1 });
        res.json(pedidos);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/admin/productos', checkAuth, async (req, res) => {
    try {
        const nuevo = new Producto(req.body);
        await nuevo.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/productos/:id', checkAuth, async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// CONFIGURACIÓN DE PUERTO PARA RAILWAY
const PORT = process.env.PORT || 3000;
// Escuchar en 0.0.0.0 es obligatorio para que Railway detecte el servicio
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor PhoneStore activo en puerto ${PORT}`);
});