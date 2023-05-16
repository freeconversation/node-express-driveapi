# Google drive interface using Nodejs and express

---
## Configure Google Drive environment

Before access to any content, you will need to create a project on your google drive account and enable the service. You can follow this [link](https://developers.google.com/drive/api/quickstart/nodejs?hl=es-419#set_up_your_environment)


You will also need to create an Oauth ID for your app, and allow some services from the platform. You can follow the [official docs](https://developers.google.com/drive/api/quickstart/nodejs?hl=es-419#authorize_credentials_for_a_desktop_application)

For this app you will need 4 services allowed:
* `https://www.googleapis.com/auth/drive`
* `https://www.googleapis.com/auth/drive.file`
* `https://www.googleapis.com/auth/drive.readonly`
* `https://www.googleapis.com/auth/drive.activity.readonly`

Once you follow this steps, you will get a file called `credentials.json`. Download this file to the folder you've configured as `SECRET_PATH`in your `.env`file, default is `/secure`.

##### WARNING!

**You will need to add the url callback to your `credentials.json` to be able to ask users to authorize app!**
Example `credentials.json`
~~~~
{
  "web": {
    "redirect_uris":["http://localhost:3000/oauth2callback"],
    "client_id": "your if",
    "project_id": "your project name",
    "auth_uri": "",
    "token_uri": "",
    "auth_provider_x509_cert_url": """
    "client_secret": ""
  }
}

~~~~


>Note: You can use the `.env`sample on the repo called `example.env`, just delete `example`

## Installing locally

Clone the repo using:

~~~~
git clone https://github.com/freeconversation/node-express-driveapi.git
~~~~

Navigate to root folder and install all the packages with:

~~~~
npm install
~~~~

## Running App

In development mode the app uses [nodemon](https://nodemon.io/) which will reload the app after every change on the source code. Run it using:
~~~~
npm run dev
~~~~
To run the project in production use:
~~~~
npm run start
~~~~

You terminal shoul show `app listening on port XXXX`, where XXXX is the port number configured on `.env.APP_PORT`, default is 9000

---

## Routes
>Note: The first time on one of the routes in the app you will be prompted to allow the app access to your drive, and a `token.json` will be saved on your `.env.SECRET_PATH` folder
### List Drive elements

To list all the elements on your drive:
~~~
GET http://localhost:9000/drive/list
~~~

You can also use parameter name to filter by filename:

~~~~
GET http://localhost:9000/drive/list?name=docName
~~~~

### Download Drive element

Once you get the element ID, you can download it using the following endpoint:

~~~~
GET http://localhost:9000/drive/download/{elementID}?fileName={filename.extension}
~~~~

You should provide the element id on the URL and the file name that will have on your local system.

>Note: The downloads will be stored in a `/downloads` folder inside the assets path configured in `.env.ASSETS`, default is `/assets`

### Export Drive element

Once you get the element ID, you can download it using the following endpoint:

~~~~
GET http://localhost:9000/drive/export/{elementID}?fileName={filename.extension}
~~~~

You should provide the element id on the URL and the file name that will have on your local system.

>Note: The downloads will be stored in a `/exports` folder inside the assets path configured in `.env.ASSETS`, default is `/assets`

### Changes Control

To check the changes and its details on drive unit you can use the following endpoint:
~~~~
GET http://localhost:9000/drive/changes
~~~~

