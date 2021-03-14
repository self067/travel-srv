import { Router } from 'express';
import usersCtrl from './users.controller';
import commentsCtrl from './comments.controller';

const router = new Router();

router.route('/register').post(usersCtrl.register);
router.route('/login').post(usersCtrl.login);
router.route('/logout').post(usersCtrl.logout);
router.route('/update-preferences').put(usersCtrl.save);
router.route('/comment-report').get(commentsCtrl.apiCommentReport);

export default router;
