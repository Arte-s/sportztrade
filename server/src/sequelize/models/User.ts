import {Model, DataTypes} from 'sequelize';
import {sequelizeClient} from '../connect'

class User extends Model {
    public name: string;
    public login: string;
    public password: string;
    public date?: string | Date;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize: sequelizeClient,
    tableName: 'user',
    timestamps: false
});
export {User}
