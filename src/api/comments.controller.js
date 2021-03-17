import UsersDAO from '../dao/usersDAO';
import CommentsDAO from '../dao/commentsDAO';
import CountriesDAO from '../dao/countriesDAO';
import { User } from './users.controller';
import { ObjectId } from 'bson';

export default class CommentsController {
  static async apiPostComment(req, res, next) {
                     console.log('apiPostComment', req);

    try {

      const userJwt = req.get('Authorization').slice('Bearer '.length);

console.log('userJwt=',userJwt);

      const user = await User.decoded(userJwt);

console.log('user=', user);

      const { error } = user;
      if (error) {
        res.status(401).json({ error });
        return;
      }


      const email = user.email;
      const sightId = req.body.sight_id;
      const rating = req.body.rating;
      const comment = req.body.comment;
      const date = new Date();


console.log( 'post:',       ObjectId(sightId),
        email,
        rating,
        comment,
        date);

      const commentResponse = await CommentsDAO.addComment(
        ObjectId(sightId),
        email,
        rating,
        comment,
        date
      );

      const updatedComments = await CommentsDAO.getCommentsBySightID(sightId);

      res.json({ status: 'success', comments: updatedComments.comments });
    } catch (e) {
      res.status(500).json({ e });
    }
  }

  static async apiGetCommentsBySightId(req, res, next) {
    let sightId = req.params.sightId;
    let commentsList = await CommentsDAO.getCommentsBySightId(sightId);

    let response = {
      comments: commentsList,
    };

    res.json(response);
  }
}
