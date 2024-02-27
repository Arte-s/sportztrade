import {Sequelize} from 'sequelize';

const sequelizeClient = new Sequelize(process.env.DBNAME, process.env.DBUSER, process.env.DBPASSWORD, {
    host: process.env.DBHOST,
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
        "timezone": `Etc/GMT${process.env.GMT}`
    }
})

let isConnectedDB = false

sequelizeClient.authenticate()
    .then(() => {
        console.log('Sequelize: Connection has been established successfully.');
        isConnectedDB = true
    })
    .catch(err => {
        console.error('Sequelize: Unable to connect to the database:', err);
    });


export {sequelizeClient, isConnectedDB}
