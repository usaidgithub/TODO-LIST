document.addEventListener('DOMContentLoaded', async() => {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('taskInput');

    addTaskBtn.addEventListener('click', async (e) => {
        const taskText = taskInput.value.trim();
        e.preventDefault()
        console.log(taskText)
        console.log('Button is clicked')
        if (taskText === '') {
            alert('Please enter a task');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/add_task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task: taskText }),
            });

            if (response.ok) {
                const result = await response.json();
                taskInput.value = '';
                location.reload();
            } else {
                console.error('Failed to add task');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
    const getResponse=await fetch('http://localhost:3000/get_records')
        if (!getResponse.ok) {
            throw new Error('Failed to fetch tasks');
        }
        const recordhtml=document.querySelector('.task_container')
        const tasks = await getResponse.json();
        tasks.forEach(record=>{
            const taskhtml=`
            <div class="expenses_records" data-id="${record.id}">
            <span>Record:${record.description}</span>
            <span>Date:${new Date(record.date).toLocaleString()}</span>
            <button class="edit_expenses">Edit</button>
            <button class="delete_expenses">Delete</button>
            </div>`
            recordhtml.innerHTML+=taskhtml
        })
        document.querySelectorAll('.delete_expenses').forEach(button=>{
            button.addEventListener('click',handleexpensesdeletion)
        })
        let closebutton1=document.getElementsByClassName('close-icon')[0]
        let modal1 = document.getElementsByClassName('form')[0];
        let category1=document.getElementById('id')
        document.querySelectorAll('.edit_expenses').forEach(button=>{
            button.addEventListener('click',(e)=>{
                const recordId=e.target.closest('.expenses_records').dataset.id
                console.log(`The record id for editing is ${recordId}`)
                modal1.style.display="block"
                category1.value=recordId
                e.preventDefault()
            })
        })
        closebutton1.addEventListener('click',(e)=>{
            modal1.style.display="none"
        })
        async function handleexpensesdeletion(event){
            const recordId=event.target.closest('.expenses_records').dataset.id
            console.log(`Record id from expenses table is ${recordId}`)
            await fetch(`http://localhost:3000/delete_record/${recordId}`,{
                method:'DELETE'
            }).then(response=>{
                if(response.ok){
                    event.target.closest('.expenses_records').remove()
                    showToast("Task deleted Successfully")
                }else{
                    console.log("Error in deleting expenses data")
                }
            }).catch(error=>{
                console.log("Error on fetching",error)
            })
        
        }
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
        
            document.body.appendChild(toast);
        
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 3000); // Adjust the timeout as needed
        }
        
});
