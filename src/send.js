const axios = require('axios');
const config = require('../config.json');
const fs = require('fs')

class Sender {
    constructor() {
        this.axios = axios;
        this.login = config.login;
        this.password = config.password;
        this.domain = config.domain;
        this.path = config.path
        this.sendReviews = (reviews) => {
            this.axios
                .post(this.domain+this.path, {
                reviews: reviews,
                meta_data: {
                    'login': this.login,
                    'password': this.password
                }
                })
                .then(res => {
                    console.log(res.data)
                    fs.readFile('/logs.txt', (err, data) => {
                        data = data || '' + '\n' + res.data + ' ' + Date.now();
                        fs.writeFile('./logs.txt', data, () => console.log("Ответ сервера записан в log"))
                    })
                })
                .catch(error => {
                    console.log(error.response.data.message);
                    fs.readFile('/logs.txt', (err, data) => {
                        data = data || '' + '\n' + error.response.data.message + ' ' + Date.now();
                        fs.writeFile('./logs.txt', data, () => console.log("Ответ сервера записан в log"))
                    })
                })
        }
    
    }
}

const sender = new Sender(axios, config);

module.exports = sender




    