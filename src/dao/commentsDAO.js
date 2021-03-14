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
}
