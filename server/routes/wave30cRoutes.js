'use strict';
const {createWave30cRouter}=require('./wave30c');
const auth=require('../middleware/authenticate');
const pool=require('../db');
async function loadRecords(){ const r=await pool.query('SELECT id,title,genre,status,synopsis,author FROM comic_stories ORDER BY created_at DESC LIMIT 200'); return r.rows; }
module.exports=createWave30cRouter({auth,loadRecords,features:["story-arc-summary", "panel-pacing-check", "character-consistency-flags"],searchFields:['title','synopsis','author','name']});
