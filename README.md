This node extends the node-red-google-contrib package by a node to Delete a File in the Google Cloud Storage.
It will only work if the [node-red-contrig-google-cloud](https://flows.nodered.org/node/node-red-contrib-google-cloud) node is also installed.

# Google Cloud Storage Delete

This node deletes a Google Cloud Store (GCS) object and returns the result.

At runtime, the value of msg.filename contains describes the file to delete.  The format of this field is a GCS Url of the form `gs://[BUCKET]/[FILE]`. 
Alternatively, we can specify the file to be read in the file name configuration property.  If both this property and a runtime value found in `msg.filename` are present, then the `msg.filename` name will be used.