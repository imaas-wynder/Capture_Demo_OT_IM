# Capture_Demo_OT_IM
Test the OpenText Capture Service using this short tutorial

# Demo Application using OpenText Capture, Content Metadata and Content Storage API Services
This is a simple demo showcasing OpenText's Capture, Content Metadata and Content Storage Service APIs on OpenText Developer Cloud.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). This was combined with the OpenText IM Services API.

## This sample application demonstrates the following capabilities: 
 1. Using **Capture Service** to convert an image (invoice) into a text searchable pdf.
 2. Using **Content Storage Service** to uploading files to the content storage.
 3. Using Content **Metadata Service** to create a folder in the Content Storage, and adding metadata to the uploaded file.

## Deploying the Application
 1. Download the code from https://github.com/imaas-wynder/Capture_Demo_OT_IM
 2. Download and install the latest LTS version of **Node.js** from https://nodejs.org/. (You can also use Node Version Manager to manage multiple versions of Node).
 3. In the application root folder install the node libraries using the command 
	```
	npm install
	```

## Running the Application
 1. Before you run the application, update the **properties.js** file located in the ```src``` sub-folder.
 2. To run the application open a command line (terminal) and type the following command in the application root folder
	```
	npm start
	```
    Running this command will also open the application frontend in your default web browser.

## Interacting with the Application
This demo application has 7 steps:

 1. The first step is to fetch the **Access Token** from the Developer Cloud using the credentials in the properties.js file.
 2. Next we upload an image file (invoice) to the Capture staging area and receive a file id from the **Capture Service**.
 3. Next we invoke the **OCR** function of the Capture Service to convert the image into a text searchable pdf. Capture Service returns a new file id.
 4. Fourth step is to upload the newly created pdf to the Content Storage using the **Content Storage Service**. This time we recieve a file id from the Content Storage Service
 5. In the fifth step we use the **Content Metadata Service** to create a folder.
 6. In the sixth step we use the **Content Metadata Service** to add metadata to the pdf file.
 7. Lastly, we are able to download the pdf file from Content Storage using the file metadata id as reference.

