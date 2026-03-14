const serverless = require('serverless-http');
const app = require('./index');
const sequelize = require('./config/database');

// Pre-warm the database connection outside the request handler
// so it can be reused across function invocations.
try {
    sequelize.authenticate().then(() => {
        console.log("Database connected for serverless instance");
        // We sync here in production just to be safe, but usually migrations are better
        sequelize.sync({ alter: true });
    }).catch(console.error);
} catch (error) {
    console.error("Error warming up connection: ", error);
}

module.exports.handler = serverless(app);
