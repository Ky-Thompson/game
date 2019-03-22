const del = require('del');

module.exports.clean = () => del(['dist/**/*']);
