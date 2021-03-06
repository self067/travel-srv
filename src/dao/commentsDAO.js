import { ObjectId } from 'bson';

let comments;

export default class CommentsDAO {
  static async injectDB(conn) {
    if (comments) {
      return;
    }
    try {
      comments = await conn.db(process.env.TRAVEL_NS).collection('comments');
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`);
    }
  }

  static async getCommentsBySightId(sightId) {
    console.log('getCommentsBySightId=', sightId);

    let cursor;
    try {
      const sight = { sightId: ObjectId(sightId) };
      cursor = await comments.find(sight);

      // .find({ params: { $in: params } })
      // .project({ title: 1 }); //.limit(1)
    } catch (e) {
      console.error(`Unable to find comments, ${e}`);
      return [];
    }

    return cursor.toArray();
  }

  static async getCommentsBySightIdBad(sightId) {
    console.log('getCommentsBySightId=', sightId);
    try {
      const sight = { sightId: ObjectId('6041118fccccd212e4fced10') };
      //   sightId: sightId,
      // };
      const sight2 = { sightId: sightId };

      console.log('getCommentsBySightId=', sightId, sight, sight2);

      const rrr = await comments.find();
      console.log('rrr=', rrr);
      return rrr;
      return await comments.find(sight);
    } catch (e) {
      console.error(`Unable to get comments: ${e}`);
      return { error: e };
    }
  }

  /**
   * @param {string} counryId - The _id of the country in the `countries` collection.
   * @param {Object} user - An object containing the user's name and email.
   * @param {string} comment - The text of the comment.
   * @param {number} rating - The rating.
   * @param {string} date - The date on which the comment was posted.
   * @returns {DAOResponse} Returns an object with either DB response or "error"
   */
  static async addComment(sightId, user, comment, rating, date) {
    try {
      const commentDoc = {
        country_id: ObjectId(countryId),
        name: user.name,
        email: user.email,
        text: comment,
        rating,
        date,
      };

      return await comments.insertOne(commentDoc);
    } catch (e) {
      console.error(`Unable to post comment: ${e}`);
      return { error: e };
    }
  }

  /**
   * Updates the comment in the comment collection. Queries for the comment
   * based by both comment _id field as well as the email field to doubly ensure
   * the user has permission to edit this comment.
   * @param {string} commentId - The _id of the comment to update.
   * @param {string} userEmail - The email of the user who owns the comment.
   * @param {string} text - The updated text of the comment.
   * @param {string} date - The date on which the comment was updated.
   * @returns {DAOResponse} Returns an object with either DB response or "error"
   */
  static async updateComment(commentId, userEmail, text, date) {
    try {
      const updateResponse = await comments.updateOne(
        { _id: commentId, email: userEmail },
        { $set: { text, date } }
      );

      return updateResponse;
    } catch (e) {
      console.error(`Unable to update comment: ${e}`);
      return { error: e };
    }
  }

  static async deleteComment(commentId, userEmail) {
    try {
      const deleteResponse = await comments.deleteOne({
        _id: ObjectId(commentId),
        email: userEmail,
      });

      return deleteResponse;
    } catch (e) {
      console.error(`Unable to delete comment: ${e}`);
      return { error: e };
    }
  }

  static async mostActiveCommenters() {
    /**
    Ticket: User Report
    Build a pipeline that returns the 20 most frequent commenters on the 
    site. You can do this by counting the number of occurrences of a user's
    email in the `comments` collection.
    */
    try {
      // Return the 20 users who have commented the most
      const pipeline = [
        {
          $project: {
            email: 1,
            _id: 0,
          },
        },
        {
          $group: {
            _id: '$email',
            count: {
              $sum: 1,
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ];

      const readConcern = { level: 'majority' }; //comments.readConcern
      const aggregateResult = await comments.aggregate(pipeline, {
        readConcern,
      });

      return await aggregateResult.toArray();
    } catch (e) {
      console.error(`Unable to retrieve most active commenters: ${e}`);
      return { error: e };
    }
  }
}

/**
 * Success/Error return object
 * @typedef DAOResponse
 * @property {boolean} [success] - Success
 * @property {string} [error] - Error
 */
