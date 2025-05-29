const express= require('express');
const cors= require('cors');
const bcrypt= require('bcrypt');
const app=express();
const mysql=require('mysql2');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
require('dotenv').config();

const db=mysql.createConnection({
    host: process.env.DB_HOST,
  port: process.env.DB_PORT, //  Include the correct port
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
})
console.log(process.env.DB_HOST); 
console.log(process.env.DB_USER); 
console.log(process.env.DB_PASS); 
db.connect((err)=>{
    //console,log(err);
    if(err)
    {
        console.log("Error connecting to db");
        return 
    }
    console.log("Connected to datbase");
})
app.get('/',(req,res)=>{
    console.log(req)
    res.status(200).json({message:"heyy"})

})
const PORT = process.env.PORT || 5000;
app.post('/registerUser',async(req,res)=>{
   console.log(req.body)
   const {email,password}=req.body;
   try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password: ", hashedPassword);
    db.query(`insert into Users(EmailID,HashedPassword) values('${email}','${hashedPassword}')`,(err,result)=>{
        if(err){
            res.status(500).send("not possible.error");
        }
        res.status(200).send('okay');

    })
   
       
    } catch (err) {
    console.error(err);
    res.status(500).send('Error while hashing password');
}
res.status(200).json({message:"User ergistrrred successsfuly"})
})
    
app.post('/userLogin',async(req,res)=>{
    console.log("User logged in",req.body);
    const {email,password}=req.body;
    let hasp='';
    let userID='';
 //   let hassp="$2b$10$bkUoiXuqdzyL6WzKEFBCA.i5Wv8fQyqeg6DtDdnjkiGOMhwwkFyIG";
    db.query(`select ID,HashedPassword from Users where EmailID='${email}'`,async(err,result)=>{
        if(err)
        {
            res.status(500);
        }
       // console.log('lin 63',result);
        hasp=result[0].HashedPassword;
        userID=result[0].ID;
       //console.log(hasp);
       let response=await bcrypt.compare(password,hasp);
       console.log( "is hassedpassword matched ",response)
       if(response){
        res.status(200).json({userID:userID});
        return
       }
       else{
        res.status(500)
        return
       }

 //  console.log('Is it true bhavani?',response);
  //  res.status(200).send('Password Matched ');
    })
 //let response=await bcrypt.compare(password,hassp)
   // console.log('Is it true bhavani?',response);
  //  res.status(200).send('Matched ra ');
})
app.post('/newPost',async(req,res)=>{
    const {postTitle,postdescription,userID}=req.body;
    db.query(`insert into Posts(UserID,postTitle,postDescription) values(${userID},'${postTitle}','${postdescription}')`,async(err,result)=>{
        if(err){
            res.status(500);
            return
        }
        res.status(200)
    })
  //  console.log('User about to enter');
   // console.log("New Post",req.body);

})
app.post('/getMyPosts', (req, res) => {
    const userID = parseInt(req.body.userID);
    if (!userID) {
      return res.status(400).send('Missing or invalid userID');
    }
  
    const query = 'SELECT * FROM Posts WHERE UserID = ?';
    db.query(query, [userID], (err, results) => {
      if (err) {
        console.log('Database error:', err);
        return res.status(500).send('Database error');
      }
      res.status(200).json(results);
    });
  });
   // Make sure this middleware is added

   app.post('/getPostByID', (req, res) => {
    const { postID } = req.body;
    if (!postID) return res.status(400).json({ error: 'postID is required' });
  
    const query = 'SELECT postTitle, postDescription FROM Posts WHERE ID = ?';
    db.query(query, [postID], (err, results) => {
      if (err) {
        console.error('Error fetching post:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      res.json(results[0]);
    });
  });
  
  
  /*app.post('/getPostID', (req, res) => {
    const ID = parseInt(req.body.ID);
    if (!ID) {
      return res.status(400).send('Missing or invalid ID');
    }
  
    const query = 'SELECT * FROM Posts WHERE ID = ?';
    db.query(query, [ID], (err, results) => {
      if (err) {
        console.log('Database error:', err);
        return res.status(500).send('Database error');
      }
      res.status(200).json(results);
    });
  });
  //onsole.log('User about to enter');
   // console.log("New Post",req.body);

*/
app.post('/getPostByID', (req, res) => {
  const { postID } = req.body;
  if (!postID) return res.status(400).json({ error: 'postID is required' });

  const query = 'SELECT postTitle, postDescription FROM Posts WHERE ID = ?';
  db.query(query, [postID], (err, results) => {
    if (err) {
      console.error('Error fetching post:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(results[0]);
  });
});
app.listen(PORT,()=>{
    console.log(`Server running at ${PORT}`);
})