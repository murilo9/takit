import {Request, Response} from "express";
import Notification, {INotificationInput, NotificationTypes} from '../models/Notification';
import User from '../models/User';
import Post, {IPost, IPostInput} from '../models/Post';
import Comment from '../models/Comment';

export default class NotificationRoutes {

  public routes(app, verifyJWT): void {

    //GET em /notifications - Lê todas as netoficações do usuário

    app.get('/notifications', async(req, res: Response) => {
      console.log('GET em /notifications');
      const requesterId = req.requesterId;
      const notifications = await Notification.find({user: requesterId})
      .populate('follower').populate('post').exec();
      res.status(200).send(notifications);
    })

    app.delete('/notifications/:notifId', async(req, res: Response) => {
      console.log('GET em /notifications/'+req.params.notifId);
      const requesterId = req.requesterId;
      const notifId = req.params.notifId;
      let notification = await Notification.findOne({user: requesterId, _id: notifId}).exec();
      if(notification){
        await Notification.deleteOne({_id: notifId}).exec();
        res.status(200).send('Notification deleted successfully.');
      }
      else{
        res.status(403).send('That notification is not yours.');
      }
    })
  }
}

/**
 * @desc Cria ou atualiza uma notificação.
 * @param type Tipo da notificação
 * @param user Id do usuário que vai receber a notificação
 * @param follower Id de quem passou a seguir o usuário
 * @param commented Id de quem fez o comentário
 * @param post Id do post onde o evento ocorreu
 */
const notificate = async function(type: NotificationTypes, user: string, follower: string,
  commented: string, post: string){
  //Atualiza a notificação sobre o comentário no post, se ja existir
  let notificationExists = null;
  //Se a notificação envolve algum post
  if(type !== NotificationTypes.FOLLOW){
    //Verifica se ja existe uma notificação deste tipo, neste post, para este usuário
    notificationExists = await Notification
    .findOne({type, post, user}).exec();
  }
  //Se a notificação ja existe
  if(notificationExists){
    //Atualiza os dados dela
    notificationExists.commented = commented;
    notificationExists.date = new Date();
    await notificationExists.save();
  }
  //Se a notificação não existir, cria
  else{
    let notification = new Notification({
      type,
      user,
      commented,
      post,
      follower
    });
    await notification.save();
  }
}

export {notificate};