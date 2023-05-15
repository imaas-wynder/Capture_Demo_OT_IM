import React from 'react';
import {properties} from './properties';

export default function App() {

  const [accessToken, setAccessToken] = React.useState()
  const [file, setFile] = React.useState({                        //image file object
    name: "",
    size: "",
    type: ""
  })                         
  const [capturedFileId, setCapturedFileId] = React.useState("")  //id of image file in Capture Service
  const [ocrResponse, setOCRResponse] = React.useState({          //response of OCR Service (value contains the id)
    resultItems: [{
      "files":[{
          "name":"",
          "value":"",
          "contentType":"",
          "src":"",
          "fileType":""
      }]    
    }]
  })
  const [pdfFile, setPdfFile] = React.useState({                //file blob retrieved from Capture Service
    size: "",
    type: ""
  })
  const [uploadedFile, setUploadedFile] = React.useState({      //response of file uploaded to Content Storage
    id: "",
    mimeType: "",
    size: ""
  })
  const [fileMetadata, setFileMetadata] = React.useState({
    id: "",
    name: "",
    mime_type: "",
    content_size: ""    
  })

  const [folderName, setFolderName] = React.useState("")
  const [folderId, setFolderId] = React.useState("")

  //Setting placeholder property for input fields to "Processing..."
  const [tokenPlaceholder, setTokenPlaceholder] = React.useState("Authentication Token Information")
  const [capFileIdPlaceholder, setCapFileIdPlaceholder] = React.useState("")
  const [ocrRespIdPlaceholder, setOcrRespIdPlaceholder] = React.useState("")
  const [uploadedFileIdPlaceholder, setUploadedFileIdPlaceholder] = React.useState("")
  const [retrieveStatus, setRetrieveStatus] = React.useState("")


  /**
   * Step 1 - getAuthToken() - Get Authentication Token from OCP
   */
  function getAuthToken() {
    setTokenPlaceholder("Processing...")

    const url = `${properties.base_url}/tenants/${properties.tenant_id}/oauth2/token`
    const requestOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            client_id: properties.client_id,
            client_secret: properties.client_secret,
            grant_type: "password",
            username: properties.username,
            password: properties.password
        })
    }

    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => setAccessToken(data.access_token))
      .catch(error => console.error("Error: ", error))
  }

  /**
   * Step 2A - handleFile() - Read the file selected by the user
   */
  function handleFile(event) {
    setFile(event.target.files[0])
  }
 
  /**
   * Step 2B - handleUpload() - Upload the file to Capture Service
   */
  function handleUpload() {
    setCapFileIdPlaceholder("Processing...")
    
    const url = `${properties.base_url}/capture/cp-rest/v2/session/files`
    const fetchOptions = {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json",
        'Accept-Language': "en-US",
        'Content-Type': file.type,
        'Content-Length': file.size
      },
      body: file
    }

    fetch(url, fetchOptions)
      .then(response => response.json())
      .then(data => setCapturedFileId(data.id))
      .catch(error => console.error("Error: ", error))
  }

  /**
   * Step 3 - createSearchablePDF() - Call OCR Service 
   */
  function createSearchablePDF() {
    setOcrRespIdPlaceholder("Processing...")
    const pdfFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
    const url = `${properties.base_url}/capture/cp-rest/v2/session/services/fullpageocr`
    const fetchOptions = {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json",
        'Accept-Language': "en-US",
        'Content-Type': "application/hal+json"
      },
      body: JSON.stringify({
        "serviceProps": [
          {"name": "Env","value": "D"},
          {"name": "OcrEngineName","value": "Advanced"}
          ],
        "requestItems": [
          {"nodeId": 1,"values": [
              {"name": "OutputType", "value": "pdf"}
            ],
            "files": [
              {"name": `${pdfFileName}`,
                "value": `${capturedFileId}`,
                "contentType": `${file.type}`
              }
            ]
          }
        ]
      })
    }
  
    fetch(url, fetchOptions)
      .then(response => response.json())
      .then(data => setOCRResponse(data))
      .catch(error => console.error("Error: ", error))
  }
  

  /**
   * Step 4A - retrieveFileFromCaptureService() - Retrieve PDF file blob from Capture Service
   */
  async function retrieveFileFromCaptureService() {
    setRetrieveStatus("Processing...")
    const captureUrl = `${properties.base_url}/capture/cp-rest/v2/session/files/${ocrResponse.resultItems[0].files[0].value}`
    const captureFetchOptions = {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': ocrResponse.resultItems[0].files[0].contentType
      }
    }

    const response = await fetch(captureUrl, captureFetchOptions)
    const blob = await response.blob()
    setPdfFile(blob)
    setRetrieveStatus("...Retrieved "+blob.size+" bytes")
  }

  /**
   * Step 4B - uploadFileToCSS() - upload File to Content Storage
   */
  async function uploadFileToCSS() {
    setUploadedFileIdPlaceholder("Processing...")

    const cssUrl =`${properties.css_url}/v2/tenant/${properties.tenant_id}/content`
    const cssFetchOptions = {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json",
        'Content-Type': pdfFile.type,
        'Content-Length': pdfFile.size 
      },
      body: pdfFile
    }

    const response = await fetch(cssUrl, cssFetchOptions)
    const data =  await response.json()
    setUploadedFile(data.entries[0])
  }

  /**
   * Step 5A - getFolderName(event) - Get folder name entered by the user
   */
  function getFolderName(event) {
    setFolderName(event.target.value)
    setFolderId("")
  }

  /**
   * Step 5B - createFolder() - Create new folder using CMS
   */
  async function createFolder() {
    //Ensure user has provided a folder name
    if (!folderName){
      alert("Please enter a folder name")
      return
    }

    //Lookup folder metadata in case user uses the same folder name
    const url = `${properties.base_url}/cms/instances/folder/cms_folder?include-total=true&filter=name%20eq%20%27${folderName}%27`

    const fetchOptions = {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json"
      }
    }

    const response = await fetch(url, fetchOptions)
    const data = await response.json()
    
    if (data.total > 0) {
      console.log("Folder already exists")
      setFolderId(data._embedded.collection[0].id)
    }

    //Create a new folder
    else {
      console.log("Creating a new folder")

      const url2 = `${properties.base_url}/cms/instances/folder/cms_folder`
      const fetchOptions2 = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', 
            'accept': 'application/hal+json'
          },
          body: JSON.stringify({
            "name": folderName,
            "display_name": folderName,
            "description": "Folder created for demo",
            "type": "cms_folder"
          })
      }
  
      const response2 = await fetch(url2, fetchOptions2)
      const data2 = await response2.json()

      setFolderId(data2.id)
    }
  }

  /**
   * Step 6 - createMetadataForFile() - Create metadata for PDF file
   */
  async function createMetadataForFile() {

    //Ensure user has created a folder
    if (!folderId){
      alert("Please create a folder before creating the file metadata")
      return
    }

    //Look up metadata for the file
    const pdfFileName = ocrResponse.resultItems[0].files[0].name + "." + ocrResponse.resultItems[0].files[0].fileType

    const url = `${properties.base_url}/cms/instances/file/cms_file?include-total=true&filter=name eq '${pdfFileName}' and parent_folder_id eq '${folderId}'&sortby=version_no asc`
    const fetchOptions = {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json"
      }
    }

    const response = await fetch(url, fetchOptions)
    const data = await response.json()

    if (data.total > 0) {
      console.log("Metadata  already exists. # of existing versions =",data.total)

      //Add file as new version
      const url2 = `${properties.base_url}/cms/instances/file/cms_file/${data._embedded.collection[data.total-1].id}/nextVersion`
      const fetchOptions2 = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json',
          'Content-Type': 'application/hal+json' 
        },
        body: JSON.stringify({
          "name": pdfFileName,
          "description": "PDF File created from OCR of uploaded image",
          "parent_folder_id": folderId,
          "renditions": [{
              "name": pdfFileName,
              "rendition_type": "primary",
              "blob_id": uploadedFile.id,
              "mime_type": uploadedFile.mimeType
            }]          
        })
      }

      const response2 = await fetch(url2, fetchOptions2)
      const data2 = await response2.json()
      console.log("Created version #",data2.version_no)
      setFileMetadata(data2)
    }

    //Create a new file in CMS
    else { 
      console.log("Metadata does not exists, creating a new one")

      const url2 = `${properties.base_url}/cms/instances/file/cms_file`
      const fetchOptions2 = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json',
          'Content-Type': 'application/hal+json' 
        },
        body: JSON.stringify({
          "name": pdfFileName,
          "description": "PDF File created from OCR of uploaded image",
          "parent_folder_id": folderId,
          "renditions": [{
              "name": pdfFileName,
              "rendition_type": "primary",
              "blob_id": uploadedFile.id,
              "mime_type": uploadedFile.mimeType
            }]
        })
      }

      const response2 = await fetch(url2, fetchOptions2)
      const data2 = await response2.json()
      setFileMetadata(data2)
    }
  }

  function retrieveFile() {
    const url =`${properties.css_url}/v2/content/${uploadedFile.id}/download?object-id=${fileMetadata.id}&file-name=${fileMetadata.name}&mime-type=${fileMetadata.mime_type}`

    const fetchOptions = {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/octet-stream"
      }
    }

    fetch(url, fetchOptions)
      .then(response => response.blob())
      .then(blob => {
        const fileURL = URL.createObjectURL(blob)
        let alink = document.createElement('a')
        alink.href = fileURL
        alink.download = fileMetadata.name
        alink.click()
        URL.revokeObjectURL(fileURL)
      })
      .catch(error => console.error("Error: ", error))
  }


  /***********************
   * Render page
   **********************/
  return (
    <main>
      <h1 className="ot2-sample-header">Create and Store a Text Searchable PDF using OpenText CMS, CSS and Capture Service</h1><br/>
      <div className="ot2-body">
      <div>
        <h3>1. Use Authentication API to obtain Access Token</h3>
        <textarea id="token" name="token" value={accessToken} placeholder={tokenPlaceholder} rows="8" cols="80" readOnly /><br/>
        <button onClick={getAuthToken}>Get Token</button><br/><br/>
      </div>
      <hr align='left' />
      <div>
        <h3>2. Upload File To Capture Service</h3>
        <label><b>Setp 1: </b></label>&nbsp;
            <label className="fileButton" htmlFor="upload">Select File
            <input id="upload" type="file" accept="image/*, .pdf" onChange={handleFile} />
        </label>
        <label>&nbsp;&nbsp;&nbsp; File Name: </label>
        <input type="text" name="fileName" value={file.name} size="35" readOnly/><br/><br/>
        <label><b>Setp 2: </b></label>&nbsp;
        <button onClick={handleUpload}>Upload File</button> 
        <label htmlFor='capturedFileId'>&nbsp;&nbsp; File Id: </label>
        <input type="text" name="capturedFileId" value={capturedFileId} placeholder={capFileIdPlaceholder} size="35" readOnly/><br/><br/>
      </div>
      <hr align='left' />
      <div>
        <h3>3. Convert Image into Text Searchable PDF</h3>
        <button onClick={createSearchablePDF}>Convert to Searchable PDF</button>
        <label htmlFor='ocrResponseId'>&nbsp;&nbsp; New File Id: </label>
        <input type="text" id="ocrResponseId" name="ocrResponseId" value={ocrResponse.resultItems[0].files[0].value} placeholder={ocrRespIdPlaceholder} size="35" readOnly/><br/><br/>
      </div>
      <hr align='left' />
      <div>
        <h3>4. Uploaded PDF to Content Storage</h3>
        <label><b>Step 1: </b></label>&nbsp;
        <button onClick={retrieveFileFromCaptureService}>Retrieve file from Capture Service</button>&nbsp;&nbsp;<i>{retrieveStatus}</i><br/><br/>
        <label><b>Step 2: </b></label>&nbsp;
        <button onClick={uploadFileToCSS}>Upload File To Content Storage</button>
        <label htmlFor='uploadedFileId'>&nbsp;&nbsp; CSS File Id: </label>
        <input type="text" name="uploadedFileId" value={uploadedFile.id} placeholder={uploadedFileIdPlaceholder} size="35" readOnly/><br/><br/>
      </div>
      <hr align='left' />
      <div>
        <h3>5. Create a folder for the file</h3>
        <label htmlFor='folderName'><b>Step 1: </b>&nbsp;Provide a folder name: </label>&nbsp;
        <input type="text" name="folderName" size="35" onChange={getFolderName} /><br/><br/>
        <label htmlFor='folderName'><b>Step 2: </b></label>&nbsp;
        <button onClick={createFolder}>Create Folder</button>&nbsp;&nbsp;
        <label htmlFor='folderId'>CMS Folder Id: </label>&nbsp;
        <input type="text" name="folderId" id="folderId" value={folderId} size="35" readOnly /><br/><br/>
      </div>
      <hr align='left' />
      <div>
        <h3>6. Create metadata for the PDF file</h3>
        <button onClick={createMetadataForFile}>Create Metadata</button>
        <label htmlFor='cmsFileId'>&nbsp;&nbsp; CMS File Id: </label>
        <input type="text" name="cmsFileId" value={fileMetadata.id} placeholder="" size="35" readOnly/><br/><br/>
      </div>
      <hr align='left' />
      <div>
        <h3>7. Download the PDF file from Content Storage</h3>
        <button onClick={retrieveFile}>Download the PDF File</button><br/><br/>
      </div>
      <hr align='left' />
      </div>
    </main>
  );
}
