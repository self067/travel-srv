import { ObjectId } from 'bson';

let countries;
let travel;
const DEFAULT_SORT = [['tomatoes.viewer.numReviews', -1]];

export default class CountriesDAO {
  static async injectDB(conn) {
    if (countries) {
      return;
    }
    try {
      travel = await conn.db(process.env.TRAVEL_NS);
      countries = await conn.db(process.env.TRAVEL_NS).collection('countries');
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in countriesDAO: ${e}`
      );
    }
  }


  static async getCountries({
    filters = null,
    page = 0,
    countriesPerPage = 20,
  } = {}) {
    let queryParams = {};
    if (filters) {
      if ('text' in filters) {
        queryParams = this.textSearchQuery(filters['text']);
      }
    }

    let { query = {}, project = {}, sort = DEFAULT_SORT } = queryParams;
    let cursor;
    try {
      cursor = await countries.find(query).project(project).sort(sort);
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { countriesList: [], totalNumCountries: 0 };
    }

    const displayCursor = cursor
      .skip(page * countriesPerPage)
      .limit(countriesPerPage);

    try {
      const countriesList = await displayCursor.toArray();
      const totalNumCountries =
        page === 0 ? await countries.countDocuments(query) : 0;

      return { countriesList, totalNumCountries };
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`
      );
      return { countriesList: [], totalNumCountries: 0 };
    }
  }

  static async getCountryByID(id) {
    try {
      const pipeline = [
        {
          $match: {
            _id: ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'sights',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$countryId', '$$id'],
                  },
                },
              },
              {
                $sort: {
                  date: -1,
                },
              },
            ],
            as: 'sights',
          },
        },
      ];
      return await countries.aggregate(pipeline).next();
    } catch (e) {
      // here's how the InvalidId error is identified and handled
      if (
        e
          .toString()
          .startsWith(
            'Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
          )
      ) {
        return null;
      }
      console.error(`Something went wrong in getCountryByID: ${e}`);
      throw e;
    }
  }
}
