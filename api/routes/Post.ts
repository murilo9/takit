import {Request, Response} from "express";
import User from '../models/User';
import Post, {IPost, IPostInput} from '../models/Post';
import Comment from '../models/Comment';

export default class PostRoutes {
  
  public routes(app, verifyJWT, upload): void {
    
    app.route('/posts')
    .all((req: Request, res: Response, next) => {
      verifyJWT(req, res, () => { next() })
    })

    //GET em /posts - Retorna alguns posts de quem você está seguindo

    .get(async (req: Request, res: Response) => {
      console.log('GET em /posts');
      let posts = await Post.find({}).lean().populate('author').exec();
      //Adiciona o total de comentários do post:
      for(let i = 0; i < posts.length; i++){
        let post = posts[i];
        let comments = await Comment.find({ post: post._id });
        console.log(comments)
        post.commentsTotal = comments.length;
      }
      res.status(200).send(posts);
    })

    //POST em /posts - Cria um novo post

    .post(async (req, res: Response) => {
      console.log('POST em /posts');
      let requesterId = req.requesterId;
      //Instancia o post no banco de dados:
      let postData = {
        text: req.body.text,
        img: req.body.img,    //TODO - Upload da foto caso tenha
        author: requesterId,
        tags: req.body.tags
      }
      if(!postData.text && !req.hasPhoto){
        res.status(400).send('Your post must either have text or a picture');
      }
      else{
        let createdPost = new Post(postData);
        await createdPost.save();
        await createdPost.populate('author').execPopulate();
        console.log(createdPost)
        res.status(201).send(createdPost);    //201 - Created
      }
    })

    app.route('/post/:postId')
    .all((req: Request, res: Response, next) => {
      verifyJWT(req, res, () => { next() })
    })

    //PUT em /post/:postId - Atualiza um post

    .put(async (req, res: Response) => {
      console.log('PUT em /post/'+req.params.postId)
      const postId = req.params.postId;
      const updatedPost = req.body;
      let post = await Post.findOne({_id: postId}).exec();

      //Caso o post não exista:
      if(!post){
        req.status(404).send("Post doesn't exist");
        return;
      }

      //Se o requester não for o dono do post:
      if(post.author.toString() !== req.requesterId){
        res.status(403).send('That post is not yours');
        return;
      }

      //Atualiza os atributos do post:
      if(updatedPost.text){
        post.text = updatedPost.text;
      }
      if(updatedPost.img){
        post.img = updatedPost.pictureSrc;
      }
      if(updatedPost.tags){
        post.tags = updatedPost.tags;
      }
      await post.save();
      res.status(200).send(post);
    })

    //DELETE em /post/:postId - Deleta um post

    .delete(async (req, res: Response) => {
      console.log('DELETE em /post/'+req.params.postId)
      const postId = req.params.postId;
      let post = await Post.findOne({_id: postId}).exec();

      //Caso o post não exista:
      if(!post){
        res.status(404).send("Post doesn't exist");
        return;
      }

      //Se o requester não for o dono do post:
      if(post.author.toString() !== req.requesterId){
        res.status(403).send('That post is not yours');
        return;
      }

      //Deleta o post:
      await Post.deleteOne({_id: postId}).exec();
      res.status(200).send('Post deleted successfully');

      //TODO - Deletar os comentários do post e a imagem do post, caso tenha
    })

    app.route('/post/:postId/like')
    .all((req: Request, res: Response, next) => {
      verifyJWT(req, res, () => { next() })
    })

    //POST em /post/:postId/like -  Dá like num post

    .post(async (req, res: Response) => {
      console.log('POST em /post/'+req.params.postId+'/like')
      const postId = req.params.postId;
      const requesterId = req.requesterId;
      let post = await Post.findOne({_id: postId}).exec();

      //Caso o post não exista:
      if(!post){
        res.status(404).send('Post not found');
        return;
      }

      //Remove o unlike, caso tenha:
      let unliked = -1;
      post.unlikedBy.forEach((unlikeUserId, i) => {
        if(unlikeUserId.toString() === requesterId){
          unliked = i;
        }
      });
      if(unliked > -1){
        post.unlikedBy.splice(unliked, 1);
      }

      //Se ja tem like, remove o like:
      let alreadyLiked = -1;
      post.likedBy.forEach((likeUserId, i) => {
        if(likeUserId.toString() === requesterId){
          alreadyLiked = i;
        }
      });
      if(alreadyLiked > -1){
        post.likedBy.splice(alreadyLiked, 1);
        await post.save();
        res.status(200).send(post);
        return;
      }
      //Se não tem like, insere o like:
      else{
        post.likedBy.push(requesterId);
        await post.save();
        res.status(200).send(post);
      }
    })

    app.route('/post/:postId/unlike')
    .all((req: Request, res: Response, next) => {
      verifyJWT(req, res, () => { next() })
    })

    //POST em /post/:postId/unlike -  Dá unlike num post

    .post(async (req, res: Response) => {
      console.log('POST em /post/'+req.params.postId+'/unlike')
      const postId = req.params.postId;
      const requesterId = req.requesterId;
      let post = await Post.findOne({_id: postId}).exec();

      //Caso o post não exista:
      if(!post){
        res.status(404).send('Post not found');
        return;
      }

      //Remove o like, caso tenha:
      let liked = -1;
      post.likedBy.forEach((likeUserId, i) => {
        if(likeUserId.toString() === requesterId){
          liked = i;
        }
      });
      if(liked > -1){
        post.likedBy.splice(liked, 1);
      }

      //Se ja tem unlike, remove o unlike:
      let alreadyUnliked = -1;
      post.unlikedBy.forEach((unlikeUserId, i) => {
        if(unlikeUserId.toString() === requesterId){
          alreadyUnliked = i;
        }
      });
      if(alreadyUnliked > -1){
        post.unlikedBy.splice(alreadyUnliked, 1);
        await post.save();
        res.status(200).send(post);
        return;
      }
      //Se não tem unlike, insere o unlike:
      else{
        post.unlikedBy.push(requesterId);
        await post.save();
        res.status(200).send(post);
      }
    })

    //GET em /posts/:nickname - Lê os posts de um usuário

    app.route('/posts/:userId')

    .get(async (req: Request, res: Response) => {
      console.log('GET em /posts/'+req.params.userId);
      const author = req.params.userId;
      let posts = await Post.find({ author }).lean().populate('author').exec();
      //Adiciona o total de comentários do post:
      for(let i = 0; i < posts.length; i++){
        let post = posts[i];
        let comments = await Comment.find({ post: post._id });
        console.log(comments)
        post.commentsTotal = comments.length;
      }
      res.status(200).send(posts);
    })
  }
}