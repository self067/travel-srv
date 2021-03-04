import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import countries from './api/countries.route';
import users from './api/users.route';
// import sights from './api/sights.route'; //  ???

const swaggerDocument = YAML.load(path.join(__dirname, 'doc/travelsrv.yaml'));
const app = express();

app.use(cors());
process.env.NODE_ENV !== 'prod' && app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register api routes
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use('/countries', countries);
app.use('/users', users);

app.use('/', (req, res, next) => {
  if (req.originalUrl === '/') {
    res.send('Service is running!');
    return;
  }
  next();
});

app.use('*', (req, res) => res.status(404).json({ error: 'not found' }));

export default app;
