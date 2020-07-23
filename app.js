const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash")
const app = express();
const port = 3000;

mongoose.connect("mongodb://localhost:27017/todoListDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of todo must be filled"]
    }
})

const listSchema = new mongoose.Schema({
    name: String,
    list: [itemSchema]
})

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema)

const firstItem = new Item({
    name: "Welcome to your todolist!!"
});

const secondItem = new Item({
    name: "Hit the + button to add a new item"
});

const thirdItem = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [firstItem, secondItem, thirdItem];

const date = require("./date")

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"))
app.set("view engine", "ejs")

app.get("/", (req, res)=>{
    const day = date.getDay()

    Item.find((err,items)=>{
        if (items.length === 0) {
            Item.insertMany(defaultItems, (err)=>{
                if (err) {
                    console.log(err);
                } else {
                    console.log("Default items has been add");
                }
            });
            res.redirect("/")
        } else {
            res.render("list", {listTitle: day, listOfItems: items})
        }
    })
});

app.get("/:category", (req,res)=>{
    let category = _.capitalize(req.params.category);

    List.findOne({name: category}, (err, result)=>{
        if(err){
            console.log(err);
        }else {
            if (!result) {
                const newList = new List({
                    name: category,
                    list: defaultItems
                })

                newList.save();
                res.redirect(`/${category}`)
            } else {
                res.render("list", {listTitle: result.name, listOfItems: result.list})
            }
        }
    })
});

app.post("/", (req,res)=>{
    console.log(req.body.list);

    List.findOne({name: req.body.list}, (err, result)=>{
        if (!err){
            const item = new Item({
                name: req.body.newItem
            })

            if(!result) {
                item.save()
                res.redirect("/")
            } else {
                result.list.push(item)
                result.save()
                res.redirect(`/${result.name}`)
            }
        }
    })

})

app.post("/delete", (req,res)=>{
    const targetId = req.body.checkbox;
    const listName = req.body.listName;

    // console.log(listName);
    List.findOne({name: listName}, (err, result)=>{
        if (!err) {
            if (!result) {
                Item.deleteOne({_id: targetId},(err)=>{
                    if(!err){
                        res.redirect("/");
                    }
                })
            } else {
                List.findOneAndUpdate({name: listName}, {$pull: {list: {_id: targetId}}},(err,response)=>{
                    if(!err){
                        res.redirect(`/${listName}`)
                    }
                })
            }
        }
    })


})

app.get("/about", (req,res)=>{
    res.render("about")
})

app.listen(port, ()=>{
    console.log("This server is running on port",port);
});