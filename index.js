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
    }
});
const Blog = mongoose.model('blog', blogSchema);


// MySql creating table query
const table = `CREATE TABLE IF NOT EXISTS blogs(
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    coverImage VARCHAR(100) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    html VARCHAR(20000),
    tags VARCHAR(100) ,
    date DATETIME DEFAULT current_timestamp(),
    readableDate VARCHAR(50) NOT NULL,
    PRIMARY KEY(id))
    ENGINE=INNODB,
    CHARACTER SET utf8,
    COLLATE utf8_unicode_ci;`;



// DEPENDENCIES FUNCTION

// Function for image error handling
function imageErrorChecker(image,func){
    var allowed=['jpg','png','jpeg'];

    for(var i=0; i<image.length; i++){

    var type=image[i].name.split('.');
    type=type[type.length - 1].toLowerCase();
    var per = allowed.indexOf(type);

    if(per === -1){
        if(i === 0){
            return func({status:'error',msg:`File type of Cover Image is invalid`});
        }else{
            return func({status:'error',msg:`File type of one or images is invalid`});
        }
    }else{
        return func({status:'success',msg:'All files are valid'});
    }

    }
}

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

function empty(data){
    if(data === undefined || data === null)
    return true;
    else
    return false;
}

// For converting json to html
function htmlConverter(data,slug){
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
                    data[i].style['background'] = `url('/blog/${slug}/${name}')`;
                    data[i].style['backgroundSize'] = 'cover';
                    data[i].style['backgroundPosition'] = 'center';
                    style=getStyle(data[i].style);
                    
                }else{
                    style=`background : url('/blog/${slug}/${name}');
                            background-size: cover;
                            background-position:center;`
                }
                str += `<${data[i].tag} class="${cl}" style="${style}">\n`;
                str += `</${data[i].tag}>`;
            break;

            case 'coverImage':
                var style;
                if(spl.length === 1){
                    data[i].style['background'] = `url('/blog/${slug}/cover.jpg')`;
                    data[i].style['backgroundSize'] = 'cover';
                    data[i].style['backgroundPosition'] = 'center';
                    style=getStyle(data[i].style);
                }else{
                    style=`background : url('/blog/${slug}/cover.jpg');
                            background-size: cover;
                            background-position:center;`
                }
                str += `<${data[i].tag} class="${cl}" style="${style}">\n`;
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
    return str;
}

// For converting date to readable format
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
    
// To myescape quotes for mysql
function myescape(str){
    var newstr;
    newstr = str.replace(/\'/g,'<%single%>')
                .replace(/\"/g,'<%double%>');
    return newstr;
    
}
    
// To myunescape quotes for mysql
function myunescape(str){
    var newstr = str;
    newstr = newstr.replace(/<%single%>/g,"'")
                .replace(/<%double%>/g,'"');
    return newstr;
    
}




// Variables
let static_path;
let mongoose_url;
let mysql_def;
let app;
let mysql_conn;


// Function for assigning values to variables
module.exports.blogEasy = function(obj){
    static_path = obj.static;

    app =obj.app;
    app.use(express.urlencoded({limit:'20mb',extended: true }));

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
        mongoose.connect(mongoose_url,{ useFindAndModify:false,useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
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
                if (fs.existsSync(old)){
                    fs.renameSync(old,folder);
                }
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

                Blog.updateOne({slug:news},{title:title,coverImage:`/blog/${slug}/cover.jpg`,slug:slug,html:html,tags:'',readableDate:date,date:Date.now()},{upsert:true},(err,data)=>{

                });

            }else{

                var newi = `/blog/${slug}/cover.jpg`;
                var date = getRedableDate();

                if(docType == 'upload')
                var q2=`INSERT INTO blogs(title,coverImage,slug,html,tags,readableDate) VALUES('${myescape(title)}','${newi}','${slug}','${myescape(html)}','','${date}');`;
                else
                var q2=`UPDATE blogs SET title='${myescape(title)}', coverImage='${newi}', slug='${slug}', html='${myescape(html)}', tags='', readableDate='${date}' WHERE slug='${cusSlug}';`;
                mysql_conn.query(q2,(error,result,fields)=>{
                
                });

            }
            
        }

        var { title, json, docType, cusSlug } = req.body;
        let slug,html;
        json = JSON.parse(json);
        coverImage = getCoverImage(json);
        images = getImages(json);
        
        errorHandler(req.body,coverImage,()=>{

            while(title[title.length - 1] === ' '){
                title=title.slice(0, -1);
            }
            while(title[0] === ' '){
                title = title.substring(1);
            }

            slug=title
            .replace(/[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/g,"")
            .replace(/[ ]+/g,'-')
            .replace(/-$/g,'')
            .toLowerCase();

            const folder =`./${static_path}/blog/${slug}`;

            if(docType == 'upload'){
                postExistCheck(slug,()=>{
                    html = htmlConverter(json,slug);

                    imageHandler(folder);
                    pushToDb();
                    res.json({status:"success",msg:"Published Successfully"});

                });
            }else if(docType == 'edit'){
                if(empty(cusSlug)){
                    res.json({status:"error",msg:"Problem With the script"});
                    return;
                }
                html = htmlConverter(json,slug);

                imageHandler(folder);
                pushToDb();
                res.json({status:"success",msg:"Updated Successfully",newSlug: slug});

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
        slug : null
    }

    function query(func){

        if(mongoose_url){
            Blog.findOne({slug:slug},(err,data)=>{
                if(data){
    
                    blog.blogHtml = data.html;
                    blog.blogTitle = data.title;
                    blog.blogImageSrc = data.coverImage;
                    blog.slug = data.slug;
                }
                return func();
            });
        }else{
            var q=`SELECT * FROM blogs WHERE slug = '${myescape(slug)}'`;
            mysql_conn.query(q,(error,result,fields)=>{
                if(result.length > 0){
    
                    blog.blogHtml = myunescape(result[0].html);
                    blog.blogTitle = myunescape(result[0].title);
                    blog.blogImageSrc = result[0].coverImage;
                    blog.slug = result[0].slug;
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
                ]},{title:true,coverImage:true,date:true,readableDate:true,slug:true},(err,data)=>{
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
        
                var q=`SELECT id,title,coverImage,date,readableDate,slug FROM blogs WHERE
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

                Blog.find({},{title:true,coverImage:true,date:true,readableDate:true,slug:true},(err,data)=>{
        
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
        
                var q=`SELECT id,title,coverImage,date,readableDate,slug FROM blogs
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

    const pathToDir = `./${static_path}/blog/${slug}`;
    removeDir(pathToDir);

    next();

}