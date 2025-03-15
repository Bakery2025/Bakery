const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose')
const crypto = require('crypto');
const nodemailer = require('nodemailer')

const app = express();
const PORT = 3000;

mongoose.connect('mongodb+srv://Bakery:Bakery2025@bakery.qyh4b.mongodb.net/orders', {
}).then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("MongoDB Connection Error:", err));

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: String,
    name: String,
    phone: String,
    email: String,
    address: String,
    items: Array,
    total: String,
    specialRequest: String,
    allergies: String,
    orderType: String,
    paymentMethod: String,
    deliveryType: String,
    deliveryDateTime: { type: Date, default: () => new Date() },
    orderStatus: { type: String, default: "Pending" },
    orderTimestamp: { type: Date, default: () => new Date() },
    deliveryTimestamp: { type: Date, default: null }
});

const Order = mongoose.model('Order', orderSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});


app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});

app.get('/custom-order', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'custom-order.html'));
});

app.get("/track-order", async (req, res) => {
    res.sendFile(path.join(__dirname, "views", "track-order.html"));
});

app.get("/track-order-details", async (req, res) => {
    const { id } = req.query;

    const order = await Order.findOne({ orderId: id });

    if (order) {
        res.json(order);
    } else {
        res.json({ error: "Order ID not found." });
    }
});

app.get('/checkout', async (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
});

app.get("/edit-order", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "edit-order.html"));
});

app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'quiz.html'));
});


app.post('/submit-checkout', async (req, res) => {
    // console.log("Received Checkout Data:", req.body);
    const { name, phone, address, email, items, total, specialRequest, allergies, deliveryType, deliveryDateTime } = req.body;
    const orderId = crypto.randomBytes(5).toString('hex'); // Generates a random 10-character order ID
    const deliveryDateUTC = new Date(deliveryDateTime) || null;
    const newOrder = new Order({
        orderId,
        name,
        phone,
        email,
        address,
        items,
        total,
        specialRequest,
        allergies,
        orderType: "Regular",
        paymentMethod: "Cash",
        deliveryType,
        deliveryDateTime: deliveryDateUTC,
    });
    await newOrder.save();

    // Nodemailer configuration to send the email
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services too, e.g. 'smtp.office365.com' for Outlook
        auth: {
            user: 'eliciousbakes00@gmail.com',  // Your email address
            pass: 'xmrzllyzohkwkkfd',     // Use an App password if you have 2FA enabled on Gmail
        },
        tls: {
            rejectUnauthorized: false
        },
    });

    const mailOptionsForOwner = {
        from: '"Elicious Bakes" <eliciousbakes00@gmail.com>',  // Sender address
        to: 'eliciousbakes00@gmail.com',    // Receiver address (can be the bakery owner or anyone else)
        subject: `New Order - ${newOrder.orderId}`,
        html: `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }
                    .email-container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 600px;
                        margin: auto;
                    }
                    h1 {
                        color: #ff69b4;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.5;
                    }
                    .order-details {
                        margin-top: 20px;
                    }
                    .order-details table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .order-details th, .order-details td {
                        padding: 10px;
                        border: 1px solid #ddd;
                    }
                    .order-details th {
                        background-color: #f4f4f4;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 14px;
                        color: #777;
                    }
                </style>
            </head>
                <body style="margin: 0; padding: 0; display: flex; justify-content: center;">
    <div style="max-width: 60px; padding left: 50px;">
                    <h1>New Order - ${newOrder.orderId}</h1>
                    <p>Hello,</p>
                    <p>You have a new order from <strong>${newOrder.name}</strong>!</p>
                    <div class="order-details">
                        <table>
                            <tr>
                                <th>Order ID</th>
                                <td>${newOrder.orderId}</td>
                            </tr>
                            <tr>
                                <th>Name</th>
                                <td>${newOrder.name}</td>
                            </tr>
                            <tr>
                                <th>Phone</th>
                                <td>${newOrder.phone}</td>
                            </tr>
                            <tr>

                             <th>Email Address</th>
                                <td>${newOrder.email || 'N/A'}</td>
                            </tr>
                            <tr>

                                <th>Address</th>
                                <td>${newOrder.address}</td>
                            </tr>
<tr>

                                <th>Delivery Type</th>
                                <td>${newOrder.deliveryType}</td>
                            </tr>
                            <tr>

                                <th>Delivery/Pickup Date & Time</th>
                                <td>${newOrder.deliveryDateTime}</td>
                            </tr>
                            <tr>
                                <th>Items</th>
                                <td>${newOrder.items.map(item => `<li>${item.name} (x${item.quantity || 1}) - ₹${item.price || 'N/A'}</li>`).join('')}</td>
                            </tr>
<tr>
    <th>Total Price</th>
    <td>₹ ${newOrder.total?.toLocaleString('en-IN') || 'N/A'}</td>
</tr>

                                <th>Special Request</th>
                                <td>${newOrder.specialRequest || 'None'}</td>
                            </tr>
                            <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || 'None'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>Please start preparing for the order 😊</p>
                    </div>
                </div>
            </body>
        </html>
    `,
    }

    // Send email notification
    transporter.sendMail(mailOptionsForOwner, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    if (email) {
        const mailOptionsForUser = {
            from: '"Elicious Bakes" <eliciousbakes00@gmail.com',
            to: email,  // User’s email
            subject: `Order Confirmation - ${newOrder.orderId}`,
            html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            padding: 20px;
                        }
                        .email-container {
                            background-color: #ffffff;
                            border-radius: 8px;
                            padding: 20px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                            max-width: 600px;
                            margin-left: auto;
                            margin-right: auto;
                        margin: auto;
                        text-align:left;
                        }
                        h1 {
                            color: #ff69b4;
                        }
                        p {
                            font-size: 16px;
                            line-height: 1.5;
                        }
                        .order-details {
                            margin-top: 20px;
                        }
                        .order-details table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        .order-details th, .order-details td {
                            padding: 10px;
                            border: 1px solid #ddd;
                        }
                        .order-details th {
                            background-color: #f4f4f4;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 14px;
                            color: #777;
                        }

                        @media screen and (max-width: 600px) {
    .email-container {
        width: 90%; 
        padding: 15px; 
    }

    .order-details th, .order-details td {
        padding: 8px; 
        font-size: 14px; 
    }
        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; display: flex; justify-content: center;">
    <div style="max-width: 60px; padding left: 50px;">
                        <h1>Order Received! - ${newOrder.orderId}</h1>
                        <p>Hello ${newOrder.name},</p>
                        <p>Thank you for ordering</strong>!</p>
                        <div class="order-details">
                            <table>
                                <tr>
                                    <th>Order ID</th>
                                    <td>${newOrder.orderId}</td>
                                </tr>
                                <tr>
                                    <th>Name</th>
                                    <td>${newOrder.name}</td>
                                </tr>
                                <tr>
                                    <th>Phone</th>
                                    <td>${newOrder.phone}</td>
                                </tr>
                                <tr>
    
                                 <th>Email Address</th>
                                    <td>${newOrder.email || 'N/A'}</td>
                                </tr>
                                <tr>
    
                                    <th>Address</th>
                                    <td>${newOrder.address}</td>
                                </tr>
                                <tr>
                                <th>Delivery Type</th>
                                <td>${newOrder.deliveryType}</td>
                            </tr>
                            <tr>

                                <th>Delivery/Pickup Date & Time</th>
                                <td>${newOrder.deliveryDateTime}</td>
                            </tr>
                                 <tr>
                                <th>Items</th>
                                <td>${newOrder.items.map(item => `<li>${item.name} (x${item.quantity || 1}) - ₹${item.price || 'N/A'}</li>`).join('')}</td>
                            </tr>
                              <tr>
                           <th>Total Price</th>
                            <td>₹ ${newOrder.total?.toLocaleString('en-IN') || 'N/A'}</td>
                            </tr>
                                <tr>
                                    <th>Special Request</th>
                                    <td>${newOrder.specialRequest || 'None'}</td>
                                </tr>
                                <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || 'None'}</td>
                            </tr>
                            </table>
                        </div>
                        <div class="footer">
                            <p>We will notify you once the order is ready for pick up or delivery 😊</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
        }

        // Send email confirmation to the user
        transporter.sendMail(mailOptionsForUser, (error, info) => {
            if (error) {
                console.log("Error sending email to user:", error);
            } else {
                console.log('Email sent to user: ' + info.response);
            }
        });
    }

    // Redirect to order confirmation page
    res.json({ success: true, orderId: orderId });
});

app.post('/submit-order', async (req, res) => {
    const { name, phone, address, email, items, specialRequest, allergies, deliveryType, deliveryDateTime } = req.body;
    const orderId = crypto.randomBytes(5).toString('hex'); // Generates a random 10-character order ID
    console.log("Raw deliveryDateTime from frontend:", req.body.deliveryDateTime);
    const deliveryDateUTC = new Date(deliveryDateTime) || null;
    console.log("Updated deliveryDateTime":, deliveryDateUTC)
    const newOrder = new Order({
        orderId,
        name,
        phone,
        email,
        address,
        items,
        specialRequest,
        allergies,
        orderType: "Custom",
        paymentMethod: "Cash",
        deliveryType,
        deliveryDateTime: deliveryDateUTC
    });
    await newOrder.save();

    // Nodemailer configuration to send the email
    const transporter = nodemailer.createTransport({
        service: 'gmail',  // You can use other services too, e.g. 'smtp.office365.com' for Outlook
        auth: {
            user: 'eliciousbakes00@gmail.com',  // Your email address
            pass: 'xmrzllyzohkwkkfd',     // Use an App password if you have 2FA enabled on Gmail
        },
        tls: {
            rejectUnauthorized: false
        },
    });

    const mailOptionsForOwner = {
        from: '"Elicious Bakes" <eliciousbakes00@gmail.com>',  // Sender address
        to: 'eliciousbakes00@gmail.com',    // Receiver address (can be the bakery owner or anyone else)
        subject: `New Order - ${newOrder.orderId}`,
        html: `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }
                    .email-container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        max-width: 600px;
                        margin: auto;
                    }
                    h1 {
                        color: #ff69b4;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.5;
                    }
                    .order-details {
                        margin-top: 20px;
                    }
                    .order-details table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .order-details th, .order-details td {
                        padding: 10px;
                        border: 1px solid #ddd;
                    }
                    .order-details th {
                        background-color: #f4f4f4;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 14px;
                        color: #777;
                    }
                </style>
            </head>
                <body style="margin: 0; padding: 0; display: flex; justify-content: center;">
    <div style="max-width: 60px; padding left: 50px;">
                    <h1>New Order - ${newOrder.orderId}</h1>
                    <p>Hello,</p>
                    <p>You have a new order from <strong>${newOrder.name}</strong>!</p>
                    <div class="order-details">
                        <table>
                            <tr>
                                <th>Order ID</th>
                                <td>${newOrder.orderId}</td>
                            </tr>
                            <tr>
                                <th>Name</th>
                                <td>${newOrder.name}</td>
                            </tr>
                            <tr>
                                <th>Phone</th>
                                <td>${newOrder.phone}</td>
                            </tr>
                            <tr>

                             <th>Email Address</th>
                                <td>${newOrder.email || 'N/A'}</td>
                            </tr>
                            <tr>

                                <th>Address</th>
                                <td>${newOrder.address}</td>
                            </tr>
                            <tr>

                                <th>Delivery Type</th>
                                <td>${newOrder.deliveryType}</td>
                            </tr>
                            <tr>

                                <th>Delivery/Pickup Date & Time</th>
                                <td>${newOrder.deliveryDateTime}</td>
                            </tr>
                            <tr>
                                <th>Items</th>
                                <td>${newOrder.items.join(', ')}</td>
                            </tr>
                            <tr>
                                <th>Special Request</th>
                                <td>${newOrder.specialRequest || 'None'}</td>
                            </tr>
                            <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || 'None'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>Please start preparing for the order 😊</p>
                    </div>
                </div>
            </body>
        </html>
    `,
    }

    // Send email notification
    transporter.sendMail(mailOptionsForOwner, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    if (email) {
        const mailOptionsForUser = {
            from: '"Elicious Bakes" <eliciousbakes00@gmail.com>',
            to: email,  // User’s email
            subject: `Order Confirmation - ${newOrder.orderId}`,
            html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            padding: 20px;
                        }
                        .email-container {
                            background-color: #ffffff;
                            border-radius: 8px;
                            padding: 20px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                            max-width: 600px;
                        margin: auto;


                        }
                        h1 {
                            color: #ff69b4;
                        }
                        p {
                            font-size: 16px;
                            line-height: 1.5;
                        }
                        .order-details {
                            margin-top: 20px;
                        }
                        .order-details table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        .order-details th, .order-details td {
                            padding: 10px;
                            border: 1px solid #ddd;
                        }
                        .order-details th {
                            background-color: #f4f4f4;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 14px;
                            color: #777;
                        }
                    </style>
                </head>
               <body style="margin: 0; padding: 0; display: flex; justify-content: center;">
    <div style="max-width: 60px; padding left: 50px;">
                        <h1>Order Received! - ${newOrder.orderId}</h1>
                        <p>Hello ${newOrder.name},</p>
                        <p>Thank you for ordering</strong>!</p>
                        <div class="order-details">
                            <table>
                                <tr>
                                    <th>Order ID</th>
                                    <td>${newOrder.orderId}</td>
                                </tr>
                                <tr>
                                    <th>Name</th>
                                    <td>${newOrder.name}</td>
                                </tr>
                                <tr>
                                    <th>Phone</th>
                                    <td>${newOrder.phone}</td>
                                </tr>
                                <tr>
    
                                 <th>Email Address</th>
                                    <td>${newOrder.email || 'N/A'}</td>
                                </tr>
                                <tr>
    
                                    <th>Address</th>
                                    <td>${newOrder.address}</td>
                                </tr>
                                <tr>
                                <th>Delivery Type</th>
                                <td>${newOrder.deliveryType}</td>
                            </tr>
                            <tr>

                                <th>Delivery/Pickup Date & Time</th>
                                <td>${newOrder.deliveryDateTime}</td>
                            </tr>
                                <tr>
                                    <th>Items</th>
                                    <td>${newOrder.items.join(', ')}</td>
                                </tr>
                                <tr>
                                    <th>Special Request</th>
                                    <td>${newOrder.specialRequest || 'None'}</td>
                                </tr>
                                <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || 'None'}</td>
                            </tr>
                            </table>
                        </div>
                        <div class="footer">
                            <p>We will notify you once the order is ready for pick up or delivery 😊</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
        }

        // Send email confirmation to the user
        transporter.sendMail(mailOptionsForUser, (error, info) => {
            if (error) {
                console.log("Error sending email to user:", error);
            } else {
                console.log('Email sent to user: ' + info.response);
            }
        });
    }

    res.redirect(`/order-confirmation?id=${orderId}`);
});

app.get("/api/get-order", async (req, res) => {
    const orderId = req.query.id; // Get Order ID from query

    if (!orderId) {
        return res.status(400).json({ error: "Order ID is required." });
    }

    try {
        console.log("Fetching order:", orderId);
        const order = await Order.findOne({ orderId });

        if (!order) {
            console.log("Order not found:", orderId);
            return res.status(404).json({ error: "Order not found." });
        }

        console.log("Order found:", order);
        res.json(order); // ✅ Return JSON properly

    } catch (err) {
        console.error("Error fetching order:", err);
        res.status(500).json({ error: "Internal Server Error." });
    }
});

// Route to handle order updates
app.post("/edit-order", async (req, res) => {
    const { orderId, name, phone, email, address, specialRequest, allergies } = req.body;

    const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        { name, phone, email, address, specialRequest, allergies },
        { new: true }
    );

    if (updatedOrder) {
        res.sendFile(path.join(__dirname, "views", "update-successful.html"));
    } else {
        res.send("Order ID not found.");
    }
});

// Cancel Order Route
app.post("/cancel-order", async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
        return res.json({ success: false, header: "Error", message: "Order ID not found." });
    }

    const orderTimeLimit = 2 * 60 * 60 * 1000;
    const orderPlacedTime = new Date(order.orderTimestamp).getTime();
    const currentTime = Date.now();
    const orderAge = currentTime - orderPlacedTime;

    console.log("Current Time:", new Date(currentTime).toISOString());
    console.log("Order Time:", new Date(orderPlacedTime).toISOString());
    console.log("Order Age (ms):", orderAge);
    console.log("Time Limit (ms):", orderTimeLimit);

    if (orderAge > orderTimeLimit) {
        return res.json({ success: false, header: "Sorry! Order Cancellation Not Allowed", message: "Orders can only be cancelled within 2 hours of being ordered." });
    }

    await Order.findOneAndDelete({ orderId });

    return res.json({ success: true, header: "Success", message: "Your order has been cancelled successfully." });
});

app.get('/order-confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'order-confirmation.html'));
});

app.get('/dashboard/stats', async (req, res) => {
    try {
        const allOrders = await Order.find();

        // Filter valid orders (exclude Cancelled & Pending)
        const validOrders = allOrders.filter(order => !['Cancelled', 'Pending'].includes(order.orderStatus));

        // Track pending & completed orders separately
        const pendingOrders = allOrders.filter(order => order.orderStatus === 'Pending').length;
        const completedOrders = allOrders.filter(order => order.orderStatus === 'Completed').length;

        // Ensure totalRevenue and totalItems handle missing or bad data
        const totalItems = validOrders.reduce((acc, order) => acc + (order.items?.length || 0), 0);

        const totalRevenue = validOrders.reduce((acc, order) => {
            const orderTotal = typeof order.total === 'string' ? parseFloat(order.total.replace(/[^\d.]/g, '')) : parseFloat(order.total);
            return acc + (isNaN(orderTotal) ? 0 : orderTotal);
        }, 0);

        // Return the cleaned-up data
        res.json({ 
            totalItems, 
            totalRevenue: totalRevenue.toFixed(2), // Format to ₹0.00
            pendingOrders, 
            completedOrders 
        });

    } catch (err) {
        console.error('Error in /admin/stats:', err.stack);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});


app.get('/dashboard/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        console.error('Failed to fetch orders:', err);
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

app.post('/dashboard/update-status', async (req, res) => {
    const { orderId, status } = req.body;
    try {
        await Order.findOneAndUpdate({ orderId }, { orderStatus: status });
        res.json({ message: 'Order status updated' });
    } catch (err) {
        console.error('Failed to update order:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

app.post('/dashboard/update-delivery-type', async (req, res) => {
    const { orderId, deliveryType } = req.body;
    try {
        await Order.findOneAndUpdate({ orderId }, { deliveryType: deliveryType });
        res.json({ message: 'Delivery type updated' });
    } catch (err) {
        console.error('Failed to update delivery type:', err);
        res.status(500).json({ error: 'Failed to update delivery type' });
    }
});


app.post('/dashboard/update-total', async (req, res) => {
    const { orderId, total } = req.body;

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId },
            { $set: { total: parseFloat(total) } },
            { new: true }
        );

        if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

        res.json({ success: true, total: updatedOrder.total });
    } catch (err) {
        console.error("Failed to update total:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/dashboard/analytics', async (req, res) => {
    try {
        const allOrders = await Order.find();

        // ✅ Separate valid orders (exclude Cancelled & Pending)
        const validOrders = allOrders.filter(order => 
            !['Cancelled', 'Pending'].includes(order.orderStatus)
        );

        // ✅ Count revenue & total orders
        const totalRevenue = validOrders.reduce((acc, order) => acc + (parseFloat(order.total) || 0), 0);
        const totalOrders = allOrders.length;
        
        // ✅ Track Pending & Completed orders
        const orderStatusCount = {
            Pending: allOrders.filter(order => order.orderStatus === 'Pending').length,
            Completed: validOrders.filter(order => order.orderStatus === 'Completed').length
        };

        // ✅ Track top items (ignore items from "Custom" orderType)
        let itemCounts = {};
        validOrders.forEach(order => {
            if (order.orderType && order.orderType.toLowerCase() === "custom") return; // Ignore entire order's items

            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
                });
            }
        });

        // ✅ Get Top 5 Items (clean list, no custom order items)
        const topItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // ✅ Return final clean analytics
        res.json({
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders,
            orderStatusCount,
            topItems
        });

    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

