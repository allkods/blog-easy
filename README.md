# blog-easy
blog-easy integrates a full automated blog system to a website without having to write any code.
It consists of :

>A [javascript client library](https://github.com/allkods/blog-easy-client) for the browser (or Node.js client)
### Features
---
- It adds a simple yet powerful Blog content management system (cms) to your client side page
- It can easily add and alter `Header`, `Sub-headers`, `Paragraphs`, `Notes`, `List`, `images`, `code-snippets` and many more elements
- It provides a default styling for all the blog elements
- It enables us to customize the styling of all the elements

>A Node.js package (this repository)
### Features
---
- It can automatically upload, update the post sent by its javascript cms client library
- It provides middlewares for automatic upload, update, search, view all post, view single post, and deletion
- It enables to choose a databse either mongoDB or mysql to store blog data
- It creates search engine friendly content

## Installation
---
```javascript
npm i blog-easy
```

## How to use
---

```javascript
const { blogEasy, upload, getPost, getBlog, deletePost } = require('blog-easy');

blogEasy({
    static :  /* your public directory name where the images will be saved */,
    app :  /* variable which holds the server */,
    database : /* your mongoDB string url OR object containing mysql connection details */
});
```

### With Express and MySql as database
```javascript
const express=require('express');
const app=express();

const { blogEasy, upload, getPost, getBlog, deletePost } = require('blog-easy');

blogEasy({
    static : 'public'
    app : app,
    database : {
        host: 'your_host',
        user: 'your_user',
        password: 'your_password',
        database: 'your_database_name'
    }
});
```

### With Express and mongoDB as database
```javascript
const express=require('express');
const app=express();

const { blogEasy, upload, getPost, getBlog, deletePost } = require('blog-easy');

blogEasy({
    static : 'public'
    app : app,
    database : 'your mongoDB string url'
});
```

## For uploading blog post
---
```javascript
app.post('/blogPost',upload);
```

## For getting all the blog posts (maximum 10 posts at a time)
---
```javascript
app.get('/blog',getBlog,(req,res)=>{

    res.render('Your-View',{...res.blog});

});
```
### For creating its API
```javascript
app.get('/blog',getBlog,(req,res)=>{

    res.josn({...res.blog});

});
```

> `res.blog` contains 5 variables as follows:
1. search -> It holds the search query (can be passed as value of search bar input)
2. prev -> It holds true or false value which shows whether Previous page is available or not (can be used to make previous button)
3. next -> It holds true or false value which shows whether Next page is available or not (can be used to make Next button)
4. page -> It holds the current page number (can be assigned to next or back button by incrementing or decrementing its value by 1 respectively)
5. posts -> It is an array of posts, each post holds `id`, `title`, `slug`, `coverImage`, `date`, `readableDate`

To know how to set up the frontend view see -> [setting up views](https://allkods.in/projects/blog-easy#Inside_the_view_of_getting_all_Blog_Post)


## For getting single blog post
---
```javascript
app.get('/blog/:slug',getPost,(req,res)=>{

    res.render('Your-View',{...res.blog});

});
```
### For creating its API
```javascript
app.get('/blog/:slug',getPost,(req,res)=>{

    res.json({...res.blog});

});
```
> `res.blog` contains 4 variables as follows:
1. blogTitle -> It contains title of the post ( can be used in meta tags for SEO )
2. blogImageSrc -> It contains the image src of the post ( can be used in meta tags for SEO )
3. blogHtml -> It contains whole of the blog post in HTML format inside a single string ( can be rendered inside any desired div )
4. slug -> It contains the slug of the post ( can be used to make delete or update button )

To know how to set up the frontend see -> [setting up views](https://allkods.in/projects/blog-easy#Inside_the_view_of_getting_Single_blog_post)

## For editing blog post
---
```javascript
app.get('/blog/:slug/edit',getPost,(req,res)=>{
    res.render('Your-View',{...res.blog});
});
```
### For creating its API
```javascript
app.get('/blog/:slug/edit',getPost,(req,res)=>{
    res.json({...res.blog});
});
```
> Middleware for this is same as getting single blog post ( you just need to change client side `type` property to `edit` while initializing )

> You can implement your own function or middleware to allow editing only if user is logged in or is admin

To know how to create Edit button inside view see -> [setting up views](https://allkods.in/projects/blog-easy#How_to_create_edit_button)

## For deleting blog post
---
```javascript
app.post('/post-delete',deletePost,(req,res)=>{
    res.redirect('/blog');
});
```
### For creating its API
```javascript
app.post('/post-delete',deletePost,(req,res)=>{
    res.josn({deleted:true});
});
```
> You can implement your own function or middleware to allow editing only if user is logged in or is admin

To know how to create Delete button inside view see -> [setting up views](https://allkods.in/projects/blog-easy#How_to_create_delete_button)

## How to use variables which are automatically passed to the views by [blog-essy](https://github.com/allkods/blog-easy)
---
Read full documentation here -> [setting up views](https://allkods.in/projects/blog-easy)

## TO-DO
---
- To make single blog post return keywords and description for SEO.
