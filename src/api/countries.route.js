import { Router } from 'express';
import CountriesCtrl from './countries.controller';
import CommentsCtrl from './comments.controller';

const router = new Router();

// associate put, delete, and get(id)
router.route('/').get(CountriesCtrl.apiGetCountries);
router.route('/search').get(CountriesCtrl.apiSearchCountries);
router.route('/params').get(CountriesCtrl.apiGetCountriesByParams);
router.route('/facet-search').get(CountriesCtrl.apiFacetedSearch);
router.route('/id/:id').get(CountriesCtrl.apiGetCountryById);
router.route('/config-options').get(CountriesCtrl.getConfig);

router
  .route('/comment')
  .post(CommentsCtrl.apiPostComment)
  .put(CommentsCtrl.apiUpdateComment)
  .delete(CommentsCtrl.apiDeleteComment);

export default router;
