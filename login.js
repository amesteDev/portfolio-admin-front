const output = document.getElementById('output');
const getUrl = 'https://ameste.se/api/index.php';
const admUrl = 'https://ameste.se/api/admin.php';
const imgUrl = 'https://ameste.se/api/imgupl.php';
const me = ['GET', 'POST', 'PUT', 'DELETE'];
let authHeader = ''

//function to handle calls to the api
const apiCall = async(url, info, methodToUse, bodyData) => {
    if (methodToUse !== 'GET') {
        return fetch(url, {
                method: methodToUse,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authHeader,
                },
                body: JSON.stringify(bodyData),
            })
            .then(response => response.json())
    } else {
        return fetch(url + '?table=' + info)
            .then(response => response.json())
    }
}

//displays the login-prompt on the page.
const setLoginBox = () => {
    output.innerHTML = `<div class="loginwrap">
	<form method="POST" action="" id="login-form">
		<label for="username"> username
			</label>
		<input type="text" id="username" class="username" name="username">
		<label for="password"> password
						</label>
		<input type="password" id="password" class="password" name="password">

		<input type="submit" value="Logga in" text="login">
	</form>
	</div>`

    const formEle = document.getElementById('login-form');

    formEle.addEventListener('submit', async(event) => {
        let dataSet = {};
        let i = 0;
        event.preventDefault();
        while (i < formEle.length) {
            dataSet[formEle[i].classList.value] = formEle[i].value;
            i++;
        }
        dataSet['meth'] = 'LOGIN';
        await login(dataSet)
    })
}

//function to handle the login-call
const login = async(datas) => {
        await fetch('https://ameste.se/api/admlogin.php', {
                method: 'POST',
                body: JSON.stringify(datas)
            })
            .then(response => response.json())
            .then((data => {
                if (data.message == 'fail') {
                    window.alert('Felatkiga uppgifter, prova igen!');
                    sessionStorage.clear();
                } else {
                    sessionStorage.setItem('token', data.jwt);
                    sessionStorage.setItem('expireAt', data.expireAt);
                    reload();
                }
            }));
    }
    //function to check if the call is made while logged in
const checklogin = async() => {
    let dataSet = { 'meth': 'CHECK' };
    authHeader = sessionStorage.token;
    return fetch('https://ameste.se/api/admlogin.php', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer ' + authHeader
            },
            body: JSON.stringify(dataSet)
        })
        .then(response => {
            if (response.status == 401) {
                return false;
            } else {
                return true;
            }
        })
}

//fill the page with info to administrate
//this is the main content of the admin-page that is displayed when logged in
const changeAdd = async(table) => {
        let add = document.getElementById('add');
        add.innerHTML = "<button id='addbtn'>Lägg till</button>";

        await apiCall(getUrl, table, me[0])
            .then(msg => msg.map(crs => {
                add.insertAdjacentHTML('beforeend', `<div id="num${crs.id}"></div>`);
                let thisAdd = document.getElementById(`num${crs.id}`);
                for (const [key, value] of Object.entries(crs)) {
                    thisAdd.insertAdjacentHTML('beforeend', `<p>${key}: ${value}</p>
				`)
                };
                //adds buttons and eventlisteners to the buttons
                thisAdd.insertAdjacentHTML('beforeend', `<button id="update${crs.id}">Uppdatera</button><br /><button id="delete${crs.id}">Ta bort</button>`)
                let upd = document.getElementById(`update${crs.id}`);
                upd.addEventListener('click', () => { openUpdateDialog(crs) });
                let del = document.getElementById(`delete${crs.id}`);
                del.addEventListener('click', () => { openDelDialog(crs) });
            }))
        let addbtn = document.getElementById('addbtn');
        addbtn.addEventListener('click', () => { openAddDialog() })

    }
    //open the dialog to delete things
const openDelDialog = (inData) => {
        let dialog = document.getElementById('wrapperModal');
        dialog.style.display = "block";
        let close = document.getElementById('closeModal');
        close.onclick = () => {
            dialog.style.display = 'none';
        }
        document.onclick = function(event) {
            if (event.target == dialog) {
                dialog.style.display = "none";
            }
        }
        let delform = document.getElementById('delform');
        delform.innerHTML = '<input type="submit" value="Ta bort!" id="delbtn"> <h3>Vill du ta bort följande data:</h3>';
        delform.addEventListener('submit', (event) => {
            event.preventDefault();
            delThing(inData.id);
        })
        for (const [key, value] of Object.entries(inData)) {
            delform.insertAdjacentHTML('beforeend',
                `
			<h4>${key}</h4>
			<p>${value}</p>	
		`)
        };
    }
    //fills the dialogbox with the data that is to be updated
const fillDialog = (inData) => {
        let updform = document.getElementById('updateform');
        updform.innerHTML = '<input type="submit" value="Skicka!" id="updatebtn">';
        for (const [key, value] of Object.entries(inData)) {
            if (key == 'img') {
                updform.insertAdjacentHTML('beforeend',
                    `
	<label for="${key}">Välje en bild:</label>
	<input type="file" name="${key}" class="${value}" id="${key}">
	`)
            } else {
                updform.insertAdjacentHTML('beforeend',
                    `
		<label for="${key}">${key}</label>
		<textarea type="text" name="${key}" id="${key}">${value}</textarea>		
		`)
            }
        };
    }
    //opens the updatedialog and uses the above function to fill it
const openUpdateDialog = (inData) => {
        let dialog = document.getElementById('wrapperModal');
        dialog.style.display = "block";
        let close = document.getElementById('closeModal');
        close.onclick = () => {
            dialog.style.display = 'none';
        }
        document.onclick = function(event) {
            if (event.target == dialog) {
                dialog.style.display = "none";
            }
        }
        fillDialog(inData);
    }
    //opens and fills the dialog for adding things
const openAddDialog = async() => {
        let dialog = document.getElementById('wrapperModal');
        dialog.style.display = "block";
        let close = document.getElementById('closeModal');
        close.onclick = () => {
            dialog.style.display = 'none';
        }
        document.onclick = function(event) {
            if (event.target == dialog) {
                dialog.style.display = "none";
            }
        }
        let updform = document.getElementById('addform');
        let table = document.getElementById('table');
        updform.innerHTML = '<input type="submit" value="Skicka!" id="sendbtn">';
        await apiCall(getUrl, table.value, me[0])
            .then(data => {
                for (const [key, value] of Object.entries(data[0])) {
                    if (key == 'img') {
                        updform.insertAdjacentHTML('beforeend',
                            `
				<label for="${key}">Välje en bild:</label>
				<input type="file" name="${key}" class="${value}" id="${key}">
				`)
                    } else {
                        updform.insertAdjacentHTML('beforeend',
                            `
				<label for="${key}">${key}</label>
				<textarea type="text" name="${key}" id="${key}"></textarea>		
				`)
                    }
                };
            })
    }
    //this is ued to construct the data that is to be sent to the api
const constructData = (code) => {
    let i = 0;
    let dataSet = {};
    while (i < code.length) {
        if (code[i].nodeName == 'TEXTAREA') {
            dataSet[code[i].id] = code[i].innerText || code[i].value;
        }
        i++;
    }
    return dataSet;
}

//add eventlistener to the eventbutton to send the data to the api (updating post)
const updatebtn = document.getElementById('updateform');
updatebtn.addEventListener('submit', async(event) => {
        event.preventDefault();
        let datas = constructData(updatebtn);
        if (table.value == 'projs') {
            await uploadImg()
                .then(data => {
                    const callData = {...datas, 'img': data.path };
                    console.log(callData);
                    updateThing(callData);
                })
        } else {
            updateThing(datas);
        }

    })
    //add eventlistener to the eventbutton to send the data to the api (adding post)
const sendbtn = document.getElementById('addform');
sendbtn.addEventListener('submit', async(event) => {
    event.preventDefault();
    let datas = constructData(sendbtn);
    if (table.value == 'projs') {
        await uploadImg()
            .then(data => {
                const callData = {...datas, 'img': data.path };
                addThing(callData);
            })
    } else {
        addThing(datas);
    }
})

//call to delete chosen post from api
const delThing = async(datain) => {
        let table = document.getElementById('table');
        const callData = { 'table': table.value, 'id': datain }
        let data = await apiCall(admUrl, '', me[3], callData);
        alert(data.message);
        reload();
    }
    //call to update chosen post from api
const updateThing = async(datain) => {
        let table = document.getElementById('table');
        const callData = { 'table': table.value, ...datain }
        let data = await apiCall(admUrl, '', me[2], callData);
        alert(data.message);
        reload();
    }
    //call to add a post to api
const addThing = async(datain) => {
    let table = document.getElementById('table');
    const callData = { 'table': table.value, ...datain };
    let data = await apiCall(admUrl, '', me[1], callData);
    alert(data.message);
    reload();
}

const uploadImg = async() => {
        let input = document.getElementById('img');
        const formdata = new FormData();
        if (input.value == "") {
            //if no image is choosen, return the old path of the image already present
            return { 'path': input.className }
        } else {
            //return the response from the server containing the path
            formdata.append('img', input.files[0]);
            return fetch('https://ameste.se/api/imgupl.php', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + authHeader,
                    },
                    body: formdata
                })
                .then(response => response.json())
        }
    }
    //this is used to show the select-tag to be able to toggle what content is shown on the admin page.
const setAdminContent = () => {
    output.innerHTML = `
	<div class="add">
	
	<label for="table">Välj kategori:</label>
	<select name="table" id="table">
		<option value="projs">Projekt</option>
		<option value="edu">Utbildning</option>
		<option value="job">Jobb</option>
	</select>
	<br />
	<br />
		<div id="add"> </div>
	</div>
	`
    let table = document.getElementById('table')
    changeAdd(table.value);
    table.addEventListener('change', (event) => {
        changeAdd(event.target.value);
    });
}

const renderSite = async() => {
    let renderer = await checklogin();
    return (renderer ? setAdminContent() : setLoginBox());
}

const alert = (msg) => {
    window.alert(msg);
}
const reload = () => {
    window.location.reload(true);
}

window.onload = renderSite();