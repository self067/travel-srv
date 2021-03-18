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
}
