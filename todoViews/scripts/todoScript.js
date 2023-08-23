const submitTodoNode = document.getElementById("submitTodo");
const userInputNode=document.getElementById("userInput");
const priortySelectorNode=document.getElementById("prioritySelector");
const todosContainerNode = document.getElementById("todosContainer");
const pictureSelector=document.getElementById("TodoPic");



submitTodoNode.addEventListener("click", function(){
    const todoText=userInputNode.value;
    const priority=priortySelectorNode.value;
    const picture=pictureSelector.files[0];

    if(!todoText || !priority){
        alert("please enter the required input ");
        return;
    }
    const formData = new FormData();
    formData.append("todoText", todoText);
    formData.append("priority", priority);
    formData.append("TodoPic", picture );


    fetch("/todo",{
        method: "POST",
        body: formData,
      })
    .then((response) => response.json())
      .then((data) => {
        // Reload the page to update the todo list
        location.reload(true);
      })
      .catch((error) => {
        console.error("Error adding todo:", error);
      });
});



  function deleteTodo(id) {
    // Send a DELETE request to the server to delete the todo
    fetch(`/delete-todo/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.text())
      .then((data) => {
        // Remove the deleted todo from the client-side todo list
        const todoItemDiv = document.getElementById(id).parentElement;
        todoItemDiv.remove();
      })
      .catch((error) => {
        console.error("Error deleting todo:", error);
      });
  }

  
  function updateStatus(id) {
    const checkbox = document.getElementById(id);

    // Send a PATCH request to the server to update the todo status
    fetch(`/update-todo/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: checkbox.checked,
      }),
    })
      .then((response) => response.text())
      .then((data) => {
        // Update the todo status on the client side
        const todoTextNode = checkbox.parentElement.querySelector("span");
        if (checkbox.checked) {
          todoTextNode.style.textDecoration = "line-through";
        } else {
          todoTextNode.style.textDecoration = "none";
        }
      })
      .catch((error) => {
        console.error("Error updating todo status:", error);
      });
  }


