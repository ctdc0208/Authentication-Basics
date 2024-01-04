/////// app.js

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const Schema = mongoose.Schema;

const mongoDB = "mongodb+srv://admin:MrHO0TGqCAAb2RRi@atlascluster.o8zy7ko.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoDB);

main().catch((err) => console.log(err));
async function main() {
    await mongoose.connect(mongoDB);
}


const User = mongoose.model(
    "User",
    new Schema({
        username: { type: String, required: true },
        password: { type: String, required: true }
    })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            };
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                // passwords do not match!
                return done(null, false, { message: "Incorrect password" })
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        };
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    };
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
});

app.get("/sign-up", (req, res) => res.render("./template/sign-up-form"));

//TODO: Fix bcrypt not working

app.post("/sign-up", async (req, res, next) => {
    const user = new User({
        username: req.body.username
    });

    bcrypt.hash(req.body.password, 10, async (error, hashedPassword) => {
        if (error) { return next(error); }
        user.set('password', hashedPassword);
        await user.save(error => {
            if (error) { return next(error); }
            return res.status(200).json(user);
        })
    });
});

app.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/"
    })
);

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});




app.listen(3000, () => console.log("app listening on port 3000!"));