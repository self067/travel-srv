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

  /**
   * Returns a list of objects, each object contains a title and an _id.
   * @param {string[]} params
   * @returns {Promise<CountryResult>} A promise that will resolve to a list of CountryResults.
   */
  static async getCountriesByParam(params) {
    let cursor;
    try {
      cursor = await countries
        .find({ params: { $in: params } })
        .project({ title: 1 }); //.limit(1)
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return [];
    }

    return cursor.toArray();
  }

  /**
   * Finds and returns countries matching a given text in their title or description.
   * @param {string} text - The text to match with.
   * @returns {QueryParams} The QueryParams for text search
   */
  static textSearchQuery(text) {
    const query = { $text: { $search: text } };
    const meta_score = { $meta: 'textScore' };
    const sort = [['score', meta_score]];
    const project = { score: meta_score };

    return { query, project, sort };
  }

  /**
   * Finds and returns countries including one or more cast members.
   * @param {string[]} cast - The cast members to match with.
   * @returns {QueryParams} The QueryParams for cast search
   */
  static castSearchQuery(cast) {
    const searchCast = Array.isArray(cast) ? cast : cast.split(', ');

    const query = { cast: { $in: searchCast } };
    const project = {};
    const sort = DEFAULT_SORT;

    return { query, project, sort };
  }

  /**
   * Finds and returns countries matching a one or more genres.
   * @param {string[]} genre - The genres to match with.
   * @returns {QueryParams} The QueryParams for genre search
   */
  static genreSearchQuery(genre) {
    /**
    Ticket: Text and Subfield Search

    Given an array of one or more genres, construct a query that searches
    MongoDB for countries with that genre.
    */

    const searchGenre = Array.isArray(genre) ? genre : genre.split(', ');
    const query = { genres: { $in: searchGenre } };
    const project = {};
    const sort = DEFAULT_SORT;

    return { query, project, sort };
  }

  /**
   *
   * @param {Object} filters - The search parameter to use in the query. Comes
   * in the form of `{cast: { $in: [...castMembers]}}`
   * @param {number} page - The page of countries to retrieve.
   * @param {number} countriesPerPage - The number of countries to display per page.
   * @returns {FacetedSearchReturn} FacetedSearchReturn
   */
  static async facetedSearch({
    filters = null,
    page = 0,
    countriesPerPage = 20,
  } = {}) {
    if (!filters || !filters.cast) {
      throw new Error('Must specify cast members to filter by.');
    }
    const matchStage = { $match: filters };
    const sortStage = { $sort: { 'tomatoes.viewer.numReviews': -1 } };
    const countingPipeline = [matchStage, sortStage, { $count: 'count' }];
    const skipStage = { $skip: countriesPerPage * page };
    const limitStage = { $limit: countriesPerPage };
    const facetStage = {
      $facet: {
        runtime: [
          {
            $bucket: {
              groupBy: '$runtime',
              boundaries: [0, 60, 90, 120, 180],
              default: 'other',
              output: {
                count: { $sum: 1 },
              },
            },
          },
        ],
        rating: [
          {
            $bucket: {
              groupBy: '$metacritic',
              boundaries: [0, 50, 70, 90, 100],
              default: 'other',
              output: {
                count: { $sum: 1 },
              },
            },
          },
        ],
        countries: [
          {
            $addFields: {
              title: '$title',
            },
          },
        ],
      },
    };

    const queryPipeline = [
      matchStage,
      sortStage,
      skipStage,
      limitStage,
      facetStage,
    ];

    try {
      const results = await (await countries.aggregate(queryPipeline)).next();
      const count = await (await countries.aggregate(countingPipeline)).next();
      return {
        ...results,
        ...count,
      };
    } catch (e) {
      return { error: 'Results too large, be more restrictive in filter' };
    }
  }

  /**
   * Finds and returns countries by param.
   * Returns a list of objects, each object contains a title and an _id.
   * @param {Object} filters - The search parameters to use in the query.
   * @param {number} page - The page of countries to retrieve.
   * @param {number} countriesPerPage - The number of countries to display per page.
   * @returns {GetCountriesResult} An object with country results and total results
   * that would match this query
   */
  static async getCountries({
    filters = null,
    page = 0,
    countriesPerPage = 20,
  } = {}) {
    let queryParams = {};
    if (filters) {
      if ('text' in filters) {
        queryParams = this.textSearchQuery(filters['text']);
      } else if ('cast' in filters) {
        queryParams = this.castSearchQuery(filters['cast']);
      } else if ('genre' in filters) {
        queryParams = this.genreSearchQuery(filters['genre']);
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

  /**
   * Gets a coutry by its id
   * @param {string} id - The desired country id, the _id in Mongo
   * @returns {TravelCountry | null} Returns either a single country or nothing
   */

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
