const express = require("express"),
      bodyParser = require("body-parser"),
      cookieParser = require("cookie-parser"),
      axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const loggedInUser = {};
const API = 'https://hunter-todo-api.herokuapp.com'

app.get("/", (req, res) => {
    res.render("home");
});

app.post("/", (req, res) => {
    res.render("home", { loggedout: true });
    res.clearCookie("userToken");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/plsregister", (req, res) => {
    res.render("plsregister");
});

app.get("/plslogin", (req, res) => {
    res.render("plslogin");
});

app.get("/notfound", (req, res) => {
    res.render("notfound");
});

app.post("/register", async (req, res) => {
    const newUser = req.body.username;
    const allUsers = (await axios.get(`${API}/user`)).data;
    if(allUsers.filter(user => user.username === newUser).length !== 0) {
       res.redirect("plslogin");
    } else {
        try {
            await axios.post(`${API}/user`, { username: newUser });
            loggedInUser.username = newUser;
            res.redirect("/user");
        } catch(err) {
            console.log(err);
        }
    }
});

app.get("/user", async (req, res) => {
    if(!loggedInUser.username) {
        res.redirect("/notfound");
    }
    try {
        const token = (await axios.post(`${API}/auth`, { username: loggedInUser.username, headers: { 'content-type': 'application/json' } } )).data.token;
        res.cookie("userToken", token);
        const todos = (await axios.get(`${API}/todo-item`, { headers: { 'Authorization': token } } )).data;
        res.render("user", { user: loggedInUser.username, list: todos } );
    } catch(err) {
        res.render("user", { user: loggedInUser.username, list: [] } );
    }
});

app.post("/user", async (req, res) => {
    loggedInUser.username = req.body.username;
    try {
        const allUsers = (await axios.get(`${API}/user`)).data;
        if(allUsers.filter(user => user.username === loggedInUser.username).length === 0) {
            res.redirect("/plsregister");
        }
        const token = (await axios.post(`${API}/auth`, { username: loggedInUser.username, headers: { 'content-type': 'application/json' } } )).data.token;
        res.cookie("userToken", token);
        const todos = (await axios.get(`${API}/todo-item`, { headers: { 'Authorization': token } } )).data;
        res.render("user", { user: loggedInUser.username, list: todos } );
    } catch(err) {
        res.render("user", { user: loggedInUser.username, list: [] } );
    }
});

app.post("/newitem", async (req, res) => {
    try {
        const token = req.cookies.userToken;
        await axios.post(`${API}/todo-item`, { content: req.body.item }, { headers: { 'Authorization': token } } );
        const todos = (await axios.get(`${API}/todo-item`, { headers: { 'Authorization': token } } )).data;
        res.render("user", { user: loggedInUser.username, list: todos } );
    } catch(err) {
        console.log(err);
    }
});

app.post("/deleteitem", async (req, res) => {
    try {
        const token = req.cookies.userToken;
        await axios.delete(`${API}/todo-item/${Object.getOwnPropertyNames(req.body)[0]}`, { headers: { 'Authorization': token } } );
        const todos = (await axios.get(`${API}/todo-item`, { headers: { 'Authorization': token } } )).data;
        res.render("user", { user: loggedInUser.username, list: todos });
    } catch(err) {
        console.log(err);
    }
});

app.post("/updateitem", async (req, res) => {
    try {
        const token = req.cookies.userToken;
        await axios.put(`${API}/todo-item/${Object.getOwnPropertyNames(req.body)[0]}`, { "completed": true }, { headers: { 'Authorization': token } } );
        const todos = (await axios.get(`${API}/todo-item`, { headers: { 'Authorization': token } } )).data;
        res.render("user", { user: loggedInUser.username, list: todos });
    } catch(err) {
        console.log(err);
    }
});

app.listen(process.env.PORT, process.env.IP);
// app.listen(3000);