import express, {Request, Response} from 'express';
import cors from 'cors';
import productRoutes from './routes/product.route';
import saleRoutes from './routes/sales.route';
import orderRoutes from './routes/order.route';
import supplierRoutes from './routes/supplier.route';
import { sseHandler } from './utils/sse';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


app.get("/",(req: Request,res: Response)=>{
    res.send("Welcome to StockPulse");
});

app.get('/api/events', sseHandler);

app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);

app.listen(port, ()=>{console.log("StockPulse backend is listening to the port :", port)});