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

  static async addComment(sightId, email, rating, comment, date) {
    try {
      const commentDoc = {
        sight_id: ObjectId(sightId),
        email,
        rating,
        comment,
        date,
      };

      return await comments.insertOne(commentDoc);
    } catch (e) {
      console.error(`Unable to post comment: ${e}`);
      return { error: e };
    }
  }
}
