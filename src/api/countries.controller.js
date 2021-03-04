import CountriesDAO from '../dao/countriesDAO';

export default class CountriesController {
  static async apiGetCountries(req, res, next) {
    const COUNTRIES_PER_PAGE = 20;
    const {
      countriesList,
      totalNumCountries,
    } = await CountriesDAO.getCountries();
    let response = {
      countries: countriesList,
      page: 0,
      filters: {},
      entries_per_page: COUNTRIES_PER_PAGE,
      total_results: totalNumCountries,
    };
    res.json(response);
  }

  static async apiGetCountriesByParams(req, res, next) {
    // params was countries
    let params = req.query.params == '' ? 'USA' : req.query.params;
    let paramList = Array.isArray(params) ? params : Array(params);
    let countriesList = await CountriesDAO.getCountriesByParam(paramList);
    let response = {
      titles: countriesList,
    };
    res.json(response);
  }

  static async apiGetCountryById(req, res, next) {
    try {
      let id = req.params.id || {};
      let country = await CountriesDAO.getCountryByID(id);
      if (!country) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      let updated_type = country.lastupdated instanceof Date ? 'Date' : 'other';
      res.json({ country, updated_type });
    } catch (e) {
      console.log(`api, ${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiSearchCountries(req, res, next) {
    const COUNTRIES_PER_PAGE = 20;
    let page;
    try {
      page = req.query.page ? parseInt(req.query.page, 10) : 0;
    } catch (e) {
      console.error(`Got bad value for page:, ${e}`);
      page = 0;
    }
    let searchType;
    try {
      searchType = Object.keys(req.query)[0];
    } catch (e) {
      console.error(`No search keys specified: ${e}`);
    }

    let filters = {};

    switch (searchType) {
      case 'genre':
        if (req.query.genre !== '') {
          filters.genre = req.query.genre;
        }
        break;
      case 'cast':
        if (req.query.cast !== '') {
          filters.cast = req.query.cast;
        }
        break;
      case 'text':
        if (req.query.text !== '') {
          filters.text = req.query.text;
        }
        break;
      default:
      // nothing to do
    }

    const {
      countriesList,
      totalNumCountries,
    } = await CountriesDAO.getCountries({
      filters,
      page,
      COUNTRIES_PER_PAGE,
    });

    let response = {
      countries: countriesList,
      page: page,
      filters,
      entries_per_page: COUNTRIES_PER_PAGE,
      total_results: totalNumCountries,
    };

    res.json(response);
  }

  static async apiFacetedSearch(req, res, next) {
    const COUNTRIES_PER_PAGE = 20;

    let page;
    try {
      page = req.query.page ? parseInt(req.query.page, 10) : 0;
    } catch (e) {
      console.error(`Got bad value for page, defaulting to 0: ${e}`);
      page = 0;
    }

    let filters = {};

    filters =
      req.query.cast !== ''
        ? { cast: new RegExp(req.query.cast, 'i') }
        : { cast: 'Tom Hanks' };

    const facetedSearchResult = await CountriesDAO.facetedSearch({
      filters,
      page,
      COUNTRIES_PER_PAGE,
    });

    let response = {
      countries: facetedSearchResult.countries,
      facets: {
        runtime: facetedSearchResult.runtime,
        rating: facetedSearchResult.rating,
      },
      page: page,
      filters,
      entries_per_page: COUNTRIES_PER_PAGE,
      total_results: facetedSearchResult.count,
    };

    res.json(response);
  }
}
