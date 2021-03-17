import app from './server';
import { MongoClient } from 'mongodb';
import CountriesDAO from './dao/countriesDAO';
import UsersDAO from './dao/usersDAO';
import CommentsDAO from './dao/commentsDAO';

const port = process.env.PORT || 8000;
const poolSize = 100;

MongoClient.connect(process.env.TRAVEL_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async (client) => {
    await CountriesDAO.injectDB(client);
    await UsersDAO.injectDB(client);
    await CommentsDAO.injectDB(client);
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  });
