require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI).then(() => console.log('✅ MongoDB Conectado'));

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

// --- RUTAS PÚBLICAS (TIENDA) ---
app.get('/api/productos', async (req, res) => {
    const prods = await Producto.find();
    res.json(prods);
});

app.post('/api/pedidos', async (req, res) => {
    try {
        const nuevo = new Pedido(req.body);
        // Descontar inventario
        for (let item of req.body.productos) {
            await Producto.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
        }
        const guardado = await nuevo.save();
        res.json({ success: true, orderId: guardado._id.toString().slice(-6).toUpperCase() });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- RUTAS ADMIN (INVENTARIO) ---
const checkAuth = (req, res, next) => {
    if (req.headers['x-admin-key'] !== 'Leo.99100') return res.status(401).send('No autorizado');
    next();
};

app.get('/api/admin/pedidos', checkAuth, async (req, res) => {
    const pedidos = await Pedido.find().sort({ fecha: -1 });
    res.json(pedidos);
});

app.post('/api/admin/productos', checkAuth, async (req, res) => {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.json({ success: true });
});

app.delete('/api/admin/productos/:id', checkAuth, async (req, res) => {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`📡 Puerto: ${PORT}`));