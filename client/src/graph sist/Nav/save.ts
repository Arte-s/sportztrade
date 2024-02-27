/// <reference path="./jquery/index.d.ts" />

//import * as jQuery from 'jquery';

//import * as $ from './jquery';

//import * as $ from "./jquery-3.5.1.min";

const moduleFile= import.meta.url;
const dir= moduleFile.substr(0, moduleFile.lastIndexOf("/"));
const url= dir+"/save.php"


export async function Save(key :string, value :string) : Promise<boolean>  //,  div : HTMLElement
{
	let ok= false;
	await $.ajax({
		url: url,
		type: 'POST',
		data: {
			key: key,
			value: value
		},
		success: function(result)  { ok= result==1;  if (!ok) console.log(result); },  //div.innerHTML= result;  },
		error: function(data) { ok= false;  console.error(data.responseText);  } // if (div) div.innerHTML= data.responseText; }// console.error(data.responseText); }
	});
	return ok;
}


export async function Load(key :string) : Promise<string|null>
{
	let value :string|null = null;

	await $.ajax({
		url: url,
		type: 'POST',
		data: {
			key: key
		},
		success: function(result) { value = result!=null ? result+"" : null; },

		error: function(data) { console.error(data.responseText); }
	});
	return value;
}