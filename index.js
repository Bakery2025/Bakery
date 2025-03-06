const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

mongoose
    .connect(
        "mongodb+srv://Bakery:Bakery2025@bakery.qyh4b.mongodb.net/orders",
        {},
    )
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("MongoDB Connection Error:", err));

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
    orderStatus: { type: String, default: "Pending" }, 
    orderTimestamp: { type: String, default: () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    deliveryTimestamp: { type: Date, default: null }
});

const Order = mongoose.model("Order", orderSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "about.html"));
});

app.get("/menu", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "menu.html"));
});

app.get("/custom-order", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "custom-order.html"));
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

app.get("/checkout", async (req, res) => {
    res.sendFile(path.join(__dirname, "views", "checkout.html"));
});

app.post("/submit-checkout", async (req, res) => {
    console.log("Received Checkout Data:", req.body);

    const {
        name,
        phone,
        address,
        email,
        items,
        total,
        specialRequest,
        allergies,
    } = req.body;
    const orderId = crypto.randomBytes(5).toString("hex"); // Generates a random 10-character order ID
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
    });
    await newOrder.save();

    // Nodemailer configuration to send the email
    const transporter = nodemailer.createTransport({
        service: "gmail", // You can use other services too, e.g. 'smtp.office365.com' for Outlook
        auth: {
            user: "bakerymails2025@gmail.com", // Your email address
            pass: "ikpeufrqqbtldvuj ", // Use an App password if you have 2FA enabled on Gmail
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const mailOptionsForOwner = {
        from: '"Elicious Bake\'s" <bakerymails2025@gmail.com>', // Sender address
        to: "bakerymails2025@gmail.com", // Receiver address (can be the bakery owner or anyone else)
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
                                <td>${newOrder.email || "N/A"}</td>
                            </tr>
                            <tr>

                                <th>Address</th>
                                <td>${newOrder.address}</td>
                            </tr>
                            <tr>
                                <th>Items</th>
                                <td>${newOrder.items.map((item) => `<li>${item.name} (x${item.quantity || 1}) - ₹${item.price || "N/A"}</li>`).join("")}</td>
                            </tr>
<tr>
    <th>Total Price</th>
    <td>₹ ${newOrder.total?.toLocaleString("en-IN") || "N/A"}</td>
</tr>

                                <th>Special Request</th>
                                <td>${newOrder.specialRequest || "None"}</td>
                            </tr>
                            <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || "None"}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>Please start preparing for the order 😊.</p>
                    </div>
                </div>
            </body>
        </html>
    `,
    };

    // Send email notification
    transporter.sendMail(mailOptionsForOwner, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });

    if (email) {
        const mailOptionsForUser = {
            from: '"Elicious Bake\'s" <bakerymails2025@gmail.com>',
            to: email, // User’s email
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
                                    <td>${newOrder.email || "N/A"}</td>
                                </tr>
                                <tr>

                                    <th>Address</th>
                                    <td>${newOrder.address}</td>
                                </tr>

                                 <tr>
                                <th>Items</th>
                                <td>${newOrder.items.map((item) => `<li>${item.name} (x${item.quantity || 1}) - ₹${item.price || "N/A"}</li>`).join("")}</td>
                            </tr>

                              <tr>
                           <th>Total Price</th>
                            <td>₹ ${newOrder.total?.toLocaleString("en-IN") || "N/A"}</td>
                            </tr>


                                <tr>
                                    <th>Special Request</th>
                                    <td>${newOrder.specialRequest || "None"}</td>
                                </tr>
                                <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || "None"}</td>
                            </tr>
                            </table>
                        </div>
                        <div class="footer">
                            <p>We will notify you once the order is ready for pick up or delivery 😊.</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
        };

        // Send email confirmation to the user
        transporter.sendMail(mailOptionsForUser, (error, info) => {
            if (error) {
                console.log("Error sending email to user:", error);
            } else {
                console.log("Email sent to user: " + info.response);
            }
        });
    }

    // Redirect to order confirmation page
    res.json({ success: true, orderId: orderId });
});

app.post("/submit-order", async (req, res) => {
    const { name, phone, address, email, items, specialRequest, allergies } =
        req.body;
    const orderId = crypto.randomBytes(5).toString("hex"); // Generates a random 10-character order ID

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
    });
    await newOrder.save();

    // Nodemailer configuration to send the email
    const transporter = nodemailer.createTransport({
        service: "gmail", // You can use other services too, e.g. 'smtp.office365.com' for Outlook
        auth: {
            user: "bakerymails2025@gmail.com", // Your email address
            pass: "ikpeufrqqbtldvuj ", // Use an App password if you have 2FA enabled on Gmail
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const mailOptionsForOwner = {
        from: '"Elicious Bake\'s" <bakerymails2025@gmail.com>', // Sender address
        to: "bakerymails2025@gmail.com", // Receiver address (can be the bakery owner or anyone else)
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
                                <td>${newOrder.email || "N/A"}</td>
                            </tr>
                            <tr>

                                <th>Address</th>
                                <td>${newOrder.address}</td>
                            </tr>
                            <tr>
                                <th>Items</th>
                                <td>${newOrder.items.join(", ")}</td>
                            </tr>
                            <tr>
                                <th>Special Request</th>
                                <td>${newOrder.specialRequest || "None"}</td>
                            </tr>
                            <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || "None"}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>Please start preparing for the order 😊.</p>
                    </div>
                </div>
            </body>
        </html>
    `,
    };

    // Send email notification
    transporter.sendMail(mailOptionsForOwner, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });

    if (email) {
        const mailOptionsForUser = {
            from: '"Elicious Bake\'s" <bakerymails2025@gmail.com>',
            to: email, // User’s email
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
                                    <td>${newOrder.email || "N/A"}</td>
                                </tr>
                                <tr>

                                    <th>Address</th>
                                    <td>${newOrder.address}</td>
                                </tr>
                                <tr>
                                    <th>Items</th>
                                    <td>${newOrder.items.join(", ")}</td>
                                </tr>
                                <tr>
                                    <th>Special Request</th>
                                    <td>${newOrder.specialRequest || "None"}</td>
                                </tr>
                                <tr>
                                <th>Allergies/Ingredient free</th>
                                <td>${newOrder.allergies || "None"}</td>
                            </tr>
                            </table>
                        </div>
                        <div class="footer">
                            <p>We will notify you once the order is ready for pick up or delivery 😊.</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
        };

        // Send email confirmation to the user
        transporter.sendMail(mailOptionsForUser, (error, info) => {
            if (error) {
                console.log("Error sending email to user:", error);
            } else {
                console.log("Email sent to user: " + info.response);
            }
        });
    }

    res.redirect(`/order-confirmation?id=${orderId}`);
});

// Edit Order Route
app.post("/edit-order", async (req, res) => {
    const { orderId, name, phone, email, address, items, specialRequest } =
        req.body;

    const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        { name, phone, address, items, specialRequest },
        { new: true },
    );

    if (updatedOrder) {
        res.send("Order updated successfully!");
    } else {
        res.send("Order ID not found.");
    }
});

// Cancel Order Route
app.post("/cancel-order", async (req, res) => {
    const { orderId } = req.body;

    const deletedOrder = await Order.findOneAndDelete({ orderId });

    if (deletedOrder) {
        res.send("Order canceled successfully!");
    } else {
        res.send("Order ID not found.");
    }
});

app.get("/order-confirmation", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "order-confirmation.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
