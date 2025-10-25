import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: 'ev_mysql',
    port: 3306,
    dialect: 'mysql',
    logging: false,
  }
);

export default sequelize;
