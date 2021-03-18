import { Router } from 'express';
import usersCtrl from './users.controller';

const router = new Router();

router.route('/register').post(usersCtrl.register);
router.route('/login').post(usersCtrl.login);
router.route('/logout').post(usersCtrl.logout);

export default router;
