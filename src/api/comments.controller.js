import UsersDAO from '../dao/usersDAO';
import CommentsDAO from '../dao/commentsDAO';
import CountriesDAO from '../dao/countriesDAO';
import { User } from './users.controller';
import { ObjectId } from 'bson';

export default class CommentsController {
  static async apiPostComment(req, res, next) {
    try {
      const userJwt = req.get('Authorization').slice('Bearer '.length);
      const user = await User.decoded(userJwt);
      const { error } = user;
      if (error) {
        res.status(401).json({ error });
        return;
      }

      const CountryId = req.body.country_id;
      const comment = req.body.comment;
      const date = new Date();

      const commentResponse = await CommentsDAO.addComment(
        ObjectId(countryId),
        user,
        comment,
        date
      );

      const updatedComments = await CountriesDAO.getCountryByID(countryId);

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

  static async apiUpdateComment(req, res, next) {
    try {
      const userJwt = req.get('Authorization').slice('Bearer '.length);
      const user = await User.decoded(userJwt);
      let { error } = user;
      if (error) {
        res.status(401).json({ error });
        return;
      }

      const commentId = req.body.comment_id;
      const text = req.body.updated_comment;
      const date = new Date();

      const commentResponse = await CommentsDAO.updateComment(
        ObjectId(commentId),
        user.email,
        text,
        date
      );

      error = commentResponse.error;
      if (error) {
        res.status(400).json({ error });
      }

      if (commentResponse.modifiedCount === 0) {
        throw new Error(
          'unable to update comment - user may not be original poster'
        );
      }

      const countryId = req.body.country_id;
      const updatedComments = await CountriesDAO.getCountryByID(countryId);

      res.json({ comments: updatedComments.comments });
    } catch (e) {
      res.status(500).json({ e });
    }
  }

  static async apiDeleteComment(req, res, next) {
    try {
      const userJwt = req.get('Authorization').slice('Bearer '.length);
      const user = await User.decoded(userJwt);
      const { error } = user;
      if (error) {
        res.status(401).json({ error });
        return;
      }

      const commentId = req.body.comment_id;
      const userEmail = user.email;
      const commentResponse = await CommentsDAO.deleteComment(
        ObjectId(commentId),
        userEmail
      );

      const countryId = req.body.country_id;

      const { comments } = await CountriesDAO.getCountryByID(countryId);
      res.json({ comments });
    } catch (e) {
      res.status(500).json({ e });
    }
  }

  static async apiCommentReport(req, res, next) {
    try {
      const userJwt = req.get('Authorization').slice('Bearer '.length);
      const user = await User.decoded(userJwt);
      const { error } = user;
      if (error) {
        res.status(401).json({ error });
        return;
      }

      if (UsersDAO.checkAdmin(user.email)) {
        const report = await CommentsDAO.mostActiveCommenters();
        res.json({ report });
        return;
      }

      res.status(401).json({ status: 'fail' });
    } catch (e) {
      res.status(500).json({ e });
    }
  }
}
