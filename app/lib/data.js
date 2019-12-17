/**
 * CRUD operations
 * @author Vincent Audette
 * @version 12.19.01
 */

const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

pathLocation = (dir, file) => (
    lib.baseDir+dir+'/'+file+'.json'
);

lib.create = (dir, file, data, callback) => {
    //open the file for writting to it
    fs.open(pathLocation(dir,file), //the directory for data file
    'wx', // the permissions we want whien openning this file
    (err,fileDescriptor)=>{ // the callback
        ! err && fileDescriptor 
        ? fs.writeFile(fileDescriptor, JSON.stringify(data),(err) => { 
            ! err 
            ? fs.close(fileDescriptor, (err) => callback(!err ? false: 'error closing new file'))
            : callback("error writing new file");
        })
        : callback('Could not create new file, it may exit already');
    });
}

lib.read = (dir, file, callback) => {
    fs.readFile(pathLocation(dir,file), 'utf8', (err,data)=> {
        ! err && data 
        ? callback(false, utils.parseJsonToObject(data))
        : callback(err, data);
    });
}

lib.update = (dir, file, data, callback) => {
    fs.open(pathLocation(dir,file),
    'r+',
    (err,fileDescriptor)=>{
        fs.ftruncate(fileDescriptor,(err)=>
        ! err 
        ? fs.write(fileDescriptor,JSON.stringify(data),(err)=> {
            ! err 
            ? fs.close(fileDescriptor,(err)=> callback(!err ? false:'error closing file'))
            : callback('error writing file');
        })
        : callback('error truncating file'))

    })

}

lib.delete =  (dir, file, callback) => {
    fs.unlink(pathLocation(dir,file), (err) => {
        callback(!err ? false : 'error deleting the file');
    })
}

module.exports = lib;