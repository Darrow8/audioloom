// import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";

// async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
//     // Initialize Textract client
//     const client = new TextractClient({ region: "us-east-1" }); // Replace with your AWS region

//     try {
//         // Start the async document text detection
//         const startResponse = await client.send(
//             new StartDocumentTextDetectionCommand({
//                 DocumentLocation: {
//                     S3Object: {
//                         Bucket: "your-bucket-name",
//                         Name: "path/to/your/pdf"
//                     }
//                 }
//             })
//         );

//         if (!startResponse.JobId) {
//             throw new Error("Failed to start text detection job");
//         }

//         // Poll for job completion
//         let jobComplete = false;
//         let result = "";
        
//         while (!jobComplete) {
//             const getResponse = await client.send(
//                 new GetDocumentTextDetectionCommand({
//                     JobId: startResponse.JobId
//                 })
//             );

//             if (getResponse.JobStatus === "SUCCEEDED") {
//                 jobComplete = true;
                
//                 // Extract text from all blocks
//                 getResponse.Blocks?.forEach(block => {
//                     if (block.BlockType === "LINE" && block.Text) {
//                         result += block.Text + "\n";
//                     }
//                 });
//             } else if (getResponse.JobStatus === "FAILED") {
//                 throw new Error("Text detection job failed");
//             } else {
//                 // Wait for 5 seconds before polling again
//                 await new Promise(resolve => setTimeout(resolve, 5000));
//             }
//         }

//         return result.trim();
//     } catch (error) {
//         console.error("Error extracting text from PDF:", error);
//         throw error;
//     }
// }
