const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
const port = 3000;

const config  = {
    user: 'harvey',
    password: 'Yaseadmin-1268',
    server: 'harvey-southeast.database.windows.net',
    database: 'assignment-database',
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function connectToDatabase() {
    try {
       const connection = await sql.connect(config);  // Fixed connection call
        console.log('✅ Database connection established');
    } catch (err) {
        console.error('❌ Database connection failed:', err);  // Fixed error handling
    }
}

async function initializeServer() {
    await connectToDatabase();

    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);  // Fixed port log
    });
}

initializeServer();


async function createTables() {
    try {
        const request = new sql.Request();

        const productsQuery = `
            CREATE TABLE Products (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                image VARCHAR(255),
                type VARCHAR(50)
            )
        `;
        await request.query(productsQuery);
        console.log('✔ Table created or already exists');
    } catch (err) {
        console.error('❌ Error creating table:', err.message);
    }
}



// Populate Products table with data from external API
async function populateProductsTable() {
    try {
        // FETCH PRODUCTS FROM API HERE
        const response = await fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json');
        const products = await response.json();


        const checkRequest = new sql.Request();
        const checkQuery = 'SELECT COUNT(*) AS count FROM Products';
        const result = await checkRequest.query(checkQuery);
        
        if (result.recordset[0].count === 0) {
            for (const product of products) {
                const insertRequest = new sql.Request();
                const insertQuery = `
                    INSERT INTO Products (name, price, image, type)
                    VALUES (@name, @price, @image, @type)
                `;
                
                insertRequest.input('name', sql.NVarChar, product.name);
                insertRequest.input('price', sql.Decimal(10,2), product.price);
                insertRequest.input('image', sql.NVarChar, product.image);
                insertRequest.input('type', sql.NVarChar, product.type);
                
                await insertRequest.query(insertQuery);
            }
            console.log('✅ Products table populated with', products.length, 'products');
        }
    } catch (err) {
        console.error('❌ Error populating Products table:', err);
    }
}

async function main() {
    const pool = await connectToDatabase();
    await createTables(pool); // Create table if not exists
    await populateProductsTable(pool); // Populate table with data
}

initializeServer();
main();