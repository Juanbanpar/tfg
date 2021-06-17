let csrfAmbiental = null;
let csrfAccess = null;

let refreshTime = 30000;
let timerAmbiental = null;
let timerGraphs = null;
let ambientalAddress = null;
let accessAddress = null;

let temp = 0;
let hum = 0;
let dust = 0;
let lum = 0;

let ref = 0;
let vent = 0;

let registersData = null;
let usersData = null;

function loginAmbiental(userid, password, callback) {
    return new Promise(function (fulfill, reject){
        let fetchLoginAmbiental = 'https://' + ambientalAddress + ':5000/login'
        fetch(fetchLoginAmbiental, {
            method: 'POST',
            body: JSON.stringify({
                iduser: userid.toString(),
                password: password.toString()
            }),
            headers: {
                "Content-type": "application/json"   
            },
            credentials: 'same-origin'
            })
        //.then(response => response.json())
        //.then(json => console.log(json))
        .then(function(response) {
            console.log(response);
            if (response.status == 200) {
                return response.json();
                //fulfill(fulfill);  
            } else {
                alert("Error inciando sesión en el sistema de control ambiental");
                reject("Error login in.");
            }
        })
        .catch(function(error) {
            console.log(error);
            alert("Fallo al conectar con el sistema de control ambiental, compruebe la dirección o si está operativo");
        })
        .then(data => {
            csrfAccess = data['csrf'];
            console.log(csrfAccess);
            fulfill(fulfill);
        })
    });
}

function loginAccess(userid, password, callback) {
    return new Promise(function (fulfill, reject){
        let fetchLoginAccess = 'https://' + accessAddress + ':5000/login'
        fetch(fetchLoginAccess, {
            method: 'POST',
            body: JSON.stringify({
                iduser: userid.toString(),
                password: password.toString()
            }),
            headers: {
                "Content-type": "application/json"   
            },
            credentials: 'same-origin'
            })
        //.then(response => response.json())
        //.then(json => console.log(json))
        .then(function(response) {
            console.log(response);
            if (response.status == 200) {
                return response.json();
                //fulfill(fulfill);     
            } else {
                alert("Error inciando sesión en el sistema de control de acceso");
                reject("Error login in.");
            }
        })
        .catch(function(error) {
            console.log(error);
            alert("Fallo al conectar con el sistema de control de acceso, compruebe la dirección o si está operativo");
        })
        .then(data => {
            csrfAccess = data['csrf'];
            console.log(csrfAccess);
            fulfill(fulfill);
        })
    });
}

function login(userid, password, callback) {
    return new Promise(function (fulfill, reject){
        let pLoginAccess = loginAccess(userid, password, callback);
        let pLoginAmbiental = loginAmbiental(userid, password, callback);
        Promise.all([pLoginAccess, pLoginAmbiental]).then(values => {
            fulfill(fulfill);
        }, reason => {
            console.log(reason)
            reject(reason);
        });
    });
}

function getRegisters() {
    return new Promise(function (fulfill, reject){
        let fetchAccess = 'https://' + accessAddress + ':5000/log'
        fetch(fetchAccess)
        .then(function(response) {
            if (response.status == 401) {
                document.querySelector('.header').style.display = 'none';
                document.querySelector('#page-login').style.display = 'block';
                document.querySelector('#page-main').style.display = 'none';
                document.querySelector('#page-access').style.display = 'none';
                
                reject("Error inciando sesión o sesión expirada");
            } else {
                return response.json();
            }
        })
        //.then(response => response.json())
        .then(data => {
            console.log(data);
            //registersData = data;
            var ul = document.getElementById("registers-list");
            ul.innerHTML = "";
            for (i = data.length - 1; i >= 0; i--) {
                var li = document.createElement('li');
                li.setAttribute("id", "log");
                
                var userfk = document.createElement('h3');
                var userfkNode = document.createTextNode("ID de usuario: " + data[i]['user_fk']);
                userfk.appendChild(userfkNode);
                
                var idaccess = document.createElement('p');
                var idaccessNode = document.createTextNode("ID del acceso: " + data[i]['idaccess']);
                idaccess.appendChild(idaccessNode);
                
                var accesstime = document.createElement('p');
                var accesstimeNode = document.createTextNode("Fecha y hora: " + data[i]['accesstime']);
                accesstime.appendChild(accesstimeNode);
                
                li.appendChild(userfk);
                li.appendChild(idaccess);
                li.appendChild(accesstime);
                ul.appendChild(li);
            }
            
            fulfill(fulfill);
        })
        .catch(err => console.log(err))
    });
}

function getUsers() {
    return new Promise(function (fulfill, reject){
        let fetchAccess = 'https://' + accessAddress + ':5000/user'
        fetch(fetchAccess)
        .then(function(response) {
            if (response.status == 401) {
                document.querySelector('.header').style.display = 'none';
                document.querySelector('#page-login').style.display = 'block';
                document.querySelector('#page-main').style.display = 'none';
                document.querySelector('#page-access').style.display = 'none';
                
                reject("Error inciando sesión o sesión expirada");
            } else {
                return response.json();
            }
        })
        //.then(response => response.json())
        .then(data => {
            console.log(data);
            //usersData = data;
            
            var ul = document.getElementById("users-list");
            ul.innerHTML = "";
            for (i = data.length - 1; i >= 0; i--) {
                var li = document.createElement('li');
                li.setAttribute("id", "log");
                
                var iduser = document.createElement('h3');
                var iduserNode = document.createTextNode("ID de usuario: " + data[i]['iduser']);
                iduser.appendChild(iduserNode);
                
                var name = document.createElement('p');
                var nameNode = document.createTextNode("Nombre: " + data[i]['name']);
                name.appendChild(nameNode);
                
                var lastname1 = document.createElement('p');
                var lastname1Node = document.createTextNode("Primer apellido: " + data[i]['lastname1']);
                lastname1.appendChild(lastname1Node);
                
                var lastname2 = document.createElement('p');
                var lastname2T = data[i]['lastname2'];
                var lastname2Node = document.createTextNode("Segundo apellido: " + lastname2T);
                
                if(lastname2T != null) {
                    lastname2.appendChild(lastname2Node);
                }
                
                var privilege = document.createElement('p');
                var privilegeNode = document.createTextNode("Permiso: " + data[i]['current_privilege']);
                privilege.appendChild(privilegeNode);
                
                var idcard = document.createElement('p');
                var idcardNode = document.createTextNode("ID de la tarjeta: " + data[i]['idcard']);
                idcard.appendChild(idcardNode);
                
                li.appendChild(iduser);
                li.appendChild(name);
                li.appendChild(lastname1);
                if(lastname2T != null) {
                    li.appendChild(lastname2);
                }
                li.appendChild(privilege);
                li.appendChild(idcard);
                
                ul.appendChild(li);
            }
            
            fulfill(fulfill);
        })
        .catch(err => console.log(err))
    });
}

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {    
    
    //Login method
    const loginForm = document.getElementById("login-form");
    document.getElementById("login-form-submit").addEventListener("click", (e) => {
        e.preventDefault();
        ambientalAddress = loginForm.ambientalAddress.value;
        accessAddress = loginForm.accessAddress.value;
        const userid = loginForm.userid.value;
        const password = loginForm.password.value;
       
        login(userid, password)
        .then(function() {
            document.querySelector('.header').style.display = 'block';
            document.querySelector('#page-login').style.display = 'none';
            document.querySelector('#page-main').style.display = 'block';
            
            document.getElementById("a-ambiental").addEventListener("click", (e) => {
                document.querySelector('#page-main').style.display = 'block';
                document.querySelector('#page-access').style.display = 'none';
            })
            document.getElementById("a-access").addEventListener("click", (e) => {
                getRegisters();
                getUsers();
                
                document.querySelector('#page-main').style.display = 'none';
                document.querySelector('#page-access').style.display = 'block';
            })
            
            document.getElementById("gauges-button").addEventListener("click", (e) => {
                document.querySelector('#graphs-tab').style.display = 'none';
                document.querySelector('#gauges-tab').style.display = 'block';
                
                var current = document.getElementsByClassName("btnMonitorTab active");
                current[0].className = current[0].className.replace(" active", "");
                
                var newTab = document.getElementById("gauges-button");
                newTab.className += " active";
            })
            document.getElementById("graphs-button").addEventListener("click", (e) => {
                document.querySelector('#gauges-tab').style.display = 'none';
                document.querySelector('#graphs-tab').style.display = 'block';
                
                var current = document.getElementsByClassName("btnMonitorTab active");
                current[0].className = current[0].className.replace(" active", "");
                
                var newTab = document.getElementById("graphs-button");
                newTab.className += " active";
            })
            
            document.getElementById("registers-button").addEventListener("click", (e) => {
                getRegisters();
                
                document.querySelector('#users-tab').style.display = 'none';
                document.querySelector('#registers-tab').style.display = 'block';
                
                var current = document.getElementsByClassName("btnAccessTab active");
                current[0].className = current[0].className.replace(" active", "");
                
                var newTab = document.getElementById("registers-button");
                newTab.className += " active";
            })
            document.getElementById("users-button").addEventListener("click", (e) => {
                getUsers();
                
                document.querySelector('#registers-tab').style.display = 'none';
                document.querySelector('#users-tab').style.display = 'block';
                
                var current = document.getElementsByClassName("btnAccessTab active");
                current[0].className = current[0].className.replace(" active", "");
                
                var newTab = document.getElementById("users-button");
                newTab.className += " active";
            })
            
            document.getElementById("btn-minus1").addEventListener("click", (e) => {
                var x = document.getElementById("id_form-1-quantity");
                if(x.value > 1) x.value = parseInt(parseInt(x.value) - 1);
            })
            document.getElementById("btn-add1").addEventListener("click", (e) => {
                var x = document.getElementById("id_form-1-quantity");
                x.value = parseInt(parseInt(x.value) + 1);
            })
            document.getElementById("btnSet").addEventListener("click", (e) => {
                var x = document.getElementById("id_form-1-quantity");
                if (parseInt(x.value) > 0) {
                    refreshTime = parseInt(parseInt(x.value) * 1000);
                    console.log(refreshTime);
                    
                    clearInterval(timerGraphs)
                    clearInterval(timerAmbiental);
                    timerGraphs = window.setInterval(updateCharts, refreshTime);
                    timerAmbiental = setInterval(getAmbientalData, refreshTime);
                } else {
                    alert("Introduzca un valor válido");
                }
            })
            
                
            //Gauges
            var Gauge = window.Gauge;

            //Temperature gauge
            var tempGauge = Gauge(document.getElementById("temp"), {
                max: 40,
                dialStartAngle: 180,
                dialEndAngle: 0,
                value: 20,
                label: function(value) {
                    let ret = Math.round(value * 100) / 100;
                    ret += "\nºC";
                    return ret;
                },
                // Custom dial colors (Optional)
                color: function(value) {
                    if(value < 23) {
                        return "#5ee432"; // green
                    }else if(value < 27) {
                        return "#fffa50"; // yellow
                    }else if(value < 30) {
                        return "#f7aa38"; // orange
                    }else {
                        return "#ef4655"; // red
                    }
                }
            });
            tempGauge.setValue(0);
            
            //Humidity gauge
            var humGauge = Gauge(document.getElementById("hum"), {
                max: 100,
                dialStartAngle: 180,
                dialEndAngle: 0,
                value: 50,
                label: function(value) {
                    let ret = Math.round(value * 100) / 100;
                    ret += "\n%";
                    return ret;
                },
                // Custom dial colors (Optional)
                color: function(value) {
                    if(value < 20) {
                        return "#5ee432"; // green
                    }else if(value < 40) {
                        return "#fffa50"; // yellow
                    }else if(value < 60) {
                        return "#f7aa38"; // orange
                    }else {
                        return "#ef4655"; // red
                    }
                }
            });
            humGauge.setValue(0);
            
            //Dust gauge
            var dustGauge = Gauge(document.getElementById("dust"), {
                max: 300,
                dialStartAngle: 180,
                dialEndAngle: 0,
                value: 75,
                label: function(value) {
                    let ret = Math.round(value * 100) / 100;
                    ret += "\nmg/m3";
                    return ret;
                },
                // Custom dial colors (Optional)
                color: function(value) {
                    if(value < 40) {
                        return "#5ee432"; // green
                    }else if(value < 55) {
                        return "#fffa50"; // yellow
                    }else if(value < 60) {
                        return "#f7aa38"; // orange
                    }else {
                        return "#ef4655"; // red
                    }
                }
            });
            dustGauge.setValue(0);
            
            //Luminosity gauge
            var lumGauge = Gauge(document.getElementById("lum"), {
                max: 100,
                dialStartAngle: 180,
                dialEndAngle: 0,
                value: 50,
                label: function(value) {
                    let ret = Math.round(value * 100) / 100;
                    ret += "\n%";
                    return ret;
                },
                // Custom dial colors (Optional)
                color: function(value) {
                    if(value < 35) {
                        return "#5ee432"; // green
                    }else if(value < 75) {
                        return "#fffa50"; // yellow
                    }else if(value < 90) {
                        return "#f7aa38"; // orange
                    }else {
                        return "#ef4655"; // red
                    }
                }
            });
            lumGauge.setValue(0);
            
            //Refrigeration gauge
            var refGauge = Gauge(document.getElementById("ref"), {
                max: 100,
                dialStartAngle: 180,
                dialEndAngle: 0,
                value: 50,
                label: function(value) {
                    let ret = Math.round(value * 100) / 100;
                    ret += "\n%";
                    return ret;
                },
                // Custom dial colors (Optional)
                color: function(value) {
                    if(value < 20) {
                        return "#5ee432"; // green
                    }else if(value < 40) {
                        return "#fffa50"; // yellow
                    }else if(value < 60) {
                        return "#f7aa38"; // orange
                    }else {
                        return "#ef4655"; // red
                    }
                }
            });
            refGauge.setValue(0);
            
            //Ventilation gauge
            var ventGauge = Gauge(document.getElementById("vent"), {
                max: 100,
                dialStartAngle: 180,
                dialEndAngle: 0,
                value: 50,
                label: function(value) {
                    let ret = Math.round(value * 100) / 100;
                    ret += "\n%";
                    return ret;
                },
                // Custom dial colors (Optional)
                color: function(value) {
                    if(value < 20) {
                        return "#5ee432"; // green
                    }else if(value < 40) {
                        return "#fffa50"; // yellow
                    }else if(value < 60) {
                        return "#f7aa38"; // orange
                    }else {
                        return "#ef4655"; // red
                    }
                }
            });
            ventGauge.setValue(0);
            
            
            
            var dataTemp = []            
            var optionsTemp = {
                series: [{
                data: dataTemp.slice()
            }],
                chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
              
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Temperatura',
                align: 'left'
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'category',
            },
            yaxis: {
                max: 40
            },
            legend: {
                show: false
            },
            };

            var chartTemp = new ApexCharts(document.querySelector("#chart-temp"), optionsTemp);
            chartTemp.render();
            
            var dataHum = []            
            var optionsHum = {
                series: [{
                data: dataHum.slice()
            }],
                chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
              
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Humedad',
                align: 'left'
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'category',
            },
            yaxis: {
                max: 100
            },
            legend: {
                show: false
            },
            };

            var chartHum = new ApexCharts(document.querySelector("#chart-hum"), optionsHum);
            chartHum.render();
            
            var dataDust = []            
            var optionsDust = {
                series: [{
                data: dataDust.slice()
            }],
                chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
              
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Partículas PM2.5',
                align: 'left'
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'category',
            },
            yaxis: {
                max: 300
            },
            legend: {
                show: false
            },
            };

            var chartDust = new ApexCharts(document.querySelector("#chart-dust"), optionsDust);
            chartDust.render();
            
            var dataLum = []            
            var optionsLum = {
                series: [{
                data: dataLum.slice()
            }],
                chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
              
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Luminosidad',
                align: 'left'
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'category',
            },
            yaxis: {
                max: 100
            },
            legend: {
                show: false
            },
            };

            var chartLum = new ApexCharts(document.querySelector("#chart-lum"), optionsLum);
            chartLum.render();
            
            var dataRef = []            
            var optionsRef = {
                series: [{
                data: dataRef.slice()
            }],
                chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
              
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Refrigeración',
                align: 'left'
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'category',
            },
            yaxis: {
                max: 100
            },
            legend: {
                show: false
            },
            };

            var chartRef = new ApexCharts(document.querySelector("#chart-ref"), optionsRef);
            chartRef.render();
            
            var dataVent = []            
            var optionsVent = {
                series: [{
                data: dataVent.slice()
            }],
                chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
              
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Ventilación',
                align: 'left'
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'category',
            },
            yaxis: {
                max: 100
            },
            legend: {
                show: false
            },
            };

            var chartVent = new ApexCharts(document.querySelector("#chart-vent"), optionsVent);
            chartVent.render();
            
            timerGraphs = window.setInterval(updateCharts, refreshTime);
            function updateCharts() {
                let current = new Date();
                let hours = current.getHours();
                if(hours < 10) hours = "0" + hours.toString();
                let minutes = current.getMinutes();
                if(minutes < 10) minutes = "0" + minutes.toString();
                let seconds = current.getSeconds();
                if(seconds < 10) seconds = "0" + seconds.toString();
                
                let time = hours + ":" + minutes + ":" + seconds;
                
                dataTemp.push({
                    x: time,
                    y: temp
                })
                dataHum.push({
                    x: time,
                    y: hum
                })
                dataDust.push({
                    x: time,
                    y: dust
                })
                dataLum.push({
                    x: time,
                    y: lum
                })
                dataRef.push({
                    x: time,
                    y: ref
                })
                dataVent.push({
                    x: time,
                    y: vent
                })
                
                if (dataTemp.length > 10) {
                    dataTemp.shift()
                }
                if (dataHum.length > 10) {
                    dataHum.shift()
                }
                if (dataDust.length > 10) {
                    dataDust.shift()
                }
                if (dataLum.length > 10) {
                    dataLum.shift()
                }
                if (dataRef.length > 10) {
                    dataRef.shift()
                }
                if (dataVent.length > 10) {
                    dataVent.shift()
                }
                
                chartTemp.updateSeries([{
                    data: dataTemp
                }])
                chartHum.updateSeries([{
                    data: dataHum
                }])
                chartDust.updateSeries([{
                    data: dataDust
                }])
                chartLum.updateSeries([{
                    data: dataLum
                }])
                chartRef.updateSeries([{
                    data: dataRef
                }])
                chartVent.updateSeries([{
                    data: dataVent
                }])
            }
            
            //Temporizador para obtener los datos ambientales
            timerAmbiental = setInterval(getAmbientalData, refreshTime);
            function getAmbientalData() {
                return new Promise(function (fulfill, reject){
                    let fetchAmbiental = 'https://' + ambientalAddress + ':5000/data'
                    fetch(fetchAmbiental)
                    .then(function(response) {
                        if (response.status == 401) {
                            document.querySelector('.header').style.display = 'none';
                            document.querySelector('#page-login').style.display = 'block';
                            document.querySelector('#page-main').style.display = 'none';
                            document.querySelector('#page-access').style.display = 'none';
                            
                            reject("Error inciando sesión o sesión expirada");
                        } else {
                            return response.json();
                        }
                    })
                    //.then(response => response.json())
                    .then(data => {
                        console.log(data);
                        
                        temp = data['temperature'];
                        hum = data['humidity'];
                        dust = data['dust'];
                        lum = data['luminosity'];
                        
                        ref = data['refrigeration'];
                        vent = data['ventilation'];
                        
                        tempGauge.setValueAnimated(data['temperature'], 1);
                        humGauge.setValueAnimated(data['humidity'], 1);
                        dustGauge.setValueAnimated(data['dust'], 1);
                        lumGauge.setValueAnimated(data['luminosity'], 1);
                        
                        refGauge.setValueAnimated(data['refrigeration'], 1);
                        ventGauge.setValueAnimated(data['ventilation'], 1);
                    })
                    .catch(err => console.log(err))
                });
            }
            //clearInterval(timerAmbiental);
            
            document.getElementById("refresh-registers").addEventListener("click", (e) => {
                getRegisters();
            })
            
            document.getElementById("refresh-users").addEventListener("click", (e) => {
                getUsers();
            })
            
            document.getElementById("upload-file").addEventListener("click", (e) => {
                e.preventDefault();
                let faces = document.getElementById("faces-file").files[0];
                let formData = new FormData();
        
                formData.append("the_file", faces);
                                                                    
                let fetchAccess = 'https://' + accessAddress + ':5000/encodings';
                return new Promise(function (fulfill, reject){
                    fetch(fetchAccess, {
                        method: "POST", 
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-TOKEN": csrfAccess
                        },
                        body: formData
                    })
                    .then(function(response) {
                        if (response.status == 200) {
                            alert("Codificaciones del reconocimiento facial actualizadas.");
                            fulfill(fulfill);
                        } else {
                            alert("Error actualizando el fichero de codificaciones del reconocimiento facial.");
                            reject("Error updating pickle file");
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                        alert("Fallo al conectar con el sistema de control de acceso, compruebe la dirección o si está operativo");
                    })
                });
            })
            
            
        })
        .catch(err => console.log(err));
        
    })

}
