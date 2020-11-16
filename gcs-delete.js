/*
 *
 * The node type is "gcs-delete".
 *
 * This node will read the content of a GCS file (object) and place that data
 * in msg.payload before flowing onwards.  Alterantively, it can return the list
 * of objects found in the bucket.
 *
 * # Inputs
 * * msg.filename = File name to be read.  The file name will be of the form gs://[BUCKET]/[FILE_PATH]
 *
 * # Outputs
 *  * msg.payload  = Data read from file as a Buffer.
 *  * msg.metadata = The metadata associated with the file.
 *
 * If both msg.filename and configuration property filename are supplied then msg.filename will
 * be used.
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-gcs-delete";
    const {Storage} = require("@google-cloud/storage");

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function GCSDeleteNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        let storage;
        let credentials = null;
        const node = this;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;
        let fileName_option;
        if (!config.filename) {
            fileName_option = "";
        } else {
            fileName_option = config.filename.trim();
        }

        /**
         * Extract JSON service credentials key from "google-cloud-credentials" config node.
         */
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials


        async function deleteFile(msg, gsURL) {
            // At this point we have a URL of the form gs://[BUCKET]/[FILENAME].  We now want
            // to parse this out and get the bucket and file.

            const parts = gsURL.match(/gs:\/\/([^\/]*)\/(.*)$/);
            if (!parts && parts.length != 3) {
                node.error(`Badly formed URL: ${gsURL}`);
                return;
            }

            const bucketName = parts[1];
            const fileName   = parts[2];

            const bucket = storage.bucket(bucketName);
            const file   = bucket.file(fileName);

            msg.payload = null; // Set the initial output to be nothing.

            const result = await file.delete();
            msg.payload = result;
            node.send(msg); // Send the message onwards to the next node.

        } // deleteFile
        
        /**
         * Receive an input message for processing.
         * @param {*} msg 
         */
        function Input(msg) {
            let gsURL;

            if (!msg.filename && fileName_option === "") {   // Validate that we have been passed the mandatory filename parameter.
                node.error('No filename found in msg.filename or configuration.');
                return;
            }

            if (typeof msg.filename != "string" && fileName_option === "") { // Validate that the mandatory filename is a string.
                node.error("The msg.filename was not a string");
                return;
            }

            // We have two possibilities for supplying a filename.  These are msg.filename at runtime
            // and the filename configuration property.  If both are present, then msg.filename will
            // be used.
            if (msg.filename) {
                gsURL = msg.filename.trim();
            } else {
                gsURL = fileName_option;
            }

            deleteFile(msg, gsURL);

        } // Input


        /**
         * Cleanup this node.
         */
        function Close() {
        } // Close


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            storage = new Storage({
                "credentials": credentials
            });
        } else if (keyFilename) {
            storage = new Storage({
                "keyFilename": keyFilename
            });
        } else {
            storage = new Storage({});
        }

        node.on("input", Input);
        node.on("close", Close);
    } // GCSDeleteNode

    RED.nodes.registerType(NODE_TYPE, GCSDeleteNode); // Register the node.
};