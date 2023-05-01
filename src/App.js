import React from 'react';
import {properties} from './properties';

export default function App() {

  const [accessToken, setAccessToken] = React.useState()
  const [file, setFile] = React.useState()
  const [capturedFile, setCapturedFile] = React.useState({
    returnStatus: {},
    id: "",
    contentType: "",
    src: "",
    updated: ""
  })
  const [ocrResponse, setOCRResponse] = React.useState({
    returnStatus: {},
    id: "",
    serviceName: "",
    resultItems: [{
      "nodeId":0,
      "errorCode":"",
      "errorMessage":"",
      "values":[],
      "files":[{
          "name":"",
          "value":"",
          "contentType":"",
          "src":"",
          "fileType":""
      }]    
    }],
    licenseUsedPercent: 0,
    executionMilliSeconds: 0
  })

  const [tokenPlaceholder, setTokenPlaceholder] = React.useState("Authentication Token Information")
  const [capFileIdPlaceholder, setCapFileIdPlaceholder] = React.useState("")
  const [ocrRespIdPlaceholder, setOcrRespIdPlaceholder] = React.useState("")

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

  function handleFile(event) {
    setFile(event.target.files[0])
  }

  function handleUpload(event) {
    setCapFileIdPlaceholder("Processing...")

    const url = `${properties.base_url}/capture/cp-rest/v2/session/files`
    const fetchOptions = {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json",
        'Accept-Language': "en-US",
        'Content-Type': file.type,
        'Content-Length': `${file.size}`
      },
      body: file
    }

    //console.log("File: ", file)

    fetch(url, fetchOptions)
      .then(response => response.json())
      .then(data => setCapturedFile(data))
      .catch(error => console.error("Error: ", error))
  }

  function createSearchablePDF() {
    setOcrRespIdPlaceholder("Processing...")

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
              {"name": `${file.name}`,
                "value": `${capturedFile.id}`,
                "contentType": `${capturedFile.contentType}`
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

  function retrieveFile() {
    const url = `${properties.base_url}/capture/cp-rest/v2/session/files/${ocrResponse.resultItems[0].files[0].value}`
    const filename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
    
    const fetchOptions = {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "*/*"
      }
    }

    fetch(url, fetchOptions)
      .then(response => response.blob())
      .then(blob => {
        const fileURL = URL.createObjectURL(blob)
        let alink = document.createElement('a')
        alink.href = fileURL
        alink.download = filename
        alink.click()
        URL.revokeObjectURL(fileURL)
      })
      .catch(error => console.error("Error: ", error))
  }

  /*
  function endSession() {
    const url = `${properties.base_url}/capture/cp-rest/v2/session`
    const requestOptions = {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': "application/hal+json"
      }
    }

    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error("Error: ", error))
  }
  */

  return (
    <main>
      <h1>Create a Text Searchable PDF with Images or PDF</h1>
      <div>
        <h3>1. Obtain Authentication Token</h3>
        <textarea id="token" name="token" value={accessToken} placeholder={tokenPlaceholder} rows="10" cols="80" readOnly /><br/>
        <button onClick={getAuthToken}>Get Token</button><br/><br/>
      </div>
      <hr align='left' width='610'/>
      <div>
        <h3>2. Upload File To Capture Service</h3>
        <input type="file" name="file" accept="image/*, .pdf" onChange={handleFile}/><br/><br/>
        <button onClick={handleUpload}>Upload File</button> 
        <label htmlFor='capturedFileId'>&nbsp;&nbsp; File Id: </label>
        <input type="text" name="capturedFileId" value={capturedFile.id} placeholder={capFileIdPlaceholder} size="35" readOnly/><br/><br/>
      </div>
      <hr align='left' width='610'/>
      <div>
        <h3>3. Convert Image into Text Searchable PDF using Full Page OCR Service</h3>
        <button onClick={createSearchablePDF}>Convert to Searchable PDF</button>
        <label htmlFor='ocrResponseId'>&nbsp;&nbsp; New File Id: </label>
        <input type="text" id="ocrResponseId" name="ocrResponseId" value={ocrResponse.resultItems[0].files[0].value} placeholder={ocrRespIdPlaceholder} size="35" readOnly/><br/><br/>
      </div>
      <hr align='left' width='610'/>
      <div>
        <h3>4. Retrieve the PDF</h3>
        <button onClick={retrieveFile}>Retrieve Text Searchable PDF File</button><br/><br/>
      </div>
      <hr align='left' width='610'/>
    </main>
  );
}