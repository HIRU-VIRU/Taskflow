const path = require('path');
require('dotenv').config();

const config = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'taskflow',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.join(__dirname, './backend/database/migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, './backend/database/seeds'),
      extension: 'ts',
    },
  },
};

module.exports = config;