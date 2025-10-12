import express from "express";
import bodyParser from 'body-parser';
import pg from 'pg';
import ejs from 'ejs';

const server = express();
server.use(bodyParser.urlencoded({extended:true}));
server.use(express.static('public'));

