const express = require("express");
const app = express();
const multer  = require('multer')

const upload = multer({ dest: "uploads/" });
const path = require("path");
const fs = require("fs");
app.use(express.json());
const session = require("express-session");
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, 'uploads')))
app.use(upload.single("TodoPic"));
app.use(express.static("todoViews"));
// app.use(express.static("uploads"));

app.use(
  session({
    secret: "mainkyubtau",
    resave: false,
    saveUninitialized: true,
  })
  );
  app.set("view engine", "ejs");

app.get("/contact", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.redirect("/login");
    return;
  }
  // res.sendFile(__dirname + "/todoViews/contact.html");
  res.render("contact", {username:req.session.user.email});

});
app.get("/", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.redirect("/login");
    return;
  }
  // res.sendFile(__dirname + "/todoViews/index.html");
  res.render("index", {username:req.session.user.email});
});

app.get("/about", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.redirect("/login");
    return;
  }
  // res.sendFile(__dirname + "/todoViews/about.html");
  res.render("about", {username:req.session.user.email});

});

app.get("/todo", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.redirect("/login");
    return;
  }
  fs.readFile("abc.json", "utf-8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading data.json");
    } else {
      let todos = [];
      try {
        const todoData = JSON.parse(data); 
        const userEmail = req.session.user.email;
        todos = todoData[userEmail] || []; 
      } catch (parseError) {
        console.error(parseError);
      }
      res.render("todo", { username: req.session.user.email, data: todos});
    }
  });
  // res.sendFile(__dirname + "/todoViews/todo.html");
  // res.render("todo", {username:req.session.user.email});

});



app.post("/todo",  function (req, res) {
  // console.log(req.session);
  if (!req.session.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.session.user.email;
  const todoPic= req.file;
  // console.log(todoPic, req.body)
  console.log("TodoPic:", todoPic); 
  console.log("req.body:", req.body); 
  saveTodoInFile(req.body, email,  todoPic, function (err) {
    if (err) {
      res.status(500).send("error");
      return;
    }
    // res.status(200).send("Success");
    res.status(200).json({ message: "Todo saved successfully" });
  });
});

app.get("/todo-data", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }
  const email = req.session.user.email;
  readAllTodos(function (err, data) {
    if (err) {
      res.status(500).send("error");
      return;
    }
    res.status(200).json(data[email]);
  });
});

app.delete("/delete-todo/:id", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const todoId = req.params.id;
  const email = req.session.user.email;
  deleteTodoById(todoId, email, function (err) {
    if (err) {
      res.status(500).send("error");
      return;
    }
    res.status(200).send("success");
  });
});

app.patch("/update-todo/:id", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.status(401).send("Unauthorized");
    return;
  }

  const todoId = req.params.id;
  const updates = req.body.completed;
  const email = req.session.user.email;

  updateTodoById(todoId, updates, email, function (err) {
    if (err) {
      res.status(500).send("error");
      return;
    }
    res.status(200).send({ message: "Todo updated successfully" });
  });
});

app.get("/login", function (req, res) {
  if (req.session.isLoggedIn) {
    res.redirect("/");
    return;
  }
  // res.sendFile(__dirname + "/todoViews/login.html");
  res.render("login", {error: null});
});
app.get("/signup", function (req, res) {
  if (req.session.isLoggedIn) {
    res.redirect("/");
    return;
  }
  // res.sendFile(__dirname + "/todoViews/signup.html");
  res.render("signup", {error:null});

});
app.get("/invalid", function (req, res) {
  // res.sendFile(__dirname + "/todoViews/invalid.html");
  res.render("invalid");

});

app.get("/logout", function (req, res) {
  req.session.isLoggedIn = false;
  req.session.username = null;

  res.redirect("/login");
});

app.post("/login", function (req, res) {
  if (req.session.isLoggedIn) {
    res.redirect("/");
    return;
  }
  const email = req.body.username;
  const password = req.body.password;
  authenticateUser(email, password, (err, data) => {
    if (err) {
      console.log(err);
      res.render("invalid");
    } else {
      req.session.isLoggedIn = true;
      req.session.user = data;
      res.status(200).redirect("/");
    }
  });
});

app.post("/signup", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("/");
    return;
  }

  const email = req.body.email;
  const password = req.body.password;
  const confirm_password = req.body.confirm_password;
  
  const user = { email, password };
  // Check if the passwords match
  if (password !== confirm_password) {
    res.status(400).send("Passwords do not match.");
    return;
  }
  saveDetails(user, (err) => {
    if (err) {
      res.status(500).send("error, email already exist");
    } else {
      res.status(200);
      res.redirect("/login");
    }
  });
});
app.listen(3000, function () {
  console.log("server on port 3000");
});

function readAllTodos(callback) {
  fs.readFile("./abc.json", "utf-8", function (err, data) {
    if (err) {
      callback(err);
      return;
    }
    if (data.length == 0) {
      callback(null, {});
      return;
    }

    try {
      data = JSON.parse(data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}
function saveTodoInFile(todoData, email,todoPic, callback) {
  readAllTodos(function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    if (data[email] == undefined) {
      data[email] = [];
    }
    // console.log(todoData);
    const id = Date.now().toString();
    const completed = false;
    const todo = {
      ...todoData,
      id,
      completed,
      TodoPic:todoPic ? todoPic.path : null,
    };

    data[email].push(todo);

    fs.writeFile("./abc.json", JSON.stringify(data), function (err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null);
    });
  });
}

function deleteTodoById(id, email, callback) {
  readAllTodos(function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    const updatedTodos = data[email].filter((todo) => todo.id !== id);
    // console.log(data[email]);
    data[email] = updatedTodos;
    fs.writeFile("./abc.json", JSON.stringify(data), function (err) {
      if (err) {
        callback(err);
        return;
      }

      callback(null);
    });
  });
}

function updateTodoById(id, updates, email, callback) {
  readAllTodos(function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    if (!data[email]) {
      callback("User not found");
      return;
    }

    const updatedTodos = data[email].map((todo) => {
      if (todo.id === id) {
        // Merge the existing todo with updates
        return { ...todo, completed: updates };
      }
      return todo;
    });

    // Update the user's todo list
    data[email] = updatedTodos;

    fs.writeFile("./abc.json", JSON.stringify(data), function (err) {
      if (err) {
        callback(err);
        return;
      }

      callback(null);
    });
  });
}

function readAllUsers(callback) {
  fs.readFile("./usersDb.txt", "utf-8", function (err, data) {
    if (err) {
      callback(err);
    }

    if (data.length == 0) {
      data = "[]";
    }
    try {
      data = JSON.parse(data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

function authenticateUser(email, password, callback) {
  readAllUsers((err, data) => {
    if (err) {
      callback(err);
      return;
    } else {
      // console.log(data);
      // console.log(email, password);
      for (let i = 0; i < data.length; i++) {
        if (data[i].email == email && data[i].password == password) {
          callback(null, data[i]);
          return;
        }
      }
      callback("Invalid Credentials");
    }
  });
}

function saveDetails(user, callback) {
  readAllUsers((err, data) => {
    if (err) {
      callback(err);
      return;
    } else {
      for (let i = 0; i < data.length; i++) {
        if (data[i].email == user.email) {
          callback("Email already exists");
          return;
        }
      }
      data.push(user);
      fs.writeFile("usersDb.txt", JSON.stringify(data), (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      });
    }
  });
}
