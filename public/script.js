const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const messageDiv = document.getElementById('message');
const baseUrl = 'http://localhost:5000/api/tasks'; 

let currentGroup = 'ALL'; 

function getTasks(group = currentGroup) {
    let url = baseUrl;
    if (group !== 'ALL') {
        url += `/${group}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(tasks => {
            tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            const tbody = taskList.querySelector('tbody');
            tbody.innerHTML = '';

            tasks.forEach(task => {
                const row = tbody.insertRow();
                const descriptionCell = row.insertCell();
                const dueDateCell = row.insertCell();
                const groupCell = row.insertCell();
                const completedCell = row.insertCell();
                const actionsCell = row.insertCell();

                descriptionCell.textContent = task.description;
                dueDateCell.textContent = task.formattedDueDate;
                groupCell.textContent = task.task_group;

                const completedCheckbox = document.createElement('input');
                completedCheckbox.type = 'checkbox';
                completedCheckbox.checked = task.completed === 1; 
                completedCheckbox.addEventListener('change', () => {
                    toggleTaskCompletion(task.id, completedCheckbox.checked, task.formattedDueDate, task.description, task.task_group);
                    row.classList.toggle('completed', completedCheckbox.checked); 
                });
                completedCell.appendChild(completedCheckbox);
                if (task.completed) {
                    row.classList.add('completed'); 
                }

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => editTask(task));
                actionsCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteTask(task.id));
                actionsCell.appendChild(deleteButton);

                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
}


function filterTasks(group) {
    currentGroup = group;
    getTasks(group);
}


taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const dueDate = document.getElementById('dueDate').value;
    const group = document.getElementById('group').value;


    if (!description || !dueDate) {
        displayMessage('Prašome užpildyti visus laukus.', 'error');
        return;
    }

    fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description, dueDate, group })
    })
        .then(response => response.json())
        .then(newTask => {
            displayMessage('Užduotis sėkmingai pridėta.', 'success');
            getTasks();
            taskForm.reset();
        })
        .catch(error => {
            displayMessage('Klaida pridedant užduotį.', 'error');
            console.error('Error adding task:', error);
        });
});


function toggleTaskCompletion(id, completed, dueDate, description, task_group) {
    fetch(`${baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: completed ? 1 : 0, dueDate, description, task_group })
    })
        .then(response => response.json())
        .then(updatedTask => {
            console.log('Task updated:', updatedTask);
            getTasks(); 
        })
        .catch(error => console.error('Error updating task:', error));
}



async function editTask(task) {
    const modalHtml = await fetch('editModal.html').then(response => response.text());
    const editModal = document.createElement('div');
    editModal.classList.add('modal');
    editModal.innerHTML = modalHtml;
        
        editModal.querySelector('#editDescription').value = task.description;
        editModal.querySelector('#editDueDate').value = task.formattedDueDate;
        editModal.querySelector('#editGroup').value = task.task_group;
        editModal.querySelector('#completed').checked = task.completed;
        editModal.querySelector('#taskId').value = task.id;
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
        document.body.appendChild(editModal);
    

        editModal.querySelector('#saveEditBtn').addEventListener('click', () => {
            const newDescription = editModal.querySelector('#editDescription').value; // Get 
            const newDueDate = editModal.querySelector('#editDueDate').value;
            const newGroup = editModal.querySelector('#editGroup').value;
    
            fetch(`${baseUrl}/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: newDescription,
                    dueDate: newDueDate,
                    group: newGroup,
                    completed: editModal.querySelector('#completed').checked ? 1 : 0 
                }),
            })
            .then(response => response.json())
            .then(updatedTask => {
                displayMessage('Užduotis sėkmingai atnaujinta.', 'success'); 
                getTasks();
            })
            .catch(error => {
                displayMessage('Klaida atnaujinant užduotį.', 'error'); 
                console.error('Error updating task:', error);
            })
            .finally(() => {
                document.body.removeChild(editModal);
                document.body.removeChild(overlay);
            });
        });
        
        editModal.querySelector('#cancelEditBtn').addEventListener('click', () => {
            document.body.removeChild(editModal);
            document.body.removeChild(overlay);
        });
    }





function deleteTask(id) {
    fetch(`${baseUrl}/${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (response.ok) {
                displayMessage('Užduotis sėkmingai ištrinta.', 'success');
                getTasks();
            } else {
                displayMessage('Klaida trinant užduotį.', 'error');
                console.error('Error deleting task:', response.status);
            }
        })
        .catch(error => {
            displayMessage('Klaida trinant užduotį.', 'error');
            console.error('Error deleting task:', error);
        });
}


function displayMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type; 
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000); 
}


getTasks();