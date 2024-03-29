// Dependencies
const express=require('express');
const mongoose = require('mongoose');
const mysql=require('mysql');
const fs=require('fs');


// MongoDB collection schema
const blogSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    coverImage:{
        type: String,
        required: true
    },
    slug : {
        type: String,
        required: true
    },
    html : {
        type: String,
        required: true
    },
    tags : {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: () => Date.now(),
    },
    readableDate: {
        type: String,
        required: true
    },
    hit:{
        type: Number,
        default : 0
    }
});
const Blog = mongoose.model('blog', blogSchema);


// MySql creating table query
const table = `CREATE TABLE IF NOT EXISTS blogs(
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(300) NOT NULL,
    coverImage VARCHAR(400) NOT NULL,
    slug VARCHAR(400) NOT NULL,
    html TEXT,
    tags VARCHAR(400),
    date DATETIME DEFAULT current_timestamp(),
    readableDate VARCHAR(50) NOT NULL,
    hit SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY(id))
    ENGINE=INNODB,
    CHARACTER SET utf8,
    COLLATE utf8_unicode_ci;`;



// DEPENDENCIES FUNCTION

// For converting camel case string to css type
function cssConverter(data){
    var str="";
    for(var i=0; i<data.length; i++){
        if(data[i] != data[i].toUpperCase()){
            str += data[i];
        }else{
            str += `-${data[i].toLowerCase()}`
        }
    }
    return str;
}

// For getting css style from camel case
function getStyle(data){
    var arr=Object.entries(data);
    var str=""
    for(var i=0; i<arr.length; i++){
        var left = cssConverter(arr[i][0]);
        var right = arr[i][1];

        str += `${left} : ${right};`
    }
    return str;
}

// To check whether undefined or null
function empty(data){
    if(data === undefined || data === null)
    return true;
    else
    return false;
}

// For converting json to html
function htmlConverter(data,slug,host,tags){
    var str="";
    var imgCounter =0;
    for(var i=0; i<data.length; i++){
        var cl= !empty(data[i].class) ? data[i].class.trim() : "";
        var spl=cl.split(" ");
        
        if(empty(data[i].type)) return "";
        if(empty(data[i].style)) return "";
        if(empty(data[i].tag)) return "";
       

        switch(data[i].type){

            case 'header':
            case 'text':
            case 'note':
                if(empty(data[i].html)) return "";

                str += `<${data[i].tag} class="${cl}"`;
                
                if(spl.length === 1){
                    var style=getStyle(data[i].style);
                    str += ` style="${style}">\n`;
                }else{
                    str +=`>\n`;
                }
                
            str += `${data[i].html}\n</${data[i].tag}>`
            break;

            case 'list':
                if(empty(data[i].list)) return "";
                str += `<${data[i].tag} class="${cl}"`;
                if(spl.length === 1){
                    var style=getStyle(data[i].style);
                    str += ` style="${style}">\n`;
                }else{
                    str +=`>\n`;
                }
                

                for( j=0; j<data[i].list.length; j++){
                    var lcl =!empty(data[i].list[j].class)? data[i].list[j].class.trim() : "";
                    var lspl = lcl.split(" ");

                    str += `<li class="${lcl}"`;

                    if(lspl.length === 1){
                        var style=getStyle(data[i].list[j].style);
                        str += ` style="${style}">\n`;
                    }else{
                        str += `>\n`;
                    }
                    str += `${data[i].list[j].value}\n</li>`
                }
                str += `</${data[i].tag}>`;
            break;

            case 'code' :
                if(empty(data[i].html)) return "";
                str += `<${data[i].tag} class="${cl}"`;
                if(spl.length === 1){
                    var style=getStyle(data[i].style);
                    str += ` style="${style}">\n`;
                }else{
                    str += `>\n`;
                }
            str += `<code>${data[i].html}</code>\n</${data[i].tag}>`
            break;

            case 'space' :
                str += `<${data[i].tag} class="${cl}"`;
                if(spl.length === 1){
                    var style=getStyle(data[i].style);
                    str += ` style="${style}">\n`;
                }else{
                    str += `>\n`;
                }
                str += `</${data[i].tag}>`
            break;

            case 'imageBox':
                var name=`${imgCounter++}.png`;
                var style;
                if(spl.length === 1){
                    style=getStyle(data[i].style);
                    str += `<${data[i].tag} class="${cl}" style="${style}" src="${host}/blog/${slug}/${name}">\n`;
                    
                }else{
                    str += `<${data[i].tag} class="${cl}" src="${host}/blog/${slug}/${name}">\n`;
                }

                str += `</${data[i].tag}>`;
            break;

            case 'coverImage':
                var style;
                if(spl.length === 1){
                    style=getStyle(data[i].style);
                    str += `<${data[i].tag} class="${cl}" style="${style}" src="${host}/blog/${slug}/cover.jpg">\n`;
                }else{
                    str += `<${data[i].tag} class="${cl}" src="${host}/blog/${slug}/cover.jpg">\n`;
                }
                
                str += `</${data[i].tag}>`;
            break;

            case 'date':
                str += `<${data[i].tag} class="${cl}"`;
                if(spl.length === 1){
                    var style=getStyle(data[i].style);
                    str += ` style="${style}">\n`;
                }else{
                    str += `>\n`;
                }
                str += getRedableDate();
                str += `</${data[i].tag}>`
                break;
    
        }

    }
    str += `<input type="hidden" class="BEtags" value="${tags}" />`
    return str;
}

// For converting date to readable date format
function getRedableDate(){

    var dateOb=new Date;
    var newDate;
    
    var date=dateOb.getDate();
    var month=dateOb.getMonth() + 1;
    var year = dateOb.getFullYear();
    var sup;
    if(month === 1) month = 'January';
    if(month === 2) month = 'February';
    if(month === 3) month = 'March';
    if(month === 4) month = 'April';
    if(month === 5) month = 'May';
    if(month === 6) month = 'June';
    if(month === 7) month = 'July';
    if(month === 8) month = 'August';
    if(month === 9) month = 'September';
    if(month === 10) month = 'October';
    if(month === 11) month = 'November';
    if(month === 12) month = 'December';
    
    switch(date){
        case 31: case 21: case 1: sup = 'st';
        break;
        case 22: case 2: sup = 'nd';
        break;
        case 23: case 3: sup = 'rd';
        break;
        default : sup = 'th';
    }
    
    newDate = `${date}<sup>${sup}</sup> ${month}, ${year}`;
    return newDate;
    
}
    
// To escape quotes for mysql
function myescape(str){
    var newstr;
    newstr = str.replace(/\'/g,'<%%s%>')
                .replace(/\"/g,'<%%d%>');
    return newstr;
    
}
    
// To unescape quotes for mysql
function myunescape(str){
    var newstr = str;
    newstr = newstr.replace(/<%%s%>/g,"'")
                .replace(/<%%d%>/g,'"');
    return newstr;
    
}

const removeDir = function(path) {
    if (fs.existsSync(path)) {
      const files = fs.readdirSync(path)
  
      if (files.length > 0) {
        files.forEach(function(filename) {
          if (fs.statSync(path + "/" + filename).isDirectory()) {
            removeDir(path + "/" + filename)
          } else {
            fs.unlinkSync(path + "/" + filename)
          }
        })
        fs.rmdirSync(path)
      } else {
        fs.rmdirSync(path)
      }
    }
  }

  const copyRemoveDir = function(path,dest) {
    if (fs.existsSync(path)) {
      const files = fs.readdirSync(path)
  
      if (files.length > 0) {
        files.forEach(function(filename) {
          if (fs.statSync(path + "/" + filename).isDirectory()) {
            copyRemoveDir(path + "/" + filename,dest + "/" + filename)
          } else {
            if(!fs.existsSync(dest)) fs.mkdirSync(dest,{recursive:true})
            fs.copyFileSync(path + "/" + filename,dest + "/" + filename)
            fs.unlinkSync(path + "/" + filename)
          }
        })
        fs.rmdirSync(path)
      } else {
        fs.rmdirSync(path)
      }
    }
  }




// Variables
let static_path;
let mongoose_url;
let mysql_def;
let app;
let mysql_conn;
let my_host = '';


// Function for assigning values to variables
module.exports.blogEasy = function(obj){
    static_path = obj.static;

    app =obj.app;
    app.use(express.urlencoded({limit:'30mb',extended: true }));

    if(typeof(obj.database) === 'object'){
        mysql_def = obj.database;
        mysql_conn = mysql.createConnection(mysql_def);

        mysql_conn.connect(function(err){
        if(err)
        console.log(err.code);

        mysql_conn.query(table,(error,result,fields)=>{
           
        });

        });
    }else{
        mongoose_url = obj.database;
        mongoose.connect(mongoose_url,{ useUnifiedTopology: true, useNewUrlParser: true });
    }
}



// For handling blog post upload
module.exports.upload = (req,res,next)=>{
    if(app === undefined){
        console.log(`app undefined: pass the app variable to blogEasy.app()`);
        res.json({status:"error",msg:"Server Side : app undefined"});
        return;
    }
    if(static_path === undefined){
        console.log(`Static path undefined: pass public directory name to blogEasy.static()`);
        res.json({status:"error",msg:"Server Side : static directory undefined"});
        return;
    }
    if(mongoose_url === undefined && mysql_def === undefined){
        console.log(`Database undefined: For mongoDB pass mongoDB url to blogEasy.mongoose()
                     For mysql pass database setting json to blogEasy.mysql()`);
                     res.json({status:"error",msg:"Server Side : Database undefined"});
        return;
    }

        function uploadCoverImage(path){
            var index = coverImage.indexOf(';base64,');
            if(index !== -1){
                var ci=coverImage.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
                fs.writeFile(`${path}/cover.jpg`, ci, 'base64',function(){
                  
            });
            }
        }

        function uploadImages(path){
            for(var i=0; i<images.length; i++){
                var index = images[i].indexOf(';base64,');
                if(index !== -1){
                var ci=images[i].replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
                fs.writeFile(`${path}/${i}.png`, ci, 'base64',function(){
                  
                });
            }
            }
        }

        function imageHandler(folder){

            if(docType === 'upload'){
                if (!fs.existsSync(folder)){
                    fs.mkdirSync(folder,{recursive:true});
                }
            }
            else if(docType === 'edit'){
                var old = `./${static_path}/blog/${cusSlug}`;
                if( old !== folder )
                copyRemoveDir(old,folder);
            }

            uploadCoverImage(folder);
            uploadImages(folder);
        }
    
        function getCoverImage(data){
            for(var i=0; i<data.length; i++){
                if(data[i].type == 'coverImage'){
                    return data[i].data;
                }
            }
        }

        function getImages(data){
            var pus= [];
            for(var i=0; i<data.length; i++){
                if(data[i].type == 'imageBox'){
                    pus.push(data[i].data);
                }
            }
            return pus;
        }

        function errorHandler(data,coverImage,func){
            var { title, json, docType } = data;
            if(!title || !json){
                res.json({status:"error",msg:"Problem With the script"});
                return;
            }
            if(empty(coverImage)){
                res.json({status:"error",msg:"cover image not selected"});
                return;
            }

            return func();
        }

        function postExistCheck(slug,func){
            if(mongoose_url){

                Blog.findOne({slug:slug},{slug:true},(err,data)=>{
                    if(data){
                        res.json({status:'error',msg:'Post already exists, try editing the post'});
                        return;
                    }else{
                        return func();
                    }
                });
            }else{
                var chk=`SELECT id FROM blogs WHERE slug='${myescape(slug)}';`;
                mysql_conn.query(chk,(error,result,fields)=>{
                if(!result){
                    res.json({status:'error',msg:'Database connection error'});
                    return;
                }
                else if(result.length > 0){
                    res.json({status:'error',msg:'Post already exists, try editing the post'});
                    return;
                }else{
                    return func();
                }
            });

            }

        }

        function pushToDb(){
            if(mongoose_url){

                var date = getRedableDate();
                var news = docType == 'edit' && cusSlug ? cusSlug : slug;

                Blog.updateOne({slug:news},{title:title,coverImage:`${Host}/blog/${slug}/cover.jpg`,slug:slug,html:html,tags:tags,readableDate:date,date:Date.now()},{upsert:true},(err,data)=>{

                });

            }else{

                var newi = `${Host}/blog/${slug}/cover.jpg`;
                var date = getRedableDate();

                if(docType == 'upload')
                var q2=`INSERT INTO blogs(title,coverImage,slug,html,tags,readableDate) VALUES('${myescape(title)}','${newi}','${slug}','${myescape(html)}','${tags}','${date}');`;
                else
                var q2=`UPDATE blogs SET title='${myescape(title)}', coverImage='${newi}', slug='${slug}', html='${myescape(html)}', tags='${tags}', readableDate='${date}' WHERE slug='${cusSlug}';`;
                mysql_conn.query(q2,(error,result,fields)=>{
                
                });

            }
            
        }

        var { title, json, tags, docType, cusSlug } = req.body;
        let slug,html;
        json = JSON.parse(json);
        coverImage = getCoverImage(json);
        images = getImages(json);
        ntag= tags.split(',');
        ntag = ntag.map(val=>{
            return val.trim()
            .replace(/[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/g,"")
            .replace(/[ ]+/g,'-')
            .toLowerCase();
        })

        tags = ntag.join(',')

        var prot=req.protocol
        if(req.headers['x-forwarded-proto']){
            prot = req.headers['x-forwarded-proto']
        }
        Host = `${prot}://${req.headers.host}`
        

        errorHandler(req.body,coverImage,()=>{

            while(title[title.length - 1] === ' '){
                title=title.slice(0, -1);
            }
            while(title[0] === ' '){
                title = title.substring(1);
            }

            title = title.replace(/(\n|<br>)/g,' ');
            slug=title
            .replace(/[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/g,"")
            .replace(/[ ]+/g,'-')
            .replace(/-$/g,'')
            .toLowerCase();

            const folder =`./${static_path}/blog/${slug}`;

            if(docType == 'upload'){
                postExistCheck(slug,()=>{
                    html = htmlConverter(json,slug,Host,tags);
                    imageHandler(folder);
                    pushToDb();
                    res.json({status:"success",msg:"Published Successfully"});

                });
            }else if(docType == 'edit'){
                if(empty(cusSlug)){
                    res.json({status:"error",msg:"Problem With the script"});
                    return;
                }
                if(cusSlug != slug){
                    postExistCheck(slug,()=>{

                        html = htmlConverter(json,slug,Host,tags);
                        imageHandler(folder);
                        pushToDb();
                        res.json({status:"success",msg:"Updated Successfully",newSlug: slug});

                    })
                }else{

                html = htmlConverter(json,slug,Host,tags);
                imageHandler(folder);
                pushToDb();
                res.json({status:"success",msg:"Updated Successfully",newSlug: slug});

                }

            }
           
        });

    
};

module.exports.getPost = (req,res,next)=>{
    var param=req.params;
    var pname=Object.entries(param)[0][0];
    var slug=param[pname];
    
    var blog={
        blogHtml : null,
        blogTitle : null,
        blogImageSrc : null,
        slug : null,
        hit : 0,
        tags : null
    }

    function query(func){

        if(mongoose_url){

            Blog.findOneAndUpdate({slug:slug},{$inc:{hit:1}},{new:true},(err,data)=>{
                if(data){
                    blog.blogHtml = data.html;
                    blog.blogTitle = data.title;
                    blog.blogImageSrc = data.coverImage;
                    blog.slug = data.slug;
                    blog.hit = data.hit
                    blog.tags = data.tags.replace(/-/g," ")
                }
                return func();
            })
        }else{
            var read=`UPDATE blogs SET hit = hit + 1 WHERE slug = '${myescape(slug)}'`;
            mysql_conn.query(read,(error,result,fields)=>{
                
            })

            var q=`SELECT * FROM blogs WHERE slug = '${myescape(slug)}'`;
            mysql_conn.query(q,(error,result,fields)=>{
                if(result.length > 0){
    
                    blog.blogHtml = myunescape(result[0].html);
                    blog.blogTitle = myunescape(result[0].title);
                    blog.blogImageSrc = result[0].coverImage;
                    blog.slug = result[0].slug;
                    blog.hit = result[0].hit;
                    blog.tags = result[0].tags.replace(/-/g," ");
                }
                return func();
            });
        }

    }

    query(()=>{
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        res['blog']=blog;
        next();
    })

}

module.exports.getBlog = (req,res,next)=>{

    var sender={
        search : null,
        prev : false,
        next : false,
        page : null,
        posts : []
    };

    if(!req.query.page || req.query.page < 1){
        req.query.page = '1';
    }

    req.query.page = parseInt(req.query.page);
    var sQuery=req.query.search;
    sender.search = sQuery;

    if(sQuery && sQuery != ""){
        var str="";
        
        str = sQuery.replace(/[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/g,"")
                    .replace(/[ ]+/g,'-')
                    .replace(/-$/g,'')
                    .toLowerCase();
        
        function query(func){
            if(mongoose_url){

                Blog.find({$or:[
                    { slug: new RegExp(`.*${str}.*`,`i`) },
                    { tags: new RegExp(`.*${str}.*`,`i`) }
                ]},{title:true,coverImage:true,date:true,readableDate:true,slug:true,hit:true},(err,data)=>{
                    if(data === undefined || data === null) data=[];
            
                        if(data.length === 11){
                            data.pop();
                            sender.next = true;
                        }
                        if(req.query.page !== 1)
                        sender.prev = true;

                        sender.posts = data;
                        sender.page =req.query.page;
                        return func();

                }).skip((req.query.page-1)*10).limit(req.query.page * 10 + 1);
        
                }else{
        
                var q=`SELECT id,title,coverImage,date,readableDate,slug,hit FROM blogs WHERE
                slug LIKE '%${str}%' OR 
                tags LIKE '%${str}%' LIMIT ${(req.query.page-1)*10},${req.query.page * 10 + 1};`;
                mysql_conn.query(q,(err,data,fields)=>{
        
                    if(data === undefined || data === null) data =[];
        
                    for(var i=0; i<data.length; i++){
                        data[i].title = myunescape(data[i].title);
                    }
        
                    if(data.length === 11){
                        data.pop();
                        sender.next = true;
                    }
                    if(req.query.page !== 1)
                    sender.prev = true;

                    sender.posts = data;
                    sender.page =req.query.page;
                    return func();
        
                });
                }

        }

        query(()=>{
            res['blog'] = sender;
            next();

        });


    }else{

        function query(func){

            if(mongoose_url){

                Blog.find({},{title:true,coverImage:true,date:true,readableDate:true,slug:true,hit:true},(err,data)=>{
        
                    if(data === undefined || data === null) data = [];
        
                    if(data.length === 11){
                        data.pop();
                        sender.next = true;
                    }
                    if(req.query.page !== 1)
                    sender.prev = true;

                    sender.posts = data;
                    sender.page =req.query.page;
                    return func();

                }).skip((req.query.page-1)*10).limit(req.query.page * 10 + 1);
        
                }else{
        
                var q=`SELECT id,title,coverImage,date,readableDate,slug,hit FROM blogs
                LIMIT ${(req.query.page-1)*10},${req.query.page * 10 + 1};`;
        
                mysql_conn.query(q,(err,data,fields)=>{
        
                    if(data === undefined ||data === null ) data =[]
        
                    for(var i=0; i<data.length; i++){
                        data[i].title = myunescape(data[i].title);
                    }
        
                    if(data.length === 11){
                        data.pop();
                        sender.next = true;
                    }
                    if(req.query.page !== 1)
                    sender.prev = true;

                    sender.posts = data;
                    sender.page =req.query.page;
                    return func();

                });
                }

        }

        query(()=>{
            res['blog'] = sender;
            next();
        });


    }

}

module.exports.deletePost = (req,res,next)=>{
    const { slug } = req.body;
    if(mongoose_url){
        Blog.deleteOne({slug:slug},(err,result)=>{
            
        });
    }else{
        const nid= slug.replace(/\'/g,'');
        var sql=`DELETE FROM blogs WHERE slug = '${nid}';`;
        mysql_conn.query(sql,(err,data,fields)=>{
            
        });
    }

    const pathToDir = `./${static_path}/blog/${slug}`;
    removeDir(pathToDir);

    next();

}

module.exports.getRecent = function(limit,func){

        if(mongoose_url){
            Blog.find({},{title:true,coverImage:true,date:true,readableDate:true,slug:true,hit:true},(err,data)=>{
    
                if(data === undefined || data === null) data = [];

                return func(data);

            }).sort({id:-1}).limit(limit);
    
            }else{
    
            var q=`SELECT id,title,coverImage,date,readableDate,slug,hit FROM blogs ORDER BY id DESC
            LIMIT ${limit};`;
    
           mysql_conn.query(q,(err,data,fields)=>{

    
                if(data === undefined ||data === null ) data =[]
    
                for(var i=0; i<data.length; i++){
                    data[i].title = myunescape(data[i].title);
                }

                return func(data);

            });
            }

}