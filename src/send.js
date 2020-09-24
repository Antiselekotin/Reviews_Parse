const axios = require('axios');
const config = require('../config.json');

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
                })
                .catch(error => {
                    console.log(error.response.data.message);
                })
        }
    
    }
}

const sender = new Sender(axios, config);

module.exports = sender




    