set NODE_ENV=development
nodemon --watch api,config,tasks,typings --ignore .git,.idea,.tmp,assets,node_modules,UnifyHTML,views --ext ts
pause