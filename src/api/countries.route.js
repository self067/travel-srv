import { Router } from 'express';
import CountriesCtrl from './countries.controller';
import CommentsCtrl from './comments.controller';

const router = new Router();

router.route('/').get(CountriesCtrl.apiGetCountries);
router.route('/search').get(CountriesCtrl.apiSearchCountries);
router.route('/params').get(CountriesCtrl.apiGetCountriesByParams);
router.route('/live-search').get(CountriesCtrl.apiLiveSearch);
router.route('/id/:id').get(CountriesCtrl.apiGetCountryById);

router.route('/sights/:sightId').get(CommentsCtrl.apiGetCommentsBySightId);

router
  .route('/comment')
  .post(CommentsCtrl.apiPostComment)
  .put(CommentsCtrl.apiUpdateComment)
  .delete(CommentsCtrl.apiDeleteComment);

export default router;
